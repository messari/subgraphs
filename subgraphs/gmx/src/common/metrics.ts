import { Address, ethereum } from "@graphprotocol/graph-ts";
import { Account, ActiveAccount } from "../../generated/schema";
import { INT_ONE, SECONDS_PER_DAY, SECONDS_PER_HOUR } from "./constants";
import {
  getOrCreateFinancialsDailySnapshot,
  getOrCreatePool,
  getOrCreatePoolDailySnapshot,
  getOrCreatePoolHourlySnapshot,
  getOrCreateProtocol,
  getOrCreateUsageMetricDailySnapshot,
  getOrCreateUsageMetricHourlySnapshot,
} from "./getters";

// These are meant more as boilerplates that'll be filled out depending on the
// subgraph, and will be different from subgraph to subgraph, hence left
// partially implemented and commented out.
// They are common within a subgraph but not common across different subgraphs.

// Update FinancialsDailySnapshots entity
export function updateFinancials(block: ethereum.Block): void {
  const financialMetricsDaily = getOrCreateFinancialsDailySnapshot(block);

  const protocol = getOrCreateProtocol();

  // Update the block number and timestamp to that of the last transaction of that day
  financialMetricsDaily.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetricsDaily.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialMetricsDaily.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialMetricsDaily.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;

  financialMetricsDaily.blockNumber = block.number;
  financialMetricsDaily.timestamp = block.timestamp;

  financialMetricsDaily.save();
}

// Update usage metrics entities
export function updateUsageMetrics(
  event: ethereum.Event,
  fromAddress: Address
): void {
  const from = fromAddress.toHexString();

  const usageMetricsDaily = getOrCreateUsageMetricDailySnapshot(event.block);
  const usageMetricsHourly = getOrCreateUsageMetricHourlySnapshot(event.block);

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
  const dailyActiveAccountId = "daily"
    .concat("-")
    .concat(from)
    .concat("-")
    .concat(dayId);
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    usageMetricsDaily.dailyActiveUsers += INT_ONE;
    dailyActiveAccount.save();
  }

  const hourlyActiveAccountId = "hourly"
    .concat("-")
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
  usageMetricsHourly.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  usageMetricsDaily.save();
  usageMetricsHourly.save();
  protocol.save();
}

// Update Pool Snapshots entities
export function updatePoolMetrics(
  poolAddress: Address,
  block: ethereum.Block
): void {
  // get or create pool metrics
  const poolMetricsDaily = getOrCreatePoolDailySnapshot(poolAddress, block);
  const poolMetricsHourly = getOrCreatePoolHourlySnapshot(poolAddress, block);

  const pool = getOrCreatePool(poolAddress, block);

  // Update the block number and timestamp to that of the last transaction of that day
  poolMetricsDaily.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetricsDaily.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolMetricsDaily.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  poolMetricsDaily.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  poolMetricsDaily.inputTokenBalances = pool.inputTokenBalances;
  poolMetricsDaily.outputTokenSupply = pool.outputTokenSupply;
  poolMetricsDaily.blockNumber = block.number;
  poolMetricsDaily.timestamp = block.timestamp;

  poolMetricsHourly.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetricsHourly.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolMetricsHourly.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  poolMetricsHourly.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  poolMetricsHourly.inputTokenBalances = pool.inputTokenBalances;
  poolMetricsHourly.outputTokenSupply = pool.outputTokenSupply;
  poolMetricsHourly.blockNumber = block.number;
  poolMetricsHourly.timestamp = block.timestamp;

  poolMetricsDaily.save();
  poolMetricsHourly.save();
}
