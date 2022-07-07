import { log, Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { getUsdPrice, getUsdPricePerToken } from "./prices";
import { bigIntToBigDecimal } from "./utils/numbers";
import { getOrCreateProtocol } from "./entities/protocol";
import { getOrCreatePool } from "./entities/pool";
import {
  FinancialsDailySnapshot,
  PoolDailySnapshot,
  PoolHourlySnapshot,
} from "../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_TEN_TO_EIGHTEENTH,
  BIGINT_ZERO,
  ETH_ADDRESS,
  PROTOCOL_ID,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
} from "./utils/constants";
import { getOrCreateToken } from "./entities/token";

export function updateProtocolAndPoolTvl(
  block: ethereum.Block,
  amount: BigInt
): void {
  const pool = getOrCreatePool(block.number, block.timestamp);
  const protocol = getOrCreateProtocol();
  const financialMetrics = getOrCreateFinancialDailyMetrics(block);

  // inputToken is ETH, price with ETH
  const amountUSD = getUsdPrice(
    Address.fromString(ETH_ADDRESS),
    bigIntToBigDecimal(amount)
  );

  // Protocol
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(amountUSD);
  protocol.save();

  // Financials Daily
  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetrics.save();

  // Pool
  pool.totalValueLockedUSD = protocol.totalValueLockedUSD;
  pool.inputTokenBalances = [pool.inputTokenBalances[0].plus(amount)];
  pool.save();

  // Pool Daily and Hourly
  // updatePoolSnapshots(event.block) is called separately when protocol and supply side
  // revenue metrics are being calculated to consolidate the snapshots
}

export function updatePoolSnapshotsTvl(block: ethereum.Block): void {
  const pool = getOrCreatePool(block.number, block.timestamp);
  const poolMetricsDailySnapshot = getOrCreatePoolsDailySnapshot(
    Address.fromString(PROTOCOL_ID),
    block
  );
  const poolMetricsHourlySnapshot = getOrCreatePoolsHourlySnapshot(
    Address.fromString(PROTOCOL_ID),
    block
  );

  // Pool Daily
  poolMetricsDailySnapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetricsDailySnapshot.inputTokenBalances = pool.inputTokenBalances;
  poolMetricsDailySnapshot.save();

  // Pool Hourly
  poolMetricsHourlySnapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetricsHourlySnapshot.inputTokenBalances = pool.inputTokenBalances;
  poolMetricsHourlySnapshot.save();
}

// Can we get this from from LIDO rather than LIDOOracle?
export function updateTotalRevenueMetrics(
  block: ethereum.Block,
  postTotalPooledEther: BigInt,
  preTotalPooledEther: BigInt,
  totalShares: BigInt
): void {
  const pool = getOrCreatePool(block.number, block.timestamp);
  const protocol = getOrCreateProtocol();
  const financialMetrics = getOrCreateFinancialDailyMetrics(block);
  const poolMetricsDailySnapshot = getOrCreatePoolsDailySnapshot(
    Address.fromString(PROTOCOL_ID),
    block
  );
  const poolMetricsHourlySnapshot = getOrCreatePoolsHourlySnapshot(
    Address.fromString(PROTOCOL_ID),
    block
  );

  // Staking Rewards
  const stakingRewards = bigIntToBigDecimal(
    postTotalPooledEther.minus(preTotalPooledEther)
  );
  const stakingRewardsUSD = stakingRewards.times(
    getOrCreateToken(Address.fromString(ETH_ADDRESS), block.number)
      .lastPriceUSD!
  );

  // Protocol
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(
    stakingRewardsUSD
  );
  protocol.save();

  // Financials Daily
  financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(
    stakingRewardsUSD
  );
  financialMetrics.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;
  financialMetrics.save();

  // Pool
  pool.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  pool.outputTokenSupply = totalShares;
  pool.outputTokenPriceUSD = getOrCreateToken(
    Address.fromString(PROTOCOL_ID),
    block.number
  ).lastPriceUSD;
  pool.save();

  // Pool Daily
  poolMetricsDailySnapshot.cumulativeTotalRevenueUSD =
    pool.cumulativeTotalRevenueUSD;
  poolMetricsDailySnapshot.dailyTotalRevenueUSD = poolMetricsDailySnapshot.dailyTotalRevenueUSD.plus(
    stakingRewardsUSD
  );
  poolMetricsDailySnapshot.outputTokenSupply = pool.outputTokenSupply;
  poolMetricsDailySnapshot.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolMetricsDailySnapshot.save();

  poolMetricsHourlySnapshot.cumulativeTotalRevenueUSD =
    pool.cumulativeTotalRevenueUSD;
  poolMetricsHourlySnapshot.hourlyTotalRevenueUSD = poolMetricsHourlySnapshot.hourlyTotalRevenueUSD.plus(
    stakingRewardsUSD
  );
  poolMetricsHourlySnapshot.outputTokenSupply = pool.outputTokenSupply;
  poolMetricsHourlySnapshot.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolMetricsHourlySnapshot.save();
}

export function updateProtocolSideRevenueMetrics(
  block: ethereum.Block,
  amount: BigInt
): void {
  const pool = getOrCreatePool(block.number, block.timestamp);
  const protocol = getOrCreateProtocol();
  const financialMetrics = getOrCreateFinancialDailyMetrics(block);
  const poolMetricsDailySnapshot = getOrCreatePoolsDailySnapshot(
    Address.fromString(PROTOCOL_ID),
    block
  );
  const poolMetricsHourlySnapshot = getOrCreatePoolsHourlySnapshot(
    Address.fromString(PROTOCOL_ID),
    block
  );

  // Rewards are minted in stETH, price in stETH
  // TODO: Do we want to price this in ETH?
  // TODO: TBD: Can we get Node Operators list through contract call?
  //            If not, we double treasury amount because we both treasuryRevenue and nodeOperatorsRevenue is 5%.
  const amountUSD = getUsdPrice(
    Address.fromString(PROTOCOL_ID),
    bigIntToBigDecimal(amount.plus(amount))
  );

  // Protocol
  const updatedCumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(
    amountUSD
  );
  protocol.cumulativeProtocolSideRevenueUSD = updatedCumulativeProtocolSideRevenueUSD;
  protocol.save();

  // Financial Daily
  financialMetrics.dailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(
    amountUSD
  );
  financialMetrics.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialMetrics.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.save();

  // Pool
  pool.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  pool.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
  pool.save();

  // Pool Daily
  poolMetricsDailySnapshot.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  const updatedPoolMetricsDailyProtocolSideRevenueUSD = poolMetricsDailySnapshot.dailyProtocolSideRevenueUSD.plus(
    amountUSD
  );
  poolMetricsDailySnapshot.dailyProtocolSideRevenueUSD = updatedPoolMetricsDailyProtocolSideRevenueUSD;
  poolMetricsDailySnapshot.save();

  // Pool Hourly
  poolMetricsHourlySnapshot.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  const updatedPoolMetricsHourlyProtocolSideRevenueUSD = poolMetricsHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(
    amountUSD
  );
  poolMetricsHourlySnapshot.hourlyProtocolSideRevenueUSD = updatedPoolMetricsHourlyProtocolSideRevenueUSD;
  poolMetricsHourlySnapshot.save();
}

export function updateSupplySideRevenueMetrics(block: ethereum.Block): void {
  const pool = getOrCreatePool(block.number, block.timestamp);
  const protocol = getOrCreateProtocol();
  const financialMetrics = getOrCreateFinancialDailyMetrics(block);
  const poolMetricsDailySnapshot = getOrCreatePoolsDailySnapshot(
    Address.fromString(PROTOCOL_ID),
    block
  );
  const poolMetricsHourlySnapshot = getOrCreatePoolsHourlySnapshot(
    Address.fromString(PROTOCOL_ID),
    block
  );

  // Protocol
  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeTotalRevenueUSD.minus(
    protocol.cumulativeProtocolSideRevenueUSD
  );
  protocol.save();

  // Financial Daily
  financialMetrics.dailySupplySideRevenueUSD = financialMetrics.dailyTotalRevenueUSD.minus(
    financialMetrics.dailyProtocolSideRevenueUSD
  );
  financialMetrics.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.save();

  // Pool
  pool.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
  pool.save();

  // Pool Daily
  poolMetricsDailySnapshot.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolMetricsDailySnapshot.dailySupplySideRevenueUSD = poolMetricsDailySnapshot.dailyTotalRevenueUSD.minus(
    poolMetricsDailySnapshot.dailyProtocolSideRevenueUSD
  );
  poolMetricsDailySnapshot.save();

  // Pool Hourly
  poolMetricsHourlySnapshot.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolMetricsHourlySnapshot.hourlySupplySideRevenueUSD = poolMetricsHourlySnapshot.hourlyTotalRevenueUSD.minus(
    poolMetricsHourlySnapshot.hourlyProtocolSideRevenueUSD
  );
  poolMetricsHourlySnapshot.save();
}

export function getOrCreateFinancialDailyMetrics(
  block: ethereum.Block
): FinancialsDailySnapshot {
  let dayId: string = (block.timestamp.toI64() / SECONDS_PER_DAY).toString();
  let financialMetrics = FinancialsDailySnapshot.load(dayId);

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(dayId);
    financialMetrics.protocol = PROTOCOL_ID;

    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  }

  // Set block number and timestamp to the latest for snapshots
  financialMetrics.blockNumber = block.number;
  financialMetrics.timestamp = block.timestamp;

  financialMetrics.save();

  return financialMetrics;
}

export function getOrCreatePoolsDailySnapshot(
  poolAddress: Address,
  block: ethereum.Block
): PoolDailySnapshot {
  let dayId: string = (block.timestamp.toI64() / SECONDS_PER_DAY).toString();
  let poolMetrics = PoolDailySnapshot.load(dayId);

  if (!poolMetrics) {
    poolMetrics = new PoolDailySnapshot(dayId);
    poolMetrics.protocol = getOrCreateProtocol().id;
    poolMetrics.pool = getOrCreatePool(block.number, block.timestamp).id;

    poolMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;

    poolMetrics.inputTokenBalances = [BIGINT_ZERO];
    poolMetrics.outputTokenSupply = BIGINT_ZERO;
    poolMetrics.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    poolMetrics.stakedOutputTokenAmount = BIGINT_ZERO;
  }

  // Set block number and timestamp to the latest for snapshots
  poolMetrics.blockNumber = block.number;
  poolMetrics.timestamp = block.timestamp;

  poolMetrics.save();

  return poolMetrics;
}

export function getOrCreatePoolsHourlySnapshot(
  poolAddress: Address,
  block: ethereum.Block
): PoolHourlySnapshot {
  let hourId: string = (block.timestamp.toI64() / SECONDS_PER_HOUR).toString();
  let poolMetrics = PoolHourlySnapshot.load(hourId);

  if (!poolMetrics) {
    poolMetrics = new PoolHourlySnapshot(hourId);
    poolMetrics.protocol = getOrCreateProtocol().id;
    poolMetrics.pool = getOrCreatePool(block.number, block.timestamp).id;

    poolMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;

    poolMetrics.inputTokenBalances = [BIGINT_ZERO];
    poolMetrics.outputTokenSupply = BIGINT_ZERO;
    poolMetrics.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    poolMetrics.stakedOutputTokenAmount = BIGINT_ZERO;
  }

  // Set block number and timestamp to the latest for snapshots
  poolMetrics.blockNumber = block.number;
  poolMetrics.timestamp = block.timestamp;

  poolMetrics.save();

  return poolMetrics;
}
