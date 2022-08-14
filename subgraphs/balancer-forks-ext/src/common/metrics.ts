// import { log } from '@graphprotocol/graph-ts'
import { BigDecimal, ethereum, BigInt, Address } from "@graphprotocol/graph-ts";
import { Account, ActiveAccount, DexAmmProtocol, LiquidityPool } from "../../generated/schema";
import { SECONDS_PER_DAY, INT_ZERO, INT_ONE, BIGDECIMAL_ONE, UsageType, SECONDS_PER_HOUR, INT_TWO } from "./constants";
import {
  getOrCreateDex,
  getLiquidityPool,
  getLiquidityPoolFee,
  getOrCreateToken,
  getOrCreateLiquidityPoolDailySnapshot,
  getOrCreateLiquidityPoolHourlySnapshot,
  getOrCreateFinancialsDailySnapshot,
  getOrCreateUsageMetricDailySnapshot,
  getOrCreateUsageMetricHourlySnapshot,
} from "./getters";
import { getOrCreateAccount } from "./position";
import { scaleDown } from "./tokens";

// Update FinancialsDailySnapshots entity
export function updateFinancials(event: ethereum.Event): void {
  let financialMetricsDaily = getOrCreateFinancialsDailySnapshot(event);

  let protocol = getOrCreateDex();

  // Update the block number and timestamp to that of the last transaction of that day
  financialMetricsDaily.blockNumber = event.block.number;
  financialMetricsDaily.timestamp = event.block.timestamp;
  financialMetricsDaily.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetricsDaily.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD;

  financialMetricsDaily.save();
}

// Update usage metrics entities
export function updateUsageMetrics(event: ethereum.Event, fromAddress: Address, usageType: string): void {
  let from = fromAddress.toHexString();

  let usageMetricsDaily = getOrCreateUsageMetricDailySnapshot(event);
  let usageMetricsHourly = getOrCreateUsageMetricHourlySnapshot(event);

  // Update the block number and timestamp to that of the last transaction of that day
  usageMetricsDaily.blockNumber = event.block.number;
  usageMetricsDaily.timestamp = event.block.timestamp;
  usageMetricsDaily.dailyTransactionCount += INT_ONE;

  usageMetricsHourly.blockNumber = event.block.number;
  usageMetricsHourly.timestamp = event.block.timestamp;
  usageMetricsHourly.hourlyTransactionCount += INT_ONE;

  if (usageType == UsageType.DEPOSIT) {
    usageMetricsHourly.hourlyDepositCount += INT_ONE;
  } else if (usageType == UsageType.WITHDRAW) {
    usageMetricsHourly.hourlyWithdrawCount += INT_ONE;
  } else if (usageType == UsageType.SWAP) {
    // We call this here so that we can update the Unique traders for protocol
    getOrCreateAccount(from, true);
    usageMetricsHourly.hourlySwapCount += INT_ONE;
  }

  // Number of days since Unix epoch
  let day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;

  let dayId = day.toString();
  let hourId = hour.toString();

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = from.concat("-").concat(dayId);
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    usageMetricsDaily.dailyActiveUsers += INT_ONE;
    dailyActiveAccount.save();
  }

  let hourlyActiveAccountId = from.concat("-").concat(hourId);
  let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountId);
  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountId);
    usageMetricsHourly.hourlyActiveUsers += INT_ONE;
    hourlyActiveAccount.save();
  }

  let protocol = getOrCreateDex();
  usageMetricsDaily.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetricsHourly.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetricsDaily.totalPoolCount = protocol.totalPoolCount;
  usageMetricsDaily.save();
  usageMetricsHourly.save();
}

// Update UsagePoolDailySnapshot entity
export function updatePoolMetrics(event: ethereum.Event, poolAddress: string): void {
  // get or create pool metrics
  let pool = getLiquidityPool(poolAddress);
  let poolMetricsDaily = getOrCreateLiquidityPoolDailySnapshot(event, poolAddress);
  let poolMetricsHourly = getOrCreateLiquidityPoolHourlySnapshot(event, poolAddress);

  // Update the block number and timestamp to that of the last transaction of that day
  poolMetricsDaily.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetricsDaily.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  poolMetricsDaily.inputTokenBalances = pool.inputTokenBalances;
  poolMetricsDaily.inputTokenWeights = pool.inputTokenWeights;
  poolMetricsDaily.outputTokenSupply = pool.outputTokenSupply;
  poolMetricsDaily.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolMetricsDaily.blockNumber = event.block.number;
  poolMetricsDaily.timestamp = event.block.timestamp;
  poolMetricsDaily.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  poolMetricsDaily.cumulativeSupplySideRevenueUSD = pool.cumulativeSupplySideRevenueUSD;
  poolMetricsDaily.cumulativeProtocolSideRevenueUSD = pool.cumulativeProtocolSideRevenueUSD;

  poolMetricsHourly.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetricsHourly.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  poolMetricsHourly.inputTokenBalances = pool.inputTokenBalances;
  poolMetricsHourly.inputTokenWeights = pool.inputTokenWeights;
  poolMetricsHourly.outputTokenSupply = pool.outputTokenSupply;
  poolMetricsHourly.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolMetricsHourly.blockNumber = event.block.number;
  poolMetricsHourly.timestamp = event.block.timestamp;
  poolMetricsHourly.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  poolMetricsHourly.cumulativeSupplySideRevenueUSD = pool.cumulativeSupplySideRevenueUSD;
  poolMetricsHourly.cumulativeProtocolSideRevenueUSD = pool.cumulativeProtocolSideRevenueUSD;

  poolMetricsDaily.save();
  poolMetricsHourly.save();
}

// Update the volume for all relavant entities
export function updateVolumeAndFee(
  event: ethereum.Event,
  protocol: DexAmmProtocol,
  pool: LiquidityPool,
  trackedAmountUSD: BigDecimal,
): void {
  let financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  let supplyFee = getLiquidityPoolFee(pool.fees[INT_ZERO]);
  let protocolFee = getLiquidityPoolFee(pool.fees[INT_ONE]);
  let tradingFee = getLiquidityPoolFee(pool.fees[INT_TWO]);

  financialMetrics.dailyVolumeUSD = financialMetrics.dailyVolumeUSD.plus(trackedAmountUSD);
  pool.cumulativeVolumeUSD = pool.cumulativeVolumeUSD.plus(trackedAmountUSD);
  protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(trackedAmountUSD);

  let tradingFeeAmountUSD = trackedAmountUSD.times(tradingFee.feePercentage!);
  let supplyFeeAmountUSD = tradingFeeAmountUSD.times(supplyFee.feePercentage!);
  let protocolFeeAmountUSD = tradingFeeAmountUSD.times(protocolFee.feePercentage!);

  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(tradingFeeAmountUSD);
  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(supplyFeeAmountUSD);
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(protocolFeeAmountUSD);

  pool.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD.plus(tradingFeeAmountUSD);
  pool.cumulativeSupplySideRevenueUSD = pool.cumulativeSupplySideRevenueUSD.plus(supplyFeeAmountUSD);
  pool.cumulativeProtocolSideRevenueUSD = pool.cumulativeProtocolSideRevenueUSD.plus(protocolFeeAmountUSD);

  financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(tradingFeeAmountUSD);
  financialMetrics.dailySupplySideRevenueUSD = financialMetrics.dailySupplySideRevenueUSD.plus(supplyFeeAmountUSD);
  financialMetrics.dailyProtocolSideRevenueUSD =
    financialMetrics.dailyProtocolSideRevenueUSD.plus(protocolFeeAmountUSD);

  financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;

  financialMetrics.save();

  protocol.save();
  pool.save();
}
