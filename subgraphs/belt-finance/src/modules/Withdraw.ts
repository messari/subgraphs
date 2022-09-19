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
import { updateRevenueSnapshots } from "./Revenue";
import { Vault as VaultContract } from "../../generated/templates/Strategy/Vault";

export function createWithdrawTransaction(
  vault: VaultStore,
  amount: BigInt,
  amountUSD: BigDecimal,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): WithdrawTransaction {
  let withdrawTransactionId = "withdraw-" + transaction.hash.toHexString();

  let withdrawTransaction = WithdrawTransaction.load(withdrawTransactionId);

  if (!withdrawTransaction) {
    withdrawTransaction = new WithdrawTransaction(withdrawTransactionId);

    withdrawTransaction.vault = vault.id;
    withdrawTransaction.protocol = constants.PROTOCOL_ID.toHexString();

    withdrawTransaction.to = transaction.to!.toHexString();
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
  strategyAddress: Address,
  withdrawAmount: BigInt,
  sharesBurnt: BigInt,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
  const vault = getOrCreateVault(vaultAddress, block);
  let vaultContract = VaultContract.bind(vaultAddress);

  let inputToken = getOrCreateTokenFromString(vault.inputToken, block);

  let withdrawAmountUSD = withdrawAmount
    .divDecimal(
      constants.BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal()
    )
    .times(inputToken.lastPriceUSD!);

  let withdrawFeePercentage = utils.getStrategyWithdrawalFees(
    vaultAddress,
    strategyAddress
  );

  let withdrawalFeeUSD = withdrawAmountUSD
    .times(withdrawFeePercentage.feePercentage!)
    .div(constants.BIGDECIMAL_HUNDRED);

  vault.outputTokenSupply = utils.readValue<BigInt>(
    vaultContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  vault.inputTokenBalance = utils.readValue<BigInt>(
    vaultContract.try_calcPoolValueInToken(),
    constants.BIGINT_ZERO
  );

  vault.totalValueLockedUSD = vault.inputTokenBalance
    .divDecimal(
      constants.BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal()
    )
    .times(inputToken.lastPriceUSD!);

  vault.save();

  createWithdrawTransaction(
    vault,
    withdrawAmount,
    withdrawAmountUSD,
    transaction,
    block
  );

  updateRevenueSnapshots(
    vault,
    constants.BIGDECIMAL_ZERO,
    withdrawalFeeUSD,
    block
  );

  utils.updateProtocolTotalValueLockedUSD();
  UpdateMetricsAfterWithdraw(block);

  log.info(
    "[Withdraw] vault: {}, sharesBurnt: {}, withdrawAmount: {}, withdrawalFeeUSD: {}, withdrawAmountUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      sharesBurnt.toString(),
      withdrawAmount.toString(),
      withdrawalFeeUSD.toString(),
      withdrawAmountUSD.toString(),
      transaction.hash.toHexString(),
    ]
  );
}
