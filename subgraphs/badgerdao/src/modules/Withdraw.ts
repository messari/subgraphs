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
  getOrCreateToken,
  getOrCreateYieldAggregator,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "../common/initializers";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { getPriceOfOutputTokens } from "./Prices";
import { Vault as VaultContract } from "../../generated/templates/Strategy/Vault";

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
  sharesBurnt: BigInt,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
  const vault = getOrCreateVault(vaultAddress, block);

  const vaultContract = VaultContract.bind(vaultAddress);

  if (sharesBurnt.equals(constants.BIGINT_NEGATIVE_ONE)) {
    const totalSupply = utils.readValue<BigInt>(
      vaultContract.try_totalSupply(),
      constants.BIGINT_ZERO
    );

    sharesBurnt = vault.outputTokenSupply!.minus(totalSupply);
  }

  const withdrawAmount = vault.outputTokenSupply!.isZero()
    ? constants.BIGINT_ZERO
    : sharesBurnt.times(vault.inputTokenBalance).div(vault.outputTokenSupply!);

  const inputToken = getOrCreateToken(
    Address.fromString(vault.inputToken),
    block
  );
  const inputTokenDecimals = constants.BIGINT_TEN.pow(
    inputToken!.decimals as u8
  ).toBigDecimal();

  const withdrawAmountUSD = withdrawAmount
    .divDecimal(inputTokenDecimals)
    .times(inputToken.lastPriceUSD!);

  const totalSupply = utils.readValue<BigInt>(
    vaultContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );
  vault.outputTokenSupply = totalSupply;

  vault.inputTokenBalance = utils.readValue<BigInt>(
    vaultContract.try_balance(),
    constants.BIGINT_ZERO
  );

  vault.totalValueLockedUSD = vault.inputTokenBalance
    .divDecimal(inputTokenDecimals)
    .times(inputToken.lastPriceUSD!);

  vault.outputTokenPriceUSD = getPriceOfOutputTokens(
    vaultAddress,
    inputTokenDecimals,
    block
  );

  vault.save();

  createWithdrawTransaction(
    vault,
    withdrawAmount,
    withdrawAmountUSD,
    transaction,
    block
  );

  utils.updateProtocolTotalValueLockedUSD();
  UpdateMetricsAfterWithdraw(block);

  log.info(
    "[Withdrawn] TxHash: {}, vaultAddress: {}, _sharesBurnt: {}, _withdrawAmount: {}",
    [
      transaction.hash.toHexString(),
      vault.id,
      sharesBurnt.toString(),
      withdrawAmount.toString(),
    ]
  );
}
