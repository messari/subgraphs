import { Address, ethereum, BigInt, BigDecimal, log } from "@graphprotocol/graph-ts";
import { Vault } from "../../generated/schema";
import { defineFee, getOrCreateFinancialDailySnapshots, getOrCreateUsageMetricsDailySnapshot, getOrCreateUsageMetricsHourlySnapshot, getOrCreateYieldAggregator } from "../common/initializers";
import { calculatePriceInUSD } from "../calculators/priceInUSDCalculator";
import { YakStrategyV2 } from "../../generated/YakStrategyV2/YakStrategyV2";
import { DEFUALT_AMOUNT, BIGINT_TEN, ZERO_BIGINT, BIGDECIMAL_HUNDRED, ZERO_BIGDECIMAL } from "../helpers/constants";
import * as utils from "../common/utils";
import { calculateOutputTokenPriceInUSD } from "../calculators/outputTokenPriceInUSDCalculator";
import { Withdraw } from "../../generated/schema";
import { convertBigIntToBigDecimal } from "../helpers/converters";

export function _Withdraw(
  contractAddress: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  vault: Vault,
  withdrawAmount: BigInt
): void {
  const vaultAddress = Address.fromString(vault.id);
  const strategyContract = YakStrategyV2.bind(contractAddress);

  let totalSupply = utils.readValue<BigInt>(
    strategyContract.try_totalSupply(),
    ZERO_BIGINT
  );
  vault.outputTokenSupply = totalSupply;

  if (strategyContract.try_totalDeposits().reverted) {
    vault.inputTokenBalance = ZERO_BIGINT;
  } else {
    vault.inputTokenBalance = strategyContract.totalDeposits();
    if (strategyContract.try_depositToken().reverted) {
      vault.totalValueLockedUSD = ZERO_BIGDECIMAL;
    } else {
      vault.totalValueLockedUSD = calculatePriceInUSD(strategyContract.depositToken(), DEFUALT_AMOUNT).times(convertBigIntToBigDecimal(strategyContract.totalDeposits(), 18));
    }
  }

  if (strategyContract.try_getDepositTokensForShares(DEFUALT_AMOUNT).reverted) {
    vault.pricePerShare = ZERO_BIGDECIMAL;
  } else {
    vault.pricePerShare = convertBigIntToBigDecimal(strategyContract.getDepositTokensForShares(DEFUALT_AMOUNT), 18);
  }
  vault.outputTokenPriceUSD = calculateOutputTokenPriceInUSD(contractAddress);

  // vault.pricePerShare = utils
  //   .readValue<BigInt>(strategyContract.try_getDepositTokensForShares(DEFUALT_AMOUNT), ZERO_BIGINT)
  //   .toBigDecimal();

  // Update hourly and daily withdraw transaction count
  const metricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(block);
  const metricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(block);

  metricsDailySnapshot.dailyWithdrawCount += 1;
  metricsHourlySnapshot.hourlyWithdrawCount += 1;

  metricsDailySnapshot.save();
  metricsHourlySnapshot.save();
  vault.save();

  utils.updateProtocolTotalValueLockedUSD();

  const withdrawAmountUSD = calculatePriceInUSD(strategyContract.depositToken(), withdrawAmount);

  createWithdrawTransaction(
    contractAddress,
    vaultAddress,
    transaction,
    block,
    vault.inputToken,
    withdrawAmount,
    withdrawAmountUSD
  );

  const withdrawFeePercentage = defineFee(contractAddress, "-developerFee");

  let withdrawalFeeUSD = withdrawAmountUSD
    .times(withdrawFeePercentage.feePercentage!)
    .div(BIGDECIMAL_HUNDRED);

  updateUsageMetricsAfterWithdraw(block, withdrawalFeeUSD);
}

export function updateUsageMetricsAfterWithdraw(block: ethereum.Block, protocolSideRevenueUSD: BigDecimal): void {
  const financialMetrics = getOrCreateFinancialDailySnapshots(block);
  const protocol = getOrCreateYieldAggregator();

  // TotalRevenueUSD Metrics
  financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(
    protocolSideRevenueUSD
  );
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(
    protocolSideRevenueUSD
  );
  financialMetrics.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;

  // ProtocolSideRevenueUSD Metrics
  financialMetrics.dailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );
  financialMetrics.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;

  financialMetrics.save();
  protocol.save();
}

export function createWithdrawTransaction(
  contractAddress: Address,
  vaultAddress: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  assetId: string,
  amount: BigInt,
  amountUSD: BigDecimal
): Withdraw {
  let withdrawTransactionId = "withdraw-" + transaction.hash.toHexString();

  let withdrawTransaction = Withdraw.load(withdrawTransactionId);

  if (!withdrawTransaction) {
    withdrawTransaction = new Withdraw(withdrawTransactionId);

    withdrawTransaction.vault = vaultAddress.toHexString();
    const protocol = getOrCreateYieldAggregator();
    withdrawTransaction.protocol = protocol.id;

    withdrawTransaction.to = contractAddress.toHexString();
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