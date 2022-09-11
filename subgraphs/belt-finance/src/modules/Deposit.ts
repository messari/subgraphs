import {
  Vault as VaultStore,
  Deposit as DepositTransaction,
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
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "../common/initializers";
import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../prices";
import * as constants from "../common/constants";
import { updateRevenueSnapshots } from "./Revenue";
import { getPriceOfOutputTokens, getPricePerShare } from "./Prices";
import { Vault as VaultContract } from "../../generated/templates/Strategy/Vault";

export function createDepositTransaction(
  vault: VaultStore,
  amount: BigInt,
  amountUSD: BigDecimal,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): DepositTransaction {
  let transactionId = "deposit-" + transaction.hash.toHexString();

  let depositTransaction = DepositTransaction.load(transactionId);

  if (!depositTransaction) {
    depositTransaction = new DepositTransaction(transactionId);

    depositTransaction.vault = vault.id;
    depositTransaction.protocol = constants.PROTOCOL_ID.toHexString();

    depositTransaction.to = vault.id;
    depositTransaction.from = transaction.from.toHexString();

    depositTransaction.hash = transaction.hash.toHexString();
    depositTransaction.logIndex = transaction.index.toI32();

    depositTransaction.asset = vault.inputToken;
    depositTransaction.amount = amount;
    depositTransaction.amountUSD = amountUSD;

    depositTransaction.timestamp = block.timestamp;
    depositTransaction.blockNumber = block.number;

    depositTransaction.save();
  }

  return depositTransaction;
}

export function UpdateMetricsAfterDeposit(block: ethereum.Block): void {
  const protocol = getOrCreateYieldAggregator();

  // Update hourly and daily deposit transaction count
  const metricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(block);
  const metricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(block);

  metricsDailySnapshot.dailyDepositCount += 1;
  metricsHourlySnapshot.hourlyDepositCount += 1;

  metricsDailySnapshot.save();
  metricsHourlySnapshot.save();

  protocol.save();
}

export function Deposit(
  vaultAddress: Address,
  strategyAddress: Address,
  depositAmount: BigInt,
  sharesMinted: BigInt,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
  const vault = getOrCreateVault(vaultAddress, block);
  let vaultContract = VaultContract.bind(vaultAddress);

  let inputTokenAddress = Address.fromString(vault.inputToken);
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
  let inputTokenDecimals = utils.getTokenDecimals(inputTokenAddress);

  let depositAmountUSD = depositAmount
    .divDecimal(inputTokenDecimals)
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  let depositFeePercentage = utils.getStrategyWithdrawalFees(
    vaultAddress,
    strategyAddress
  );

  let depositFeeUSD = depositAmountUSD
    .times(depositFeePercentage.feePercentage!)
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
    .divDecimal(inputTokenDecimals)
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  let pricePerShare = getPricePerShare(vaultAddress);
  vault.pricePerShare = pricePerShare.toBigDecimal();
  vault.outputTokenPriceUSD = getPriceOfOutputTokens(vaultAddress);

  vault.save();

  createDepositTransaction(
    vault,
    depositAmount,
    depositAmountUSD,
    transaction,
    block
  );

  updateRevenueSnapshots(
    vault,
    constants.BIGDECIMAL_ZERO,
    depositFeeUSD,
    block
  );

  utils.updateProtocolTotalValueLockedUSD();
  UpdateMetricsAfterDeposit(block);

  log.info(
    "[Deposit] vault: {}, sharesMinted: {}, depositAmount: {}, depositAmountUSD: {}, depositFeeUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      sharesMinted.toString(),
      depositAmount.toString(),
      depositAmountUSD.toString(),
      depositFeeUSD.toString(),
      transaction.hash.toHexString(),
    ]
  );
}
