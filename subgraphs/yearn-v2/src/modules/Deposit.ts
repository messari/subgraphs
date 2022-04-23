import {
  Token,
  Vault as VaultStore,
  Deposit as DepositTransaction,
} from "../../generated/schema";
import {
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "../common/initializers";
import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../Prices";
import { getPriceOfOutputTokens } from "./Price";
import * as constants from "../common/constants";
import { Vault as VaultContract } from "../../generated/Registry_v1/Vault";


export function createDepositTransaction(
  call: ethereum.Call,
  assetId: string,
  amount: BigInt,
  amountUSD: BigDecimal
): DepositTransaction {
  let transactionId = "deposit-" + call.transaction.hash.toHexString();

  let transaction = DepositTransaction.load(transactionId);

  if (!transaction) {
    transaction = new DepositTransaction(transactionId);

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

export function calculateAmountDeposited(
  vaultAddress: Address,
  sharesMinted: BigInt
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
    : sharesMinted.times(totalAssets).div(totalSupply);

  return amount;
}

export function _Deposit(
  call: ethereum.Call,
  vault: VaultStore,
  sharesMinted: BigInt,
  depositAmount: BigInt | null = null
): void {
  const vaultAddress = Address.fromString(vault.id);
  const vaultContract = VaultContract.bind(vaultAddress);

  if (!depositAmount) {
    depositAmount = calculateAmountDeposited(vaultAddress, sharesMinted);
  }

  let inputToken = Token.load(vault.inputToken);
  let inputTokenAddress = Address.fromString(vault.inputToken);
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
  let inputTokenDecimals = constants.BIGINT_TEN.pow(inputToken!.decimals as u8);

  vault.totalValueLockedUSD = inputTokenPrice.usdPrice
    .times(vault.inputTokenBalance.toBigDecimal())
    .div(inputTokenDecimals.toBigDecimal())
    .div(inputTokenPrice.decimals.toBigDecimal());

  vault.inputTokenBalance = vault.inputTokenBalance.plus(depositAmount);
  vault.outputTokenSupply = vault.outputTokenSupply.plus(sharesMinted);

  vault.outputTokenPriceUSD = getPriceOfOutputTokens(
    vaultAddress,
    inputTokenAddress,
    inputTokenDecimals.toBigDecimal()
  );

  vault.pricePerShare = utils.readValue<BigInt>(
    vaultContract.try_pricePerShare(),
    constants.BIGINT_ZERO
  ).toBigDecimal();
  vault.save();

  let depositAmountUSD = inputTokenPrice.usdPrice
    .times(depositAmount.toBigDecimal())
    .div(inputTokenDecimals.toBigDecimal())
    .div(inputTokenPrice.decimals.toBigDecimal());

  createDepositTransaction(
    call,
    vault.inputToken,
    depositAmount,
    depositAmountUSD
  );

  // Update hourly and daily deposit transaction count
  const metricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(call.block);
  const metricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(
    call.block
  );

  metricsDailySnapshot.dailyDepositCount += 1;
  metricsHourlySnapshot.hourlyDepositCount += 1;

  metricsDailySnapshot.save();
  metricsHourlySnapshot.save();

  log.info(
    "[Deposit] TxHash: {}, vaultAddress: {}, _sharesMinted: {}, _depositAmount: {}",
    [
      call.transaction.hash.toHexString(),
      vault.id,
      sharesMinted.toString(),
      depositAmount.toString(),
    ]
  );
}
