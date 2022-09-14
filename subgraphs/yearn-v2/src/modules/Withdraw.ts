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
    withdrawTransaction.protocol = constants.PROTOCOL_ID;

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

export function calculateAmountWithdrawn(
  vaultAddress: Address,
  sharesBurnt: BigInt
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

  let amount = totalSupply.isZero()
    ? constants.BIGINT_ZERO
    : sharesBurnt.times(totalAssets).div(totalSupply);

  return amount;
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
  const protocol = getOrCreateYieldAggregator();

  if (
    sharesBurnt.toString() == "-1" ||
    sharesBurnt.toString() == constants.MAX_UINT256_STR
  ) {
    sharesBurnt = calculateSharesBurnt(vaultAddress, withdrawAmount);

    log.info(
      "[Withdraw_Shares_MAX_UINT] TxHash: {}, vaultAddress: {}, _sharesBurnt: {}, _withdrawAmount: {}",
      [
        transaction.hash.toHexString(),
        vault.id,
        sharesBurnt.toString(),
        withdrawAmount.toString(),
      ]
    );
  }

  if (
    withdrawAmount.toString() == "-1" ||
    withdrawAmount.toString() == constants.MAX_UINT256_STR
  ) {
    withdrawAmount = calculateAmountWithdrawn(vaultAddress, sharesBurnt);

    log.info(
      "[Withdraw_Amount_MAX_UINT] TxHash: {}, vaultAddress: {}, _sharesBurnt: {}, _withdrawAmount: {}",
      [
        transaction.hash.toHexString(),
        vault.id,
        sharesBurnt.toString(),
        withdrawAmount.toString(),
      ]
    );
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

  let totalSupply = utils.readValue<BigInt>(
    vaultContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );
  vault.outputTokenSupply = totalSupply;

  let totalAssets = utils.readValue<BigInt>(
    vaultContract.try_totalAssets(),
    constants.BIGINT_ZERO
  );
  vault.inputTokenBalance = totalAssets;

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
    .readValue<BigInt>(vaultContract.try_pricePerShare(), constants.BIGINT_ZERO)
    .toBigDecimal();

  vault.totalAssets = vault.totalAssets.minus(withdrawAmount);

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

  utils.updateProtocolTotalValueLockedUSD();
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
