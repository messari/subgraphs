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
  let transactionId = "deposit-" + transaction.hash.toHexString();

  let depositTransaction = DepositTransaction.load(transactionId);

  if (!depositTransaction) {
    depositTransaction = new DepositTransaction(transactionId);

    depositTransaction.vault = vaultAddress.toHexString();
    depositTransaction.protocol = constants.ETHEREUM_PROTOCOL_ID;

    depositTransaction.to = to.toHexString();
    depositTransaction.from = transaction.from.toHexString();

    depositTransaction.hash = transaction.hash.toHexString();
    depositTransaction.logIndex = transaction.index.toI32();

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
  to: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  vault: VaultStore,
  sharesMinted: BigInt,
  depositAmount: BigInt
): void {
  const vaultAddress = Address.fromString(vault.id);
  const vaultContract = VaultContract.bind(vaultAddress);
  const protocol = getOrCreateYieldAggregator(constants.ETHEREUM_PROTOCOL_ID);

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

  let inputToken = Token.load(vault.inputToken);
  let inputTokenAddress = Address.fromString(vault.inputToken);
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
  let inputTokenDecimals = constants.BIGINT_TEN.pow(
    inputToken!.decimals as u8
  ).toBigDecimal();

  let depositAmountUSD = depositAmount
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
