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

export function calculateSharesBurnt(
  vaultAddress: Address,
  withdrawAmount: BigInt
): BigInt {
  let vaultContract = VaultContract.bind(vaultAddress);
  let totalAssets = utils.readValue<BigInt>(
    vaultContract.try_totalAssets(),
    constants.BIGINT_ZERO
  );
  let totalSupply = utils.readValue<BigInt>(
    vaultContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );
  let sharesBurnt = totalAssets.equals(constants.BIGINT_ZERO)
    ? withdrawAmount
    : withdrawAmount.times(totalSupply).div(totalAssets);

  return sharesBurnt;
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

  if (sharesBurnt.equals(constants.MAX_UINT256)) {
    log.warning("[CalculateSharesBurnt] transaction: {}", [
      transaction.hash.toHexString(),
    ]);

    sharesBurnt = calculateSharesBurnt(vaultAddress, withdrawAmount);
  }

  let inputToken = Token.load(vault.inputToken);
  let inputTokenAddress = Address.fromString(vault.inputToken);
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
  let inputTokenDecimals = constants.BIGINT_TEN.pow(
    inputToken!.decimals as u8
  ).toBigDecimal();

  let withdrawAmountUSD = withdrawAmount
    .toBigDecimal()
    .div(inputTokenDecimals)
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  vault.totalValueLockedUSD = vault.totalValueLockedUSD.minus(
    withdrawAmountUSD
  );
  protocol.totalValueLockedUSD = vault.totalValueLockedUSD;

  vault.inputTokenBalance = vault.inputTokenBalance.minus(withdrawAmount);
  vault.outputTokenSupply = vault.outputTokenSupply.minus(sharesBurnt);

  vault.outputTokenPriceUSD = getPriceOfOutputTokens(
    vaultAddress,
    inputTokenAddress,
    inputTokenDecimals
  );

  vault.pricePerShare = utils
    .readValue<BigInt>(vaultContract.try_pricePerShare(), constants.BIGINT_ZERO)
    .toBigDecimal();
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
