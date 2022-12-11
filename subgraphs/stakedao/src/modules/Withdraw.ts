import {
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
  getOrCreateVault,
  getOrCreateYieldAggregator,
  getOrCreateTokenFromString,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "../common/initializers";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { getPriceOfOutputTokens } from "./Price";
import { updateRevenueSnapshots } from "./Revenue";
import { Vault as VaultContract } from "../../generated/Controller/Vault";
import { Strategy as StrategyContract } from "../../generated/controller/Strategy";
import { StableMaster as StableMasterContract } from "../../generated/controller/StableMaster";

export function createWithdrawTransaction(
  vault: VaultStore,
  amount: BigInt,
  amountUSD: BigDecimal,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): WithdrawTransaction {
  const withdrawTransactionId = "withdraw-" + transaction.hash.toHexString();

  let withdrawTransaction = WithdrawTransaction.load(withdrawTransactionId);

  if (!withdrawTransaction) {
    withdrawTransaction = new WithdrawTransaction(withdrawTransactionId);

    withdrawTransaction.vault = vault.id;
    withdrawTransaction.protocol = constants.PROTOCOL_ID;

    withdrawTransaction.to = constants.NULL.TYPE_STRING;
    if (transaction.to) withdrawTransaction.to = transaction.to!.toHexString();
    withdrawTransaction.from = transaction.from.toHexString();

    withdrawTransaction.hash = transaction.hash.toHexString();
    withdrawTransaction.logIndex = transaction.index.toI32();

    withdrawTransaction.asset = vault.inputToken;
    withdrawTransaction.amount = amount;
    withdrawTransaction.amountUSD = amountUSD;

    withdrawTransaction.timestamp = block.timestamp;
    withdrawTransaction.blockNumber = block.number;

    withdrawTransaction.save();
  }

  return withdrawTransaction;
}

export function UpdateMetricsAfterWithdraw(block: ethereum.Block): void {
  const protocol = getOrCreateYieldAggregator();

  // Update hourly and daily deposit transaction count
  const metricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(block);
  const metricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(block);

  metricsDailySnapshot.dailyWithdrawCount += 1;
  metricsHourlySnapshot.hourlyWithdrawCount += 1;

  metricsDailySnapshot.save();
  metricsHourlySnapshot.save();

  protocol.save();
}

export function Withdraw(
  vaultAddress: Address,
  withdrawAmount: BigInt | null,
  sharesBurnt: BigInt,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
  const vault = getOrCreateVault(vaultAddress, block);
  const vaultContract = VaultContract.bind(vaultAddress);

  const strategyAddress = Address.fromString(vault._strategy);
  const strategyContract = StrategyContract.bind(strategyAddress);

  if (vaultAddress.equals(constants.ANGLE_USDC_VAULT_ADDRESS)) {
    const stableMasterContract = StableMasterContract.bind(
      constants.STABLE_MASTER_ADDRESS
    );
    const collateralMap = stableMasterContract.collateralMap(
      constants.POOL_MANAGER_ADDRESS
    );
    const sanRate = collateralMap.value5;
    const slpDataSlippage = collateralMap.value7.slippage;

    // StableMasterFront: (amount * (BASE_PARAMS - col.slpData.slippage) * col.sanRate) / (BASE_TOKENS * BASE_PARAMS)
    withdrawAmount = sharesBurnt
      .times(constants.BASE_PARAMS.minus(slpDataSlippage))
      .times(sanRate)
      .div(constants.BASE_TOKENS.times(constants.BASE_PARAMS));
  }

  if (!withdrawAmount) {
    // calculate withdraw amount as per the withdraw function in vault
    // contract address
    if (vault.outputTokenSupply!.notEqual(constants.BIGINT_ZERO)) {
      withdrawAmount = vault.inputTokenBalance
        .times(sharesBurnt)
        .div(vault.outputTokenSupply!);
    } else {
      withdrawAmount = sharesBurnt;
    }
  }

  vault.inputTokenBalance = utils.getVaultBalance(vaultAddress);

  vault.outputTokenSupply = utils.readValue(
    vaultContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  const withdrawalFees = utils
    .readValue<BigInt>(
      strategyContract.try_withdrawalFee(),
      constants.BIGINT_ZERO
    )
    .divDecimal(constants.DENOMINATOR);

  const inputToken = getOrCreateTokenFromString(vault.inputToken, block);
  const inputTokenDecimals = constants.BIGINT_TEN.pow(
    inputToken.decimals as u8
  ).toBigDecimal();

  const protocolSideWithdrawalAmount = withdrawAmount
    .divDecimal(inputTokenDecimals)
    .times(withdrawalFees);

  const supplySideWithdrawalAmount = withdrawAmount
    .divDecimal(inputTokenDecimals)
    .minus(protocolSideWithdrawalAmount);

  const withdrawAmountUSD = supplySideWithdrawalAmount.times(
    inputToken.lastPriceUSD!
  );

  vault.totalValueLockedUSD = vault.inputTokenBalance
    .divDecimal(inputTokenDecimals)
    .times(inputToken.lastPriceUSD!);

  vault.outputTokenPriceUSD = getPriceOfOutputTokens(
    vaultAddress,
    Address.fromString(vault.inputToken),
    inputTokenDecimals
  );

  vault.pricePerShare = utils.getPricePerFullShare(vaultAddress);

  vault.save();

  const protocolSideWithdrawalAmountUSD = protocolSideWithdrawalAmount
    .div(inputTokenDecimals)
    .times(inputToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    constants.BIGDECIMAL_ZERO,
    protocolSideWithdrawalAmountUSD,
    block
  );

  createWithdrawTransaction(
    vault,
    withdrawAmount,
    withdrawAmountUSD,
    transaction,
    block
  );

  utils.updateProtocolTotalValueLockedUSD();
  UpdateMetricsAfterWithdraw(block);

  log.warning(
    "[Withdrawn] vaultAddress: {}, withdrawAmount: {}, sharesBurnt: {}, supplySideWithdrawAmount: {}, protocolSideWithdrawAmount: {}, TxHash: {}",
    [
      vault.id,
      withdrawAmount.toString(),
      sharesBurnt.toString(),
      supplySideWithdrawalAmount.toString(),
      protocolSideWithdrawalAmount.toString(),
      transaction.hash.toHexString(),
    ]
  );
}
