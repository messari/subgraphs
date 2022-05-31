import { BigDecimal, Address, ethereum, BigInt } from "@graphprotocol/graph-ts";
import { Account, ActiveAccount, LiquidityPool } from "../../generated/schema";
import { getLpTokenPriceUSD, getPoolAssetPrice } from "../services/snapshots";
//import { getLpTokenPriceUSD, getPoolAssetPrice } from "../services/snapshots";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ONE_HUNDRED,
  BIGDECIMAL_ZERO,
  LiquidityPoolFeeType,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
} from "./constants";
import {
  getOrCreateDexAmm,
  getOrCreatePoolDailySnapshot,
  getOrCreatePoolHourlySnapshot,
  getOrCreateFinancialsDailySnapshot,
  getOrCreateUsageMetricHourlySnapshot,
  getOrCreateUsageMetricDailySnapshot,
  getPoolFee,
  getOrCreateToken,
} from "./getters";
import { setPoolBalances, setPoolOutputTokenSupply, setPoolTVL, setProtocolTVL } from "./setters";
import { bigIntToBigDecimal } from "./utils/numbers";

// Update FinancialsDailySnapshots entity
export function updateFinancials(event: ethereum.Event): void {
  let financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  let protocol = getOrCreateDexAmm();
  // // Update the block number and timestamp to that of the last transaction of that day
  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;
  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetrics.protocolControlledValueUSD = protocol.protocolControlledValueUSD;
  financialMetrics.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD;
  financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
  financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  financialMetrics.save();
}

export function updateUsageMetrics(event: ethereum.Event, action: string = ""): void {
  // Number of days since Unix epoch
  let hourlyId: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  let dailyId: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let usageHourlyMetrics = getOrCreateUsageMetricHourlySnapshot(event);
  let usageDailyMetrics = getOrCreateUsageMetricDailySnapshot(event);

  let user = event.transaction.from;
  // Update the block number and timestamp to that of the last transaction of that day
  usageHourlyMetrics.blockNumber = event.block.number;
  usageHourlyMetrics.timestamp = event.block.timestamp;
  usageHourlyMetrics.hourlyTransactionCount += 1;

  usageDailyMetrics.blockNumber = event.block.number;
  usageDailyMetrics.timestamp = event.block.timestamp;
  usageDailyMetrics.dailyTransactionCount += 1;

  let accountId = user.toHexString();
  let account = Account.load(accountId);
  let protocol = getOrCreateDexAmm();
  if (!account) {
    account = new Account(accountId);
    account.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }
  usageHourlyMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageDailyMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  // Combine the id and the user address to generate a unique user id for the hour
  let hourlyActiveAccountId = hourlyId.toString() + "-" + user.toHexString();
  let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountId);
  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountId);
    hourlyActiveAccount.save();
    usageHourlyMetrics.hourlyActiveUsers += 1;
  }

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = dailyId.toString() + "-" + user.toHexString();
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    usageDailyMetrics.dailyActiveUsers += 1;
  }

  if (action == "deposit") {
    usageHourlyMetrics.hourlyDepositCount += 1;
    usageDailyMetrics.dailyDepositCount += 1;
  } else if (action == "withdraw") {
    usageHourlyMetrics.hourlyWithdrawCount += 1;
    usageDailyMetrics.dailyWithdrawCount += 1;
  } else if (action == "trade") {
    usageHourlyMetrics.hourlySwapCount += 1;
    usageDailyMetrics.dailySwapCount += 1;
  }
  usageHourlyMetrics.save();
  usageDailyMetrics.save();
}

// Update Pool Snapshots entities
export function updatePoolMetrics(poolAddress: string, event: ethereum.Event): void {
  // get or create pool metrics
  let poolMetricsHourly = getOrCreatePoolHourlySnapshot(poolAddress, event);
  let poolMetricsDaily = getOrCreatePoolDailySnapshot(poolAddress, event);
  let pool = LiquidityPool.load(poolAddress);
  if (!pool) {
    return;
  }
  // Update the block number and timestamp to that of the last transaction of that day
  // Values to update in mappings:
  // - dailyVolumeByTokenAmount
  // - dailyVolumeByTokenUSD

  poolMetricsHourly.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetricsHourly.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  poolMetricsHourly.inputTokenBalances = pool.inputTokenBalances;
  poolMetricsHourly.inputTokenWeights = pool.inputTokenWeights;
  poolMetricsHourly.outputTokenSupply = pool.outputTokenSupply;
  poolMetricsHourly.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolMetricsHourly.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;
  poolMetricsHourly.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  poolMetricsHourly.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
  poolMetricsHourly.blockNumber = event.block.number;
  poolMetricsHourly.timestamp = event.block.timestamp;

  poolMetricsDaily.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetricsDaily.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  poolMetricsDaily.inputTokenBalances = pool.inputTokenBalances;
  poolMetricsDaily.inputTokenWeights = pool.inputTokenWeights;
  poolMetricsDaily.outputTokenSupply = pool.outputTokenSupply;
  poolMetricsDaily.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolMetricsDaily.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;
  poolMetricsDaily.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  poolMetricsDaily.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
  poolMetricsDaily.blockNumber = event.block.number;
  poolMetricsDaily.timestamp = event.block.timestamp;

  poolMetricsHourly.save();
  poolMetricsDaily.save();
}

export function updatePool(liquidityPool: LiquidityPool, event: ethereum.Event): void {
  liquidityPool.outputTokenPriceUSD = getLpTokenPriceUSD(liquidityPool, event.block.timestamp);
  setPoolBalances(liquidityPool);
  setPoolOutputTokenSupply(liquidityPool);
  setPoolTVL(liquidityPool, event.block.timestamp); // updates pool token weights too
  setProtocolTVL(); // updates the protocol totalValueLockedUSD, along with the pool's tvl being updated
  liquidityPool.save();
}

export function updateProtocolRevenue(
  liquidityPool: LiquidityPool,
  volumeUSD: BigDecimal,
  event: ethereum.Event,
): void {
  let protocol = getOrCreateDexAmm();
  let financialSnapshot = getOrCreateFinancialsDailySnapshot(event);
  let LpFee = getPoolFee(liquidityPool.id, LiquidityPoolFeeType.FIXED_LP_FEE).feePercentage.div(
    BIGDECIMAL_ONE_HUNDRED,
  );
  let protocolFee = getPoolFee(liquidityPool.id, LiquidityPoolFeeType.FIXED_PROTOCOL_FEE).feePercentage.div(
    BIGDECIMAL_ONE_HUNDRED,
  );
  let totalFee = getPoolFee(liquidityPool.id, LiquidityPoolFeeType.FIXED_TRADING_FEE).feePercentage.div(
    BIGDECIMAL_ONE_HUNDRED,
  );

  let supplySideRevenue = LpFee.times(volumeUSD);
  let protocolRevenue = protocolFee.times(volumeUSD);
  let totalRevenueUSD = totalFee.times(volumeUSD);

  financialSnapshot.dailySupplySideRevenueUSD = financialSnapshot.dailySupplySideRevenueUSD.plus(supplySideRevenue);
  financialSnapshot.dailyProtocolSideRevenueUSD = financialSnapshot.dailyProtocolSideRevenueUSD.plus(protocolRevenue);
  financialSnapshot.dailyTotalRevenueUSD = financialSnapshot.dailyTotalRevenueUSD.plus(totalRevenueUSD);

  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(supplySideRevenue);
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(protocolRevenue);
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(totalRevenueUSD);

  financialSnapshot.save();
  protocol.save();
}

export function calculateLiquidityFeesUSD(pool: LiquidityPool, fees: BigInt[], event: ethereum.Event): BigDecimal {
  let feeSum = BIGDECIMAL_ZERO;
  for (let i = 0; i < fees.length; i++) {
    let token = getOrCreateToken(Address.fromString(pool.inputTokens[i]));
    feeSum = feeSum.plus(bigIntToBigDecimal(fees[i], token.decimals));
  }
  let poolAssetPrice = getPoolAssetPrice(pool, event.block.timestamp);
  let totalFeesUSD = feeSum.times(poolAssetPrice);
  return totalFeesUSD;
}

export function handleLiquidityFees(pool: LiquidityPool, fees: BigInt[], event: ethereum.Event): void {
  const totalFeesUSD = calculateLiquidityFeesUSD(pool, fees, event);
  updateProtocolRevenue(pool, totalFeesUSD, event);
}
