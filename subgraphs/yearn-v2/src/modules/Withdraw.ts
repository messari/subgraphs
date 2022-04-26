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
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "../common/initializers";
import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../Prices";
import * as constants from "../common/constants";
import { getPriceOfOutputTokens } from "./Price";
import { Vault as VaultContract } from "../../generated/Registry_v1/Vault";

export function createWithdrawTransaction(
  call: ethereum.Call,
  assetId: string,
  amount: BigInt,
  amountUSD: BigDecimal
): WithdrawTransaction {
  let transactionId = "withdraw-" + call.transaction.hash.toHexString();

  let transaction = WithdrawTransaction.load(transactionId);

  if (!transaction) {
    transaction = new WithdrawTransaction(transactionId);

    transaction.vault = call.to.toHexString();
    transaction.protocol = constants.ETHEREUM_PROTOCOL_ID;

    transaction.to = call.to.toHexString();
    transaction.from = call.transaction.from.toHexString();

    transaction.hash = call.transaction.hash.toHexString();
    transaction.logIndex = call.transaction.index.toI32();

    transaction.asset = assetId;
    transaction.amount = amount;
    transaction.amountUSD = amountUSD;

    transaction.timestamp = utils.getTimestampInMillis(call.block);
    transaction.blockNumber = call.block.number;

    transaction.save();
  }

  return transaction;
}

export function _Withdraw(
  call: ethereum.Call,
  vault: VaultStore,
  withdrawAmount: BigInt,
  sharesBurnt: BigInt
): void {
  const vaultAddress = Address.fromString(vault.id);
  const vaultContract = VaultContract.bind(vaultAddress);

  let inputToken = Token.load(vault.inputToken);
  let inputTokenAddress = Address.fromString(vault.inputToken);
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
  let inputTokenDecimals = constants.BIGINT_TEN.pow(inputToken!.decimals as u8);

  vault.totalValueLockedUSD = inputTokenPrice.usdPrice
    .times(vault.inputTokenBalance.toBigDecimal())
    .div(inputTokenDecimals.toBigDecimal())
    .div(inputTokenPrice.decimals.toBigDecimal());

  vault.inputTokenBalance = vault.inputTokenBalance.minus(withdrawAmount);
  vault.outputTokenSupply = vault.outputTokenSupply.minus(sharesBurnt);

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
    .div(inputTokenPrice.decimals.toBigDecimal());

  createWithdrawTransaction(
    call,
    vault.inputToken,
    withdrawAmount,
    withdrawAmountUSD
  );

  // Update hourly and daily withdraw transaction count
  const metricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(call.block);
  const metricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(
    call.block
  );

  metricsDailySnapshot.dailyWithdrawCount += 1;
  metricsHourlySnapshot.hourlyWithdrawCount += 1;

  metricsDailySnapshot.save();
  metricsHourlySnapshot.save();

  log.info(
    "[Withdrawn] TxHash: {}, vaultAddress: {}, _sharesBurnt: {}, _withdrawAmount: {}",
    [
      call.transaction.hash.toHexString(),
      vault.id,
      sharesBurnt.toString(),
      withdrawAmount.toString(),
    ]
  );
}
