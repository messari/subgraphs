import {
  Token,
  Vault as VaultStore,
  Deposit as DepositTransaction,
} from "../../generated/schema";
import {
  getOrCreateYieldAggregator,
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
  to: Address,
  vaultAddress: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  assetId: string,
  amount: BigInt,
  amountUSD: BigDecimal
): DepositTransaction {
  const transactionId = "deposit-" + transaction.hash.toHexString();

  let depositTransaction = DepositTransaction.load(transactionId);

  if (!depositTransaction) {
    depositTransaction = new DepositTransaction(transactionId);

    depositTransaction.vault = vaultAddress.toHexString();
    depositTransaction.protocol = constants.PROTOCOL_ID;

    depositTransaction.to = to.toHexString();
    depositTransaction.from = transaction.from.toHexString();

    depositTransaction.hash = transaction.hash.toHexString();
    // log index is zero cause no events are emitted on vault deposit
    depositTransaction.logIndex = 0;

    depositTransaction.asset = assetId;
    depositTransaction.amount = amount;
    depositTransaction.amountUSD = amountUSD;

    depositTransaction.timestamp = block.timestamp;
    depositTransaction.blockNumber = block.number;

    depositTransaction.save();
  }

  return depositTransaction;
}

export function calculateAmountDeposited(
  vaultAddress: Address,
  sharesMinted: BigInt
): BigInt {
  const vaultContract = VaultContract.bind(vaultAddress);
  const totalAssets = utils.readValue<BigInt>(
    vaultContract.try_totalAssets(),
    constants.BIGINT_ZERO
  );
  const totalSupply = utils.readValue<BigInt>(
    vaultContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  const amount = totalSupply.isZero()
    ? constants.BIGINT_ZERO
    : sharesMinted.times(totalAssets).div(totalSupply);

  return amount;
}

export function _Deposit(
  to: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  vault: VaultStore,
  sharesMinted: BigInt,
  depositAmount: BigInt
): void {
  const vaultAddress = Address.fromString(vault.id);
  const vaultContract = VaultContract.bind(vaultAddress);
  const protocol = getOrCreateYieldAggregator();

  if (
    depositAmount.toString() == "-1" ||
    depositAmount.toString() == constants.MAX_UINT256_STR
  ) {
    depositAmount = calculateAmountDeposited(vaultAddress, sharesMinted);

    log.info(
      "[Deposit_MAX_UINT] TxHash: {}, vaultAddress: {}, _sharesMinted: {}, _depositAmount: {}",
      [
        transaction.hash.toHexString(),
        vault.id,
        sharesMinted.toString(),
        depositAmount.toString(),
      ]
    );
  }

  const inputToken = Token.load(vault.inputToken);
  const inputTokenAddress = Address.fromString(vault.inputToken);
  const inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
  const inputTokenDecimals = constants.BIGINT_TEN.pow(
    inputToken!.decimals as u8
  ).toBigDecimal();

  const depositAmountUSD = depositAmount
    .toBigDecimal()
    .div(inputTokenDecimals)
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  const totalSupply = utils.readValue<BigInt>(
    vaultContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );
  vault.outputTokenSupply = totalSupply;

  const totalAssets = utils.readValue<BigInt>(
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
  vault.totalAssets = vault.totalAssets.plus(depositAmount);

  vault.save();

  createDepositTransaction(
    to,
    vaultAddress,
    transaction,
    block,
    vault.inputToken,
    depositAmount,
    depositAmountUSD
  );

  // Update hourly and daily deposit transaction count
  const metricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(block);
  const metricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(block);

  metricsDailySnapshot.dailyDepositCount += 1;
  metricsHourlySnapshot.hourlyDepositCount += 1;

  metricsDailySnapshot.save();
  metricsHourlySnapshot.save();

  protocol.save();

  utils.updateProtocolTotalValueLockedUSD();
  log.info(
    "[Deposit] TxHash: {}, vaultAddress: {}, _sharesMinted: {}, _depositAmount: {}",
    [
      transaction.hash.toHexString(),
      vault.id,
      sharesMinted.toString(),
      depositAmount.toString(),
    ]
  );
}
