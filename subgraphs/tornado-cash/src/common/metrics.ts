import { BigDecimal, ethereum } from "@graphprotocol/graph-ts";

import {
  BIGDECIMAL_ZERO,
  INT_ONE,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
} from "./constants";
import {
  getOrCreateProtocol,
  getOrCreatePool,
  getOrCreatePoolDailySnapshot,
  getOrCreatePoolHourlySnapshot,
  getOrCreateUsageMetricDailySnapshot,
  getOrCreateUsageMetricHourlySnapshot,
  getOrCreateFinancialsDailySnapshot,
} from "./getters";

import { Account, ActiveAccount } from "../../generated/schema";

// Update Pool Snapshots entities
export function updatePoolMetrics(
  poolAddress: string,
  event: ethereum.Event
): void {
  const poolMetricsDaily = getOrCreatePoolDailySnapshot(event);
  const poolMetricsHourly = getOrCreatePoolHourlySnapshot(event);

  const pool = getOrCreatePool(poolAddress, event);

  poolMetricsDaily.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetricsDaily.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolMetricsDaily.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  poolMetricsDaily.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  poolMetricsDaily.inputTokenBalances = pool.inputTokenBalances;
  poolMetricsDaily.inputTokenBalancesUSD = pool.inputTokenBalancesUSD;
  poolMetricsDaily.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  poolMetricsDaily.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;

  poolMetricsDaily.blockNumber = event.block.number;
  poolMetricsDaily.timestamp = event.block.timestamp;

  poolMetricsHourly.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetricsHourly.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolMetricsHourly.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  poolMetricsHourly.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  poolMetricsHourly.inputTokenBalances = pool.inputTokenBalances;
  poolMetricsHourly.inputTokenBalancesUSD = pool.inputTokenBalancesUSD;
  poolMetricsHourly.rewardTokenEmissionsAmount =
    pool.rewardTokenEmissionsAmount;
  poolMetricsHourly.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;

  poolMetricsHourly.blockNumber = event.block.number;
  poolMetricsHourly.timestamp = event.block.timestamp;

  poolMetricsDaily.save();
  poolMetricsHourly.save();
}

// Update usage metrics entities
export function updateUsageMetrics(event: ethereum.Event): void {
  const from = event.transaction.from.toHexString();

  const usageMetricsDaily = getOrCreateUsageMetricDailySnapshot(event);
  const usageMetricsHourly = getOrCreateUsageMetricHourlySnapshot(event);

  const protocol = getOrCreateProtocol();

  // Update the block number and timestamp to that of the last transaction of that day
  usageMetricsDaily.blockNumber = event.block.number;
  usageMetricsDaily.timestamp = event.block.timestamp;
  usageMetricsDaily.dailyTransactionCount += INT_ONE;

  usageMetricsHourly.blockNumber = event.block.number;
  usageMetricsHourly.timestamp = event.block.timestamp;
  usageMetricsHourly.hourlyTransactionCount += INT_ONE;

  // Number of days since Unix epoch
  const day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;

  const dayId = day.toString();
  const hourId = hour.toString();

  // Combine the id and the user address to generate a unique user id for the day
  const dailyActiveAccountId = from.concat("-").concat(dayId);
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    usageMetricsDaily.dailyActiveUsers += INT_ONE;
    dailyActiveAccount.save();
  }

  const hourlyActiveAccountId = from.concat("-").concat(hourId);
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
  usageMetricsHourly.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  usageMetricsDaily.totalPoolCount = protocol.totalPoolCount;

  usageMetricsDaily.save();
  usageMetricsHourly.save();
  protocol.save();
}

// Update FinancialsDailySnapshots entity
export function updateFinancials(event: ethereum.Event): void {
  const financialMetricsDaily = getOrCreateFinancialsDailySnapshot(event);

  const protocol = getOrCreateProtocol();

  const pools = protocol.pools;
  let tvl = BIGDECIMAL_ZERO;
  for (let i = 0; i < pools.length; i++) {
    const pool = getOrCreatePool(pools[i], event);

    tvl = tvl.plus(pool.totalValueLockedUSD);
  }
  protocol.totalValueLockedUSD = tvl;

  financialMetricsDaily.blockNumber = event.block.number;
  financialMetricsDaily.timestamp = event.block.timestamp;
  financialMetricsDaily.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetricsDaily.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialMetricsDaily.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialMetricsDaily.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;

  financialMetricsDaily.save();
  protocol.save();
}

export function updateRevenue(
  event: ethereum.Event,
  poolAddress: string,
  relayerFeeUsd: BigDecimal,
  protocolFeeUsd: BigDecimal
): void {
  const pool = getOrCreatePool(poolAddress, event);

  pool.cumulativeTotalRevenueUSD =
    pool.cumulativeTotalRevenueUSD.plus(relayerFeeUsd);
  pool.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD.plus(protocolFeeUsd);
  pool.cumulativeSupplySideRevenueUSD = pool.cumulativeTotalRevenueUSD.minus(
    pool.cumulativeProtocolSideRevenueUSD
  );
  pool.save();

  const poolMetricsDaily = getOrCreatePoolDailySnapshot(event);

  poolMetricsDaily.dailyTotalRevenueUSD =
    poolMetricsDaily.dailyTotalRevenueUSD.plus(relayerFeeUsd);
  poolMetricsDaily.dailyProtocolSideRevenueUSD =
    poolMetricsDaily.dailyProtocolSideRevenueUSD.plus(protocolFeeUsd);
  poolMetricsDaily.dailySupplySideRevenueUSD =
    poolMetricsDaily.dailyTotalRevenueUSD.minus(
      poolMetricsDaily.dailyProtocolSideRevenueUSD
    );
  poolMetricsDaily.save();

  const poolMetricsHourly = getOrCreatePoolHourlySnapshot(event);

  poolMetricsHourly.hourlyTotalRevenueUSD =
    poolMetricsHourly.hourlyTotalRevenueUSD.plus(relayerFeeUsd);
  poolMetricsHourly.hourlyProtocolSideRevenueUSD =
    poolMetricsHourly.hourlyProtocolSideRevenueUSD.plus(protocolFeeUsd);
  poolMetricsHourly.hourlySupplySideRevenueUSD =
    poolMetricsHourly.hourlyTotalRevenueUSD.minus(
      poolMetricsHourly.hourlyProtocolSideRevenueUSD
    );
  poolMetricsHourly.save();

  const protocol = getOrCreateProtocol();

  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(relayerFeeUsd);
  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(protocolFeeUsd);
  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.minus(
      protocol.cumulativeProtocolSideRevenueUSD
    );
  protocol.save();

  const financialMetricsDaily = getOrCreateFinancialsDailySnapshot(event);

  financialMetricsDaily.dailyTotalRevenueUSD =
    financialMetricsDaily.dailyTotalRevenueUSD.plus(relayerFeeUsd);
  financialMetricsDaily.dailyProtocolSideRevenueUSD =
    financialMetricsDaily.dailyProtocolSideRevenueUSD.plus(protocolFeeUsd);
  financialMetricsDaily.dailySupplySideRevenueUSD =
    financialMetricsDaily.dailyTotalRevenueUSD.minus(
      financialMetricsDaily.dailyProtocolSideRevenueUSD
    );
  financialMetricsDaily.save();
}
