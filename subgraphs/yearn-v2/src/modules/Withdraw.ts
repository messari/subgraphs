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
} from "../common/initializers";
import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../Prices";
import * as constants from "../common/constants";
import { getPriceOfOutputTokens } from "./Price";
import { Vault as VaultContract } from "../../generated/Registry_v1/Vault";

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
  withdrawAmount: BigInt,
  sharesBurnt: BigInt
): void {
  const vaultAddress = Address.fromString(vault.id);
  const vaultContract = VaultContract.bind(vaultAddress);
  const protocol = getOrCreateYieldAggregator(constants.ETHEREUM_PROTOCOL_ID);

  let inputToken = Token.load(vault.inputToken);
  let inputTokenAddress = Address.fromString(vault.inputToken);
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
  let inputTokenDecimals = constants.BIGINT_TEN.pow(inputToken!.decimals as u8);

  vault.inputTokenBalance = vault.inputTokenBalance.minus(withdrawAmount);
  vault.outputTokenSupply = vault.outputTokenSupply.minus(sharesBurnt);

  vault.totalValueLockedUSD = inputTokenPrice.usdPrice
    .times(vault.inputTokenBalance.toBigDecimal())
    .div(inputTokenDecimals.toBigDecimal())
    .div(inputTokenPrice.decimalsBaseTen);

  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(
    inputTokenPrice.usdPrice
      .times(withdrawAmount.toBigDecimal())
      .div(inputTokenDecimals.toBigDecimal())
      .div(inputTokenPrice.decimalsBaseTen)
  );

  vault.outputTokenPriceUSD = getPriceOfOutputTokens(
    vaultAddress,
    inputTokenAddress,
    inputTokenDecimals.toBigDecimal()
  );

  vault.pricePerShare = utils
    .readValue<BigInt>(vaultContract.try_pricePerShare(), constants.BIGINT_ZERO)
    .toBigDecimal();
  vault.save();

  let withdrawAmountUSD = inputTokenPrice.usdPrice
    .times(withdrawAmount.toBigDecimal())
    .div(inputTokenDecimals.toBigDecimal())
    .div(inputTokenPrice.decimalsBaseTen);

  createWithdrawTransaction(
    to,
    vaultAddress,
    transaction,
    block,
    vault.inputToken,
    withdrawAmount,
    withdrawAmountUSD
  );

  // Update hourly and daily withdraw transaction count
  const metricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(block);
  const metricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(block);

  metricsDailySnapshot.dailyWithdrawCount += 1;
  metricsHourlySnapshot.hourlyWithdrawCount += 1;

  metricsDailySnapshot.save();
  metricsHourlySnapshot.save();
  protocol.save();

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
