import { Address, ethereum, BigInt } from "@graphprotocol/graph-ts";

import {
  INT_ONE,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  UsageType,
} from "./constants";
import {
  getOrCreateFinancialsDailySnapshot,
  getOrCreateLiquidityPoolDailySnapshot,
  getOrCreateLiquidityPoolHourlySnapshot,
  getOrCreateToken,
  getOrCreateUsageMetricDailySnapshot,
  getOrCreateUsageMetricHourlySnapshot,
} from "./getters";
import { applyDecimals } from "./utils/numbers";

import {
  Account,
  ActiveAccount,
  DexAmmProtocol,
  LiquidityPool,
} from "../../generated/schema";

// Update FinancialsDailySnapshots entity
export function updateFinancials(
  protocol: DexAmmProtocol,
  event: ethereum.Event
): void {
  const financialMetricsDaily = getOrCreateFinancialsDailySnapshot(
    protocol,
    event
  );

  // Update the block number and timestamp to that of the last transaction of that day
  financialMetricsDaily.blockNumber = event.block.number;
  financialMetricsDaily.timestamp = event.block.timestamp;
  financialMetricsDaily.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetricsDaily.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD;
  financialMetricsDaily.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialMetricsDaily.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialMetricsDaily.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;

  financialMetricsDaily.save();
}

export function updateRevenue(
  protocol: DexAmmProtocol,
  pool: LiquidityPool,
  amount0: BigInt,
  amount1: BigInt,
  event: ethereum.Event
): void {
  const financialsDailySnapshot = getOrCreateFinancialsDailySnapshot(
    protocol,
    event
  );
  const poolDailySnapshot = getOrCreateLiquidityPoolDailySnapshot(
    pool,
    event.block
  );
  const poolHourlySnapshot = getOrCreateLiquidityPoolHourlySnapshot(
    pool,
    event.block
  );

  const token0 = getOrCreateToken(Address.fromString(pool.inputTokens[0]));
  const token1 = getOrCreateToken(Address.fromString(pool.inputTokens[1]));

  const amount0USD = applyDecimals(amount0, token0.decimals).times(
    token0.lastPriceUSD!
  );
  const amount1USD = applyDecimals(amount1, token1.decimals).times(
    token1.lastPriceUSD!
  );

  const protocolSideRevenue = amount0USD.plus(amount1USD);
  // no need to calculate supply side, as all fees are protocol side.

  //Update pool cumulatives
  pool.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenue);
  pool.cumulativeTotalRevenueUSD =
    pool.cumulativeTotalRevenueUSD.plus(protocolSideRevenue);

  // Update protocol cumulatives
  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenue);
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(protocolSideRevenue);

  // Update Financial snapshot - daily
  financialsDailySnapshot.dailyProtocolSideRevenueUSD =
    financialsDailySnapshot.dailyProtocolSideRevenueUSD.plus(
      protocolSideRevenue
    );
  financialsDailySnapshot.dailyTotalRevenueUSD =
    financialsDailySnapshot.dailyTotalRevenueUSD.plus(protocolSideRevenue);

  // Sync financial snapshot cumulatives with protocol
  financialsDailySnapshot.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialsDailySnapshot.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;

  //Update daily/hourly snapshots
  poolDailySnapshot.dailyProtocolSideRevenueUSD =
    poolDailySnapshot.dailyProtocolSideRevenueUSD.plus(protocolSideRevenue);
  poolDailySnapshot.dailyTotalRevenueUSD =
    poolDailySnapshot.dailyTotalRevenueUSD.plus(protocolSideRevenue);

  poolHourlySnapshot.hourlyProtocolSideRevenueUSD =
    poolHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(protocolSideRevenue);
  poolHourlySnapshot.hourlyTotalRevenueUSD =
    poolHourlySnapshot.hourlyTotalRevenueUSD.plus(protocolSideRevenue);
  poolHourlySnapshot;

  // Sync pool snapshot cumulatives with pool
  poolDailySnapshot.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  poolDailySnapshot.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;

  poolHourlySnapshot.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  poolHourlySnapshot.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;

  // Update timestamps
  financialsDailySnapshot.blockNumber = event.block.number;
  financialsDailySnapshot.timestamp = event.block.timestamp;
  poolDailySnapshot.blockNumber = event.block.number;
  poolDailySnapshot.timestamp = event.block.timestamp;
  poolHourlySnapshot.blockNumber = event.block.number;
  poolHourlySnapshot.timestamp = event.block.timestamp;

  pool.save();
  protocol.save();
  financialsDailySnapshot.save();
  poolDailySnapshot.save();
  poolHourlySnapshot.save();
}

// Update usage metrics entities
export function updateUsageMetrics(
  protocol: DexAmmProtocol,
  fromAddress: Address,
  usageType: string,
  event: ethereum.Event
): void {
  const from = fromAddress.toHexString();

  const usageMetricsDaily = getOrCreateUsageMetricDailySnapshot(
    protocol,
    event
  );
  const usageMetricsHourly = getOrCreateUsageMetricHourlySnapshot(
    protocol,
    event
  );

  // Update the block number and timestamp to that of the last transaction of that day
  usageMetricsDaily.blockNumber = event.block.number;
  usageMetricsDaily.timestamp = event.block.timestamp;
  usageMetricsDaily.dailyTransactionCount += INT_ONE;

  usageMetricsHourly.blockNumber = event.block.number;
  usageMetricsHourly.timestamp = event.block.timestamp;
  usageMetricsHourly.hourlyTransactionCount += INT_ONE;

  if (usageType == UsageType.DEPOSIT) {
    usageMetricsDaily.dailyDepositCount += INT_ONE;
    usageMetricsHourly.hourlyDepositCount += INT_ONE;
  } else if (usageType == UsageType.WITHDRAW) {
    usageMetricsDaily.dailyWithdrawCount += INT_ONE;
    usageMetricsHourly.hourlyWithdrawCount += INT_ONE;
  } else if (usageType == UsageType.SWAP) {
    usageMetricsDaily.dailySwapCount += INT_ONE;
    usageMetricsHourly.hourlySwapCount += INT_ONE;
  }

  // Number of days since Unix epoch
  const day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;

  const dayId = day.toString();
  const hourId = hour.toString();

  // Combine the id and the user address to generate a unique user id for the day
  const dailyActiveAccountId = "daily".concat(from).concat("-").concat(dayId);
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    usageMetricsDaily.dailyActiveUsers += INT_ONE;
    dailyActiveAccount.save();
  }

  const hourlyActiveAccountId = "hourly"
    .concat(from)
    .concat("-")
    .concat(hourId);
  let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountId);
  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountId);
    usageMetricsHourly.hourlyActiveUsers += INT_ONE;
    hourlyActiveAccount.save();
  }

  let account = Account.load(from);
  if (!account) {
    account = new Account(from);
    protocol.cumulativeUniqueUsers += INT_ONE;
    account.save();
  }
  usageMetricsDaily.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetricsDaily.totalPoolCount = protocol.totalPoolCount;
  usageMetricsHourly.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  usageMetricsDaily.save();
  usageMetricsHourly.save();
  protocol.save();
}

// Update Pool Snapshots entities
export function updatePoolMetrics(
  pool: LiquidityPool,
  block: ethereum.Block
): void {
  // get or create pool metrics
  const poolMetricsDaily = getOrCreateLiquidityPoolDailySnapshot(pool, block);
  const poolMetricsHourly = getOrCreateLiquidityPoolHourlySnapshot(pool, block);

  // Update the block number and timestamp to that of the last transaction of that day
  poolMetricsDaily.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetricsDaily.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolMetricsDaily.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  poolMetricsDaily.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  poolMetricsDaily.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  poolMetricsDaily.inputTokenBalances = pool.inputTokenBalances;
  poolMetricsDaily.inputTokenWeights = pool.inputTokenWeights;
  poolMetricsDaily.outputTokenSupply = pool.outputTokenSupply;
  poolMetricsDaily.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolMetricsDaily.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;
  poolMetricsDaily.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  poolMetricsDaily.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
  poolMetricsDaily.blockNumber = block.number;
  poolMetricsDaily.timestamp = block.timestamp;

  poolMetricsHourly.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetricsHourly.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolMetricsHourly.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  poolMetricsHourly.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  poolMetricsHourly.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  poolMetricsHourly.inputTokenBalances = pool.inputTokenBalances;
  poolMetricsHourly.inputTokenWeights = pool.inputTokenWeights;
  poolMetricsHourly.outputTokenSupply = pool.outputTokenSupply;
  poolMetricsHourly.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolMetricsHourly.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;
  poolMetricsHourly.rewardTokenEmissionsAmount =
    pool.rewardTokenEmissionsAmount;
  poolMetricsHourly.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
  poolMetricsHourly.blockNumber = block.number;
  poolMetricsHourly.timestamp = block.timestamp;

  poolMetricsDaily.save();
  poolMetricsHourly.save();
}
