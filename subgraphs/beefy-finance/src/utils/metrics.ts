import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  Deposit,
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  Vault,
  Withdraw,
  YieldAggregator,
} from "../../generated/schema";
import { getDailyRevenuesUsd, getTvlUsd } from "../mappings/protocol";
import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "../prices/common/constants";
import {
  getDaysSinceEpoch,
  getHoursSinceEpoch,
  getBeginOfTheDayTimestamp,
  getBeginOfTheHourTimestamp,
} from "./time";

export function getProtocolDailyId(
  block: ethereum.Block,
  protocol: YieldAggregator
): string {
  const daysSinceEpoch = getDaysSinceEpoch(block.timestamp.toI32());
  const id = protocol.id.concat("-").concat(daysSinceEpoch);
  return id;
}

export function getProtocolHourlyId(
  block: ethereum.Block,
  protocol: YieldAggregator
): string {
  const daysSinceEpoch = getHoursSinceEpoch(block.timestamp.toI32());
  const id = protocol.id.concat("-").concat(daysSinceEpoch);
  return id;
}

export function updateUsageMetricsDailySnapshot(
  block: ethereum.Block,
  protocol: YieldAggregator
): UsageMetricsDailySnapshot {
  const id = getProtocolDailyId(block, protocol);
  let protocolDailySnapshot = UsageMetricsDailySnapshot.load(id);
  if (protocolDailySnapshot == null) {
    protocolDailySnapshot = new UsageMetricsDailySnapshot(id);
    protocolDailySnapshot.protocol = protocol.id;
  }
  protocolDailySnapshot.dailyActiveUsers = getUniqueUsers(protocol, [
    getBeginOfTheDayTimestamp(block.timestamp),
    block.timestamp,
  ]);
  protocolDailySnapshot.cumulativeUniqueUsers = getUniqueUsers(protocol, [
    BIGINT_ZERO,
    block.timestamp,
  ]);
  protocolDailySnapshot.dailyTransactionCount = getTransactionCount(protocol, [
    getBeginOfTheDayTimestamp(block.timestamp),
    block.timestamp,
  ]);
  protocolDailySnapshot.dailyDepositCount = getDepositCount(protocol, [
    getBeginOfTheDayTimestamp(block.timestamp),
    block.timestamp,
  ]);
  protocolDailySnapshot.dailyWithdrawCount = getWithdrawCount(protocol, [
    getBeginOfTheDayTimestamp(block.timestamp),
    block.timestamp,
  ]);
  protocolDailySnapshot.blockNumber = block.number;
  protocolDailySnapshot.timestamp = block.timestamp;
  protocolDailySnapshot.save();

  return protocolDailySnapshot;
}

export function updateUsageMetricsHourlySnapshot(
  block: ethereum.Block,
  protocol: YieldAggregator
): UsageMetricsHourlySnapshot {
  const id = getProtocolHourlyId(block, protocol);
  let protocolHourlySnapshot = UsageMetricsHourlySnapshot.load(id);
  if (protocolHourlySnapshot == null) {
    protocolHourlySnapshot = new UsageMetricsHourlySnapshot(id);
    protocolHourlySnapshot.protocol = protocol.id;
  }
  protocolHourlySnapshot.hourlyActiveUsers = getUniqueUsers(protocol, [
    getBeginOfTheHourTimestamp(block.timestamp),
    block.timestamp,
  ]);
  protocolHourlySnapshot.cumulativeUniqueUsers = getUniqueUsers(protocol, [
    BIGINT_ZERO,
    block.timestamp,
  ]);
  protocolHourlySnapshot.hourlyTransactionCount = getTransactionCount(
    protocol,
    [getBeginOfTheHourTimestamp(block.timestamp), block.timestamp]
  );
  protocolHourlySnapshot.hourlyDepositCount = getDepositCount(protocol, [
    getBeginOfTheHourTimestamp(block.timestamp),
    block.timestamp,
  ]);
  protocolHourlySnapshot.hourlyWithdrawCount = getWithdrawCount(protocol, [
    getBeginOfTheHourTimestamp(block.timestamp),
    block.timestamp,
  ]);
  protocolHourlySnapshot.blockNumber = block.number;
  protocolHourlySnapshot.timestamp = block.timestamp;
  protocolHourlySnapshot.save();

  return protocolHourlySnapshot;
}

export function getUniqueUsers(
  protocol: YieldAggregator,
  timeframe: BigInt[]
): BigInt {
  let vault: Vault | null,
    deposit: Deposit | null,
    withdraw: Withdraw | null,
    user: string;
  let users: string[] = [];
  for (let i = 0; i < protocol.vaults.length; i++) {
    vault = Vault.load(protocol.vaults[i]); //already initialized if are in vaults field
    if (vault == null) {
      continue;
    } else {
      for (let j = 0; j < vault.deposits.length; j++) {
        deposit = Deposit.load(vault.deposits[j]);
        if (!deposit) {
          continue;
        } else if (
          deposit.timestamp > timeframe[0] &&
          deposit.timestamp <= timeframe[1]
        ) {
          user = deposit.from;
          if (users.includes(user)) {
            continue;
          } else {
            users.push(user);
          }
        }
      }
      for (let j = 0; j < vault.withdraws.length; j++) {
        withdraw = Withdraw.load(vault.deposits[j]);
        if (!withdraw) {
          continue;
        } else if (
          withdraw.timestamp >= timeframe[0] &&
          withdraw.timestamp <= timeframe[1]
        ) {
          user = withdraw.from;
          if (users.includes(user)) {
            continue;
          } else {
            users.push(user);
          }
        }
      }
    }
  }
  return BigInt.fromI32(users.length);
}

function getDepositCount(
  protocol: YieldAggregator,
  timeframe: BigInt[]
): BigInt {
  let vault: Vault | null, deposit: Deposit | null;
  let count = BIGINT_ZERO;
  for (let i = 0; i < protocol.vaults.length; i++) {
    vault = Vault.load(protocol.vaults[i]); //already initialized if are in vaults field
    if (vault == null) {
      continue;
    } else {
      for (let j = 0; j < vault.deposits.length; j++) {
        deposit = Deposit.load(vault.deposits[j]);
        if (deposit == null) {
          continue;
        } else if (
          deposit.timestamp >= timeframe[0] &&
          deposit.timestamp <= timeframe[1]
        ) {
          count = count.plus(BigInt.fromI32(1));
        }
      }
    }
  }
  return count;
}

function getWithdrawCount(
  protocol: YieldAggregator,
  timeframe: BigInt[]
): BigInt {
  let vault: Vault | null, withdraw: Withdraw | null;
  let count = BIGINT_ZERO;
  for (let i = 0; i < protocol.vaults.length; i++) {
    vault = Vault.load(protocol.vaults[i]); //already initialized if are in vaults field
    if (vault == null) {
      continue;
    } else {
      for (let j = 0; j < vault.withdraws.length; j++) {
        withdraw = Withdraw.load(vault.withdraws[j]);
        if (withdraw == null) {
          continue;
        } else if (
          withdraw.timestamp >= timeframe[0] &&
          withdraw.timestamp <= timeframe[1]
        ) {
          count = count.plus(BigInt.fromI32(1));
        }
      }
    }
  }
  return count;
}

function getTransactionCount(
  protocol: YieldAggregator,
  timeframe: BigInt[]
): BigInt {
  return getDepositCount(protocol, timeframe).plus(
    getWithdrawCount(protocol, timeframe)
  );
}

export function updateDailyFinancialSnapshot(
  block: ethereum.Block,
  protocol: YieldAggregator
): FinancialsDailySnapshot {
  const id = getProtocolDailyId(block, protocol);
  let dailyFinancialSnapshot = FinancialsDailySnapshot.load(id);
  if (dailyFinancialSnapshot == null) {
    dailyFinancialSnapshot = new FinancialsDailySnapshot(id);
    dailyFinancialSnapshot.protocol = protocol.id;
  }
  dailyFinancialSnapshot.totalValueLockedUSD = getTvlUsd(protocol);
  const revenues = getDailyRevenuesUsd(protocol, block);
  dailyFinancialSnapshot.dailySupplySideRevenueUSD = revenues[0];
  dailyFinancialSnapshot.dailyProtocolSideRevenueUSD = revenues[1];
  dailyFinancialSnapshot.dailyTotalRevenueUSD = revenues[2];
  let cumulativeSupplyRevenue = revenues[0];
  let cumulativeProtocolRevenue = revenues[1];
  let cumulativeTotalRevenue = revenues[2];
  let metricsSnapshot: FinancialsDailySnapshot | null;
  for (let i = 0; i < protocol.financialMetrics.length; i++) {
    metricsSnapshot = FinancialsDailySnapshot.load(
      protocol.financialMetrics[i]
    );
    if (metricsSnapshot != null && metricsSnapshot.id != id) {
      cumulativeSupplyRevenue = cumulativeSupplyRevenue.plus(
        metricsSnapshot.dailySupplySideRevenueUSD
      );
      cumulativeProtocolRevenue = cumulativeProtocolRevenue.plus(
        metricsSnapshot.dailyProtocolSideRevenueUSD
      );
      cumulativeTotalRevenue = cumulativeTotalRevenue.plus(
        metricsSnapshot.dailyTotalRevenueUSD
      );
    }
  }
  dailyFinancialSnapshot.cumulativeSupplySideRevenueUSD = cumulativeSupplyRevenue;
  dailyFinancialSnapshot.cumulativeProtocolSideRevenueUSD = cumulativeProtocolRevenue;
  dailyFinancialSnapshot.cumulativeTotalRevenueUSD = cumulativeTotalRevenue;

  dailyFinancialSnapshot.blockNumber = block.number;
  dailyFinancialSnapshot.timestamp = block.timestamp;

  dailyFinancialSnapshot.save();
  return dailyFinancialSnapshot;
}

export function createFirstDailyFinancialSnapshot(
  block: ethereum.Block,
  protocol: YieldAggregator
): FinancialsDailySnapshot {
  const id = getProtocolDailyId(block, protocol);
  const dailyFinancialSnapshot = new FinancialsDailySnapshot(id);
  dailyFinancialSnapshot.protocol = protocol.id;
  dailyFinancialSnapshot.totalValueLockedUSD = getTvlUsd(protocol);

  dailyFinancialSnapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
  dailyFinancialSnapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  dailyFinancialSnapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;

  dailyFinancialSnapshot.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  dailyFinancialSnapshot.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  dailyFinancialSnapshot.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

  dailyFinancialSnapshot.blockNumber = block.number;
  dailyFinancialSnapshot.timestamp = block.timestamp;

  dailyFinancialSnapshot.save();
  return dailyFinancialSnapshot;
}
