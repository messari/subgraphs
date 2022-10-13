import { Address, ethereum } from "@graphprotocol/graph-ts";
import { Account, ActiveAccount } from "../../generated/schema";
import { Fees } from "../../generated/templates/Pair/Pair";
import {
  INT_ONE,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  UsageType,
} from "./constants";
import {
  getLiquidityPool,
  getOrCreateDex,
  getOrCreateFinancialsDailySnapshot,
  getOrCreateLiquidityPoolDailySnapshot,
  getOrCreateLiquidityPoolHourlySnapshot,
  getOrCreateToken,
  getOrCreateUsageMetricDailySnapshot,
  getOrCreateUsageMetricHourlySnapshot,
} from "./getters";
import { applyDecimals } from "./utils/numbers";

// Update FinancialsDailySnapshots entity
export function updateFinancials(event: ethereum.Event): void {
  let financialMetricsDaily = getOrCreateFinancialsDailySnapshot(event);

  let protocol = getOrCreateDex();

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

export function updateRevenue(event: Fees): void {
  let protocol = getOrCreateDex();
  let pool = getLiquidityPool(event.address);
  let financialsDailySnapshot = getOrCreateFinancialsDailySnapshot(event);
  let poolDailySnapshot = getOrCreateLiquidityPoolDailySnapshot(
    event.address,
    event.block
  );
  let poolHourlySnapshot = getOrCreateLiquidityPoolHourlySnapshot(
    event.address,
    event.block
  );

  let token0 = getOrCreateToken(Address.fromString(pool.inputTokens[0]));
  let token1 = getOrCreateToken(Address.fromString(pool.inputTokens[1]));

  let amount0USD = applyDecimals(event.params.amount0, token0.decimals).times(
    token0.lastPriceUSD!
  );
  let amount1USD = applyDecimals(event.params.amount1, token1.decimals).times(
    token1.lastPriceUSD!
  );

  let protocolSideRevenue = amount0USD.plus(amount1USD);
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
  event: ethereum.Event,
  fromAddress: Address,
  usageType: string
): void {
  let from = fromAddress.toHexString();

  let usageMetricsDaily = getOrCreateUsageMetricDailySnapshot(event);
  let usageMetricsHourly = getOrCreateUsageMetricHourlySnapshot(event);

  let protocol = getOrCreateDex();

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
  let day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;

  let dayId = day.toString();
  let hourId = hour.toString();

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = "daily".concat(from).concat("-").concat(dayId);
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    usageMetricsDaily.dailyActiveUsers += INT_ONE;
    dailyActiveAccount.save();
  }

  let hourlyActiveAccountId = "hourly".concat(from).concat("-").concat(hourId);
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
  poolAddress: Address,
  block: ethereum.Block
): void {
  // get or create pool metrics
  let poolMetricsDaily = getOrCreateLiquidityPoolDailySnapshot(
    poolAddress,
    block
  );
  let poolMetricsHourly = getOrCreateLiquidityPoolHourlySnapshot(
    poolAddress,
    block
  );

  let pool = getLiquidityPool(poolAddress);

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
