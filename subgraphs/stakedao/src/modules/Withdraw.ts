import {
  Token,
  Vault as VaultStore,
  Withdraw as WithdrawTransaction,
} from "../../generated/schema";
import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import {
  getOrCreateYieldAggregator,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
  getOrCreateFinancialDailySnapshots,
} from "../common/initializers";
import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../Prices";
import * as constants from "../common/constants";
import { getPriceOfOutputTokens } from "./Price";
import { Vault as VaultContract } from "../../generated/Controller/Vault";
import { Strategy as StrategyContract } from "../../generated/controller/Strategy";
import { StableMaster as StableMasterContract } from "../../generated/controller/StableMaster";

export function createWithdrawTransaction(
  to: Address,
  vaultAddress: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  assetId: string,
  amount: BigInt,
  amountUSD: BigDecimal
): WithdrawTransaction {
  let withdrawTransactionId = "withdraw-" + transaction.hash.toHexString();

  let withdrawTransaction = WithdrawTransaction.load(withdrawTransactionId);

  if (!withdrawTransaction) {
    withdrawTransaction = new WithdrawTransaction(withdrawTransactionId);

    withdrawTransaction.vault = vaultAddress.toHexString();
    withdrawTransaction.protocol = constants.ETHEREUM_PROTOCOL_ID;

    withdrawTransaction.to = to.toHexString();
    withdrawTransaction.from = transaction.from.toHexString();

    withdrawTransaction.hash = transaction.hash.toHexString();
    withdrawTransaction.logIndex = transaction.index.toI32();

    withdrawTransaction.asset = assetId;
    withdrawTransaction.amount = amount;
    withdrawTransaction.amountUSD = amountUSD;

    withdrawTransaction.timestamp = block.timestamp;
    withdrawTransaction.blockNumber = block.number;

    withdrawTransaction.save();
  }

  return withdrawTransaction;
}

export function _Withdraw(
  to: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  vault: VaultStore,
  sharesBurnt: BigInt
): void {
  const protocol = getOrCreateYieldAggregator();
  const vaultAddress = Address.fromString(vault.id);
  const vaultContract = VaultContract.bind(vaultAddress);

  const strategyAddress = Address.fromString(vault._strategy);
  const strategyContract = StrategyContract.bind(strategyAddress);

  let withdrawAmount: BigInt;
  if (vaultAddress.equals(constants.ANGLE_USDC_VAULT_ADDRESS)) {
    const stableMasterContract = StableMasterContract.bind(
      constants.STABLE_MASTER_ADDRESS
    );
    const collateralMap = stableMasterContract.collateralMap(
      constants.POOL_MANAGER_ADDRESS
    );
    let sanRate = collateralMap.value5;
    let slpDataSlippage = collateralMap.value7.slippage;

    // StableMasterFront: (amount * (BASE_PARAMS - col.slpData.slippage) * col.sanRate) / (BASE_TOKENS * BASE_PARAMS)
    withdrawAmount = sharesBurnt
      .times(constants.BASE_PARAMS.minus(slpDataSlippage))
      .times(sanRate)
      .div(constants.BASE_TOKENS.times(constants.BASE_PARAMS));
  } else {
    
    // calculate withdraw amount as per the withdraw function in vault
    // contract address
    withdrawAmount = vault.inputTokenBalance
      .times(sharesBurnt)
      .div(vault.outputTokenSupply!);
  }

  let inputToken = Token.load(vault.inputToken);
  let inputTokenAddress = Address.fromString(vault.inputToken);
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
  let inputTokenDecimals = constants.BIGINT_TEN.pow(
    inputToken!.decimals as u8
  ).toBigDecimal();

  vault.inputTokenBalance = vault.inputTokenBalance.minus(withdrawAmount);
  vault.outputTokenSupply = vault.outputTokenSupply!.minus(sharesBurnt);

  const withdrawalFees = utils
    .readValue<BigInt>(
      strategyContract.try_withdrawalFee(),
      constants.BIGINT_ZERO
    )
    .toBigDecimal()
    .div(constants.DENOMINATOR);

  const protocolSideWithdrawalAmount = withdrawAmount
    .toBigDecimal()
    .times(withdrawalFees)
    .div(inputTokenDecimals);

  const supplySideWithdrawalAmount = withdrawAmount
    .toBigDecimal()
    .div(inputTokenDecimals)
    .minus(protocolSideWithdrawalAmount);

  let withdrawAmountUSD = supplySideWithdrawalAmount
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  vault.totalValueLockedUSD = vault.inputTokenBalance
    .toBigDecimal()
    .div(inputTokenDecimals)
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  vault.outputTokenPriceUSD = getPriceOfOutputTokens(
    vaultAddress,
    inputTokenAddress,
    inputTokenDecimals
  );

  vault.pricePerShare = utils
    .readValue<BigInt>(
      vaultContract.try_getPricePerFullShare(),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  const protocolSideWithdrawalAmountUSD = protocolSideWithdrawalAmount
    .div(inputTokenDecimals)
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  // Update hourly and daily withdraw transaction count
  const metricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(block);
  const metricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(block);

  metricsDailySnapshot.dailyWithdrawCount += 1;
  metricsHourlySnapshot.hourlyWithdrawCount += 1;

  metricsDailySnapshot.save();
  metricsHourlySnapshot.save();
  protocol.save();
  vault.save();

  utils.updateProtocolTotalValueLockedUSD();

  createWithdrawTransaction(
    to,
    vaultAddress,
    transaction,
    block,
    vault.inputToken,
    withdrawAmount,
    withdrawAmountUSD
  );

  updateFinancialsAfterWithdrawal(block, protocolSideWithdrawalAmountUSD);

  log.warning(
    "[Withdrawn] TxHash: {}, vaultAddress: {}, withdrawAmount: {}, sharesBurnt: {}, supplySideWithdrawAmount: {}, protocolSideWithdrawAmount: {}",
    [
      transaction.hash.toHexString(),
      vault.id,
      withdrawAmount.toString(),
      sharesBurnt.toString(),
      supplySideWithdrawalAmount.toString(),
      protocolSideWithdrawalAmount.toString(),
    ]
  );
}

export function updateFinancialsAfterWithdrawal(
  block: ethereum.Block,
  protocolSideRevenueUSD: BigDecimal
): void {
  const financialMetrics = getOrCreateFinancialDailySnapshots(block);
  const protocol = getOrCreateYieldAggregator();

  // TotalRevenueUSD Metrics
  financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(
    protocolSideRevenueUSD
  );
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(
    protocolSideRevenueUSD
  );
  financialMetrics.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;

  // ProtocolSideRevenueUSD Metrics
  financialMetrics.dailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );
  financialMetrics.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;

  financialMetrics.save();
  protocol.save();
}
