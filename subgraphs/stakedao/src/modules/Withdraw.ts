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

    withdrawTransaction.timestamp = utils.getTimestampInMillis(block);
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

  // calculate withdraw amount as per the withdraw function in vault
  // contract address
  let withdrawAmount = vault.inputTokenBalance
    .times(sharesBurnt)
    .div(vault.outputTokenSupply);

  let inputToken = Token.load(vault.inputToken);
  let inputTokenAddress = Address.fromString(vault.inputToken);
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
  let inputTokenDecimals = constants.BIGINT_TEN.pow(
    inputToken!.decimals as u8
  ).toBigDecimal();

  vault.inputTokenBalance = vault.inputTokenBalance.minus(withdrawAmount);
  vault.outputTokenSupply = vault.outputTokenSupply.minus(sharesBurnt);

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

  vault.totalValueLockedUSD = vault.totalValueLockedUSD.minus(
    withdrawAmountUSD
  );
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(
    withdrawAmountUSD
  );

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

  log.info(
    "[Withdrawn] TxHash: {}, vaultAddress: {}, sharesBurnt: {}, supplySideWithdrawAmount: {}, protocolSideWithdrawAmount: {}",
    [
      transaction.hash.toHexString(),
      vault.id,
      sharesBurnt.toString(),
      supplySideWithdrawalAmount.toString(),
      protocolSideWithdrawalAmount.toString()
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
