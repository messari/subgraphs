import {
  Address,
  BigInt,
  BigDecimal,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { bigIntToBigDecimal } from "../utils/numbers";
import { getOrCreateProtocol } from "../entities/protocol";
import { getOrCreatePool } from "../entities/pool";
import {
  FinancialsDailySnapshot,
  PoolDailySnapshot,
  PoolHourlySnapshot,
} from "../../generated/schema";
import { getOrCreateToken } from "../entities/token";
import {
  BIGDECIMAL_ZERO,
  ETH_ADDRESS,
  RETH_ADDRESS,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  RPL_ADDRESS,
} from "../utils/constants";

const PROTOCOL_ID = RETH_ADDRESS;

export function updateProtocolAndPoolRewardsTvl(
  blockNumber: BigInt,
  blockTimestamp: BigInt,
  rewardAmount: BigInt
): void {
  const pool = getOrCreatePool(blockNumber, blockTimestamp);
  const protocol = getOrCreateProtocol();

  const inputTokenBalances: BigInt[] = [];
  inputTokenBalances.push(rewardAmount);
  inputTokenBalances.push(pool.inputTokenBalances[1]);

  pool.inputTokenBalances = inputTokenBalances;

  // inputToken is ETH, price with ETH

  const rplPriceUSD = getOrCreateToken(
    Address.fromString(RPL_ADDRESS),
    blockNumber
  ).lastPriceUSD!;
  const ethPriceUSD = getOrCreateToken(
    Address.fromString(ETH_ADDRESS),
    blockNumber
  ).lastPriceUSD!;

  const ethTVLUSD = bigIntToBigDecimal(inputTokenBalances[1]).times(
    ethPriceUSD
  );
  const rplTVLUSD = bigIntToBigDecimal(inputTokenBalances[0]).times(
    rplPriceUSD
  );

  pool.inputTokenBalancesUSD = [rplTVLUSD, ethTVLUSD];

  const totalValueLockedUSD = ethTVLUSD.plus(rplTVLUSD);
  pool.totalValueLockedUSD = totalValueLockedUSD;
  pool.save();

  // Protocol
  protocol.totalValueLockedUSD = pool.totalValueLockedUSD;
  protocol.save();
}

export function updateProtocolAndPoolTvl(
  blockNumber: BigInt,
  blockTimestamp: BigInt,
  amount: BigInt
): void {
  const pool = getOrCreatePool(blockNumber, blockTimestamp);
  const protocol = getOrCreateProtocol();

  log.error("[updateProtocolAndPooLTvl] amount: {}", [amount.toString()]);

  const inputTokenBalances: BigInt[] = [];
  inputTokenBalances.push(pool.inputTokenBalances[0]);
  inputTokenBalances.push(amount);

  pool.inputTokenBalances = inputTokenBalances;

  const ethTVLUSD = bigIntToBigDecimal(inputTokenBalances[1]).times(
    getOrCreateToken(Address.fromString(ETH_ADDRESS), blockNumber).lastPriceUSD!
  );

  const rplTVLUSD = bigIntToBigDecimal(inputTokenBalances[0]).times(
    getOrCreateToken(Address.fromString(RPL_ADDRESS), blockNumber).lastPriceUSD!
  );

  pool.inputTokenBalancesUSD = [rplTVLUSD, ethTVLUSD];

  const totalValueLockedUSD = ethTVLUSD.plus(rplTVLUSD);
  pool.totalValueLockedUSD = totalValueLockedUSD;
  pool.save();

  // Protocol
  protocol.totalValueLockedUSD = pool.totalValueLockedUSD;
  protocol.save();
}

export function updateSnapshotsTvl(block: ethereum.Block): void {
  const pool = getOrCreatePool(block.number, block.timestamp);
  const poolMetricsDailySnapshot = getOrCreatePoolsDailySnapshot(block);
  const poolMetricsHourlySnapshot = getOrCreatePoolsHourlySnapshot(block);
  const financialMetrics = getOrCreateFinancialDailyMetrics(block);

  // Pool Daily
  poolMetricsDailySnapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetricsDailySnapshot.inputTokenBalances = pool.inputTokenBalances;
  poolMetricsDailySnapshot.inputTokenBalancesUSD = pool.inputTokenBalancesUSD;
  poolMetricsDailySnapshot.save();

  // Pool Hourly
  poolMetricsHourlySnapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetricsHourlySnapshot.inputTokenBalances = pool.inputTokenBalances;
  poolMetricsHourlySnapshot.inputTokenBalancesUSD = pool.inputTokenBalancesUSD;
  poolMetricsHourlySnapshot.save();

  // Financials Daily
  financialMetrics.totalValueLockedUSD = pool.totalValueLockedUSD;
  financialMetrics.save();
}

export function updateTotalRewardsMetrics(
  block: ethereum.Block,
  additionalRewards: BigInt
): void {
  const financialMetrics = getOrCreateFinancialDailyMetrics(block);
  const poolMetricsDailySnapshot = getOrCreatePoolsDailySnapshot(block);
  const poolMetricsHourlySnapshot = getOrCreatePoolsHourlySnapshot(block);

  const lastRewardPriceUsd = getOrCreateToken(
    Address.fromString(RPL_ADDRESS),
    block.number
  ).lastPriceUSD!;

  const newDailyEmissions =
    poolMetricsDailySnapshot.rewardTokenEmissionsAmount![0].plus(
      additionalRewards
    );
  const newHourlyEmissions =
    poolMetricsDailySnapshot.rewardTokenEmissionsAmount![0].plus(
      additionalRewards
    );

  poolMetricsDailySnapshot.rewardTokenEmissionsAmount = [newDailyEmissions];

  poolMetricsDailySnapshot.rewardTokenEmissionsUSD = [
    bigIntToBigDecimal(newDailyEmissions).times(lastRewardPriceUsd),
  ];

  poolMetricsDailySnapshot.save();

  poolMetricsHourlySnapshot.rewardTokenEmissionsAmount! = [newHourlyEmissions];
  poolMetricsHourlySnapshot.rewardTokenEmissionsUSD! = [
    bigIntToBigDecimal(newHourlyEmissions).times(lastRewardPriceUsd),
  ];
  poolMetricsHourlySnapshot.save();

  financialMetrics.save();
}

export function updateTotalRevenueMetrics(
  block: ethereum.Block,
  additionalRevenue: BigInt,
  totalShares: BigInt // of rETH
): void {
  const pool = getOrCreatePool(block.number, block.timestamp);
  const protocol = getOrCreateProtocol();
  const financialMetrics = getOrCreateFinancialDailyMetrics(block);
  const poolMetricsDailySnapshot = getOrCreatePoolsDailySnapshot(block);
  const poolMetricsHourlySnapshot = getOrCreatePoolsHourlySnapshot(block);

  const additionalRewards = bigIntToBigDecimal(additionalRevenue);

  const lastPriceUsd = getOrCreateToken(
    Address.fromString(ETH_ADDRESS),
    block.number
  ).lastPriceUSD!;

  // Pool
  pool.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD.plus(
    additionalRewards.times(lastPriceUsd)
  );

  pool.outputTokenSupply = totalShares;
  pool.stakedOutputTokenAmount = totalShares;

  pool.outputTokenPriceUSD = getOrCreateToken(
    Address.fromString(PROTOCOL_ID),
    block.number
  ).lastPriceUSD;
  pool.save();

  // Pool Daily
  poolMetricsDailySnapshot.cumulativeTotalRevenueUSD =
    pool.cumulativeTotalRevenueUSD;
  poolMetricsDailySnapshot.dailyTotalRevenueUSD =
    poolMetricsDailySnapshot.dailyTotalRevenueUSD.plus(
      additionalRewards.times(lastPriceUsd)
    );
  poolMetricsDailySnapshot.outputTokenSupply = pool.outputTokenSupply;
  poolMetricsDailySnapshot.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolMetricsDailySnapshot.stakedOutputTokenAmount = pool.outputTokenSupply;
  poolMetricsDailySnapshot.save();

  // Pool Hourly
  poolMetricsHourlySnapshot.cumulativeTotalRevenueUSD =
    pool.cumulativeTotalRevenueUSD;
  poolMetricsHourlySnapshot.hourlyTotalRevenueUSD =
    poolMetricsHourlySnapshot.hourlyTotalRevenueUSD.plus(
      additionalRewards.times(lastPriceUsd)
    );
  poolMetricsHourlySnapshot.outputTokenSupply = pool.outputTokenSupply;
  poolMetricsHourlySnapshot.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolMetricsHourlySnapshot.stakedOutputTokenAmount = pool.outputTokenSupply;

  poolMetricsHourlySnapshot.save();

  // Protocol
  protocol.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  protocol.save();

  // Financials Daily
  financialMetrics.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  financialMetrics.dailyTotalRevenueUSD =
    poolMetricsDailySnapshot.dailyTotalRevenueUSD;
  financialMetrics.save();
}

export function updateProtocolSideRevenueMetrics(
  block: ethereum.Block,
  additionalRevenue: BigDecimal
): void {
  const pool = getOrCreatePool(block.number, block.timestamp);
  const protocol = getOrCreateProtocol();
  const financialMetrics = getOrCreateFinancialDailyMetrics(block);
  const poolMetricsDailySnapshot = getOrCreatePoolsDailySnapshot(block);
  const poolMetricsHourlySnapshot = getOrCreatePoolsHourlySnapshot(block);
  const additionalRewards = additionalRevenue;

  const lastPriceUsd = getOrCreateToken(
    Address.fromString(ETH_ADDRESS),
    block.number
  ).lastPriceUSD!;

  // Pool
  pool.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD.plus(
      additionalRewards.times(lastPriceUsd)
    );
  pool.save();

  // Pool Daily
  poolMetricsDailySnapshot.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  poolMetricsDailySnapshot.dailyProtocolSideRevenueUSD =
    poolMetricsDailySnapshot.dailyProtocolSideRevenueUSD.plus(
      additionalRewards.times(lastPriceUsd)
    );
  poolMetricsDailySnapshot.save();

  // Pool Hourly
  poolMetricsHourlySnapshot.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  poolMetricsHourlySnapshot.hourlyProtocolSideRevenueUSD =
    poolMetricsHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(
      additionalRewards.times(lastPriceUsd)
    );
  poolMetricsHourlySnapshot.save();

  // Protocol
  protocol.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  protocol.save();

  // Financial Daily
  financialMetrics.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  financialMetrics.dailyProtocolSideRevenueUSD =
    financialMetrics.dailyProtocolSideRevenueUSD.plus(
      additionalRewards.times(lastPriceUsd)
    );
  financialMetrics.save();
}

export function updateSupplySideRevenueMetrics(block: ethereum.Block): void {
  const pool = getOrCreatePool(block.number, block.timestamp);
  const protocol = getOrCreateProtocol();
  const financialMetrics = getOrCreateFinancialDailyMetrics(block);
  const poolMetricsDailySnapshot = getOrCreatePoolsDailySnapshot(block);
  const poolMetricsHourlySnapshot = getOrCreatePoolsHourlySnapshot(block);

  // Pool
  pool.cumulativeSupplySideRevenueUSD =
    pool.cumulativeTotalRevenueUSD <= pool.cumulativeProtocolSideRevenueUSD
      ? BIGDECIMAL_ZERO
      : pool.cumulativeTotalRevenueUSD.minus(
          pool.cumulativeProtocolSideRevenueUSD
        );
  pool.save();

  // Pool Daily
  poolMetricsDailySnapshot.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolMetricsDailySnapshot.dailySupplySideRevenueUSD =
    poolMetricsDailySnapshot.dailyTotalRevenueUSD <=
    poolMetricsDailySnapshot.dailyProtocolSideRevenueUSD
      ? BIGDECIMAL_ZERO
      : poolMetricsDailySnapshot.dailyTotalRevenueUSD.minus(
          poolMetricsDailySnapshot.dailyProtocolSideRevenueUSD
        );
  poolMetricsDailySnapshot.save();

  // Pool Hourly
  poolMetricsHourlySnapshot.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolMetricsHourlySnapshot.hourlySupplySideRevenueUSD =
    poolMetricsHourlySnapshot.hourlyTotalRevenueUSD <=
    poolMetricsHourlySnapshot.hourlyProtocolSideRevenueUSD
      ? BIGDECIMAL_ZERO
      : poolMetricsHourlySnapshot.hourlyTotalRevenueUSD.minus(
          poolMetricsHourlySnapshot.hourlyProtocolSideRevenueUSD
        );
  poolMetricsHourlySnapshot.save();

  // Protocol
  protocol.cumulativeSupplySideRevenueUSD = pool.cumulativeSupplySideRevenueUSD;
  protocol.save();

  // Financial Daily
  financialMetrics.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  financialMetrics.dailySupplySideRevenueUSD =
    financialMetrics.dailyTotalRevenueUSD <=
    financialMetrics.dailyProtocolSideRevenueUSD
      ? BIGDECIMAL_ZERO
      : financialMetrics.dailyTotalRevenueUSD.minus(
          financialMetrics.dailyProtocolSideRevenueUSD
        );
  financialMetrics.save();
}

export function getOrCreateFinancialDailyMetrics(
  block: ethereum.Block
): FinancialsDailySnapshot {
  const dayId: string = (block.timestamp.toI64() / SECONDS_PER_DAY).toString();
  let financialMetrics = FinancialsDailySnapshot.load(dayId);
  const pool = getOrCreatePool(block.number, block.timestamp);

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(dayId);
    financialMetrics.protocol = PROTOCOL_ID;

    financialMetrics.totalValueLockedUSD = pool.totalValueLockedUSD;
    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD =
      pool.cumulativeProtocolSideRevenueUSD;
    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeSupplySideRevenueUSD =
      pool.cumulativeSupplySideRevenueUSD;
  }

  // Set block number and timestamp to the latest for snapshots
  financialMetrics.blockNumber = block.number;
  financialMetrics.timestamp = block.timestamp;

  financialMetrics.save();

  return financialMetrics;
}

export function getOrCreatePoolsDailySnapshot(
  block: ethereum.Block
): PoolDailySnapshot {
  const dayId: string = (block.timestamp.toI64() / SECONDS_PER_DAY).toString();
  let poolMetrics = PoolDailySnapshot.load(dayId);

  if (!poolMetrics) {
    poolMetrics = new PoolDailySnapshot(dayId);
    poolMetrics.protocol = getOrCreateProtocol().id;
    poolMetrics.pool = getOrCreatePool(block.number, block.timestamp).id;
    const pool = getOrCreatePool(block.number, block.timestamp);

    poolMetrics.totalValueLockedUSD = pool.totalValueLockedUSD;
    poolMetrics.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
    poolMetrics.cumulativeSupplySideRevenueUSD =
      pool.cumulativeSupplySideRevenueUSD;
    poolMetrics.cumulativeProtocolSideRevenueUSD =
      pool.cumulativeProtocolSideRevenueUSD;
    poolMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.inputTokenBalances = pool.inputTokenBalances;
    poolMetrics.inputTokenBalancesUSD = pool.inputTokenBalancesUSD;
    poolMetrics.outputTokenSupply = pool.outputTokenSupply;
    poolMetrics.outputTokenPriceUSD = pool.outputTokenPriceUSD;
    poolMetrics.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
    poolMetrics.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
    poolMetrics.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;
  }

  // Set block number and timestamp to the latest for snapshots
  poolMetrics.blockNumber = block.number;
  poolMetrics.timestamp = block.timestamp;

  poolMetrics.save();

  return poolMetrics;
}

export function getOrCreatePoolsHourlySnapshot(
  block: ethereum.Block
): PoolHourlySnapshot {
  const hourId: string = (
    block.timestamp.toI64() / SECONDS_PER_HOUR
  ).toString();
  let poolMetrics = PoolHourlySnapshot.load(hourId);
  const pool = getOrCreatePool(block.number, block.timestamp);

  if (!poolMetrics) {
    poolMetrics = new PoolHourlySnapshot(hourId);
    poolMetrics.protocol = getOrCreateProtocol().id;
    poolMetrics.pool = getOrCreatePool(block.number, block.timestamp).id;

    poolMetrics.totalValueLockedUSD = pool.totalValueLockedUSD;
    poolMetrics.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
    poolMetrics.cumulativeSupplySideRevenueUSD =
      pool.cumulativeSupplySideRevenueUSD;
    poolMetrics.cumulativeProtocolSideRevenueUSD =
      pool.cumulativeProtocolSideRevenueUSD;
    poolMetrics.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;

    poolMetrics.inputTokenBalances = pool.inputTokenBalances;
    poolMetrics.inputTokenBalancesUSD = pool.inputTokenBalancesUSD;
    poolMetrics.outputTokenSupply = pool.outputTokenSupply;
    poolMetrics.outputTokenPriceUSD = pool.outputTokenPriceUSD;
    poolMetrics.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
    poolMetrics.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
    poolMetrics.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;
  }

  // Set block number and timestamp to the latest for snapshots
  poolMetrics.blockNumber = block.number;
  poolMetrics.timestamp = block.timestamp;

  poolMetrics.save();

  return poolMetrics;
}
