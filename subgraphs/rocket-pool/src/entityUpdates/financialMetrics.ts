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
  Minipool,
  PoolDailySnapshot,
  PoolHourlySnapshot,
} from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  ETH_ADDRESS,
  RETH_ADDRESS,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  RPL_ADDRESS,
  BIGDECIMAL_HALF,
} from "../utils/constants";
import { getOrCreateRewardToken, getOrCreateToken } from "../entities/token";
import { getOrCreateMinipool } from "../entities/Minipool";

const PROTOCOL_ID = RETH_ADDRESS;

export function updateMinipoolTvlandRevenue(
  block: ethereum.Block,
  stakingAmount: BigInt,
  slashingAmount: BigInt,
  totalRewardEth: BigInt,
  miniPoolAddress: string
): void {
  const Minipool = getOrCreateMinipool(
    block.number,
    block.timestamp,
    miniPoolAddress
  );
  const pool = getOrCreatePool(block.number, block.timestamp);
  Minipool.inputTokenBalances = [
    Minipool.inputTokenBalances[0].plus(stakingAmount),
  ];

  Minipool.slashAmount = Minipool.slashAmount.plus(slashingAmount);

  var computebalance: BigInt = BIGINT_ZERO;
  let balance = Minipool.inputTokenBalances[0].minus(Minipool.slashAmount);
  if (BigInt.compare(balance, BIGINT_ZERO) > 0) {
    computebalance = balance;
  }
  Minipool.totalValueLockedUSD = bigIntToBigDecimal(computebalance).times(
    getOrCreateToken(Address.fromString(ETH_ADDRESS), block.number)
      .lastPriceUSD!
  );

  pool._miniPoolTotalValueLocked = pool._miniPoolTotalValueLocked.plus(
    Minipool.inputTokenBalances[0]
  );

  let Comissions = pool._miniPoolCommission;

  if (Comissions) {
    Comissions.push(Minipool.comissionRate);
  }
  pool._miniPoolCommission = Comissions;
  pool.cumulativeMinipoolSlashedAmount =
    pool.cumulativeMinipoolSlashedAmount.plus(slashingAmount);

  Minipool.save();
  pool.save();
}

export function getEthAmountUSD(
  amount: BigInt,
  block: ethereum.Block
): BigDecimal {
  return bigIntToBigDecimal(amount).times(
    getOrCreateToken(Address.fromString(ETH_ADDRESS), block.number)
      .lastPriceUSD!
  );
}

export function getEthAmountUSDDecimal(
  amount: BigDecimal,
  block: ethereum.Block
): BigDecimal {
  return amount.times(
    getOrCreateToken(Address.fromString(ETH_ADDRESS), block.number)
      .lastPriceUSD!
  );
}

export function updateProtocolAndPoolTvl(
  block: ethereum.Block,
  amount: BigInt,
  rewardAmount: BigInt
): void {
  const pool = getOrCreatePool(block.number, block.timestamp);
  const protocol = getOrCreateProtocol();

  let inputTokenBalances: BigInt[] = [];
  inputTokenBalances.push(pool.inputTokenBalances[0].plus(rewardAmount));
  inputTokenBalances.push(pool.inputTokenBalances[1].plus(amount));

  pool.inputTokenBalances = inputTokenBalances;

  // inputToken is ETH, price with ETH

  let ethTVLUSD = bigIntToBigDecimal(inputTokenBalances[1]).times(
    getOrCreateToken(Address.fromString(ETH_ADDRESS), block.number)
      .lastPriceUSD!
  );

  let rplTVLUSD = bigIntToBigDecimal(inputTokenBalances[0]).times(
    getOrCreateToken(Address.fromString(RPL_ADDRESS), block.number)
      .lastPriceUSD!
  );

  let totalValueLockedUSD = ethTVLUSD.plus(rplTVLUSD);
  pool.totalValueLockedUSD = totalValueLockedUSD;
  pool.save();

  // Pool Daily and Hourly
  // updateSnapshotsTvl(event.block) is called separately when protocol and supply side revenue
  // metrics are being calculated to consolidate respective revenue metrics into same snapshots

  // Protocol
  protocol.totalValueLockedUSD = pool.totalValueLockedUSD;
  protocol.save();

  // Financials Daily
  // updateSnapshotsTvl(event.block) is called separately when protocol and supply side revenue
  // metrics are being calculated to consolidate respective revenue metrics into same snapshots
}

export function updateSnapshotsTvl(block: ethereum.Block): void {
  const pool = getOrCreatePool(block.number, block.timestamp);
  const poolMetricsDailySnapshot = getOrCreatePoolsDailySnapshot(
    Address.fromString(PROTOCOL_ID),
    block
  );
  const poolMetricsHourlySnapshot = getOrCreatePoolsHourlySnapshot(
    Address.fromString(PROTOCOL_ID),
    block
  );
  const financialMetrics = getOrCreateFinancialDailyMetrics(block);

  // Pool Daily
  poolMetricsDailySnapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetricsDailySnapshot.inputTokenBalances = pool.inputTokenBalances;
  poolMetricsDailySnapshot.save();

  // Pool Hourly
  poolMetricsHourlySnapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetricsHourlySnapshot.inputTokenBalances = pool.inputTokenBalances;
  poolMetricsHourlySnapshot.save();

  // Financials Daily
  financialMetrics.totalValueLockedUSD = pool.totalValueLockedUSD;
  financialMetrics.save();
}

export function updateTotalRevenueMetrics(
  block: ethereum.Block,
  stakingRewards: BigDecimal,
  totalShares: BigInt // of rETH
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

  let additionalRewards = BIGDECIMAL_ZERO;

  const lastPriceUsd = getOrCreateToken(
    Address.fromString(ETH_ADDRESS),
    block.number
  ).lastPriceUSD!;

  const currentEthAmount = bigIntToBigDecimal(pool.inputTokenBalances[1]);

  if (stakingRewards > currentEthAmount) {
    additionalRewards = stakingRewards.minus(currentEthAmount);
  }

  // Pool
  pool.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD.plus(
    additionalRewards.times(lastPriceUsd)
  );
  pool.outputTokenSupply = totalShares;
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
  amount: BigDecimal
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
  let additionalRewards = BIGDECIMAL_ZERO;

  const lastPriceUsd = getOrCreateToken(
    Address.fromString(ETH_ADDRESS),
    block.number
  ).lastPriceUSD!;

  const currentEthAmount = bigIntToBigDecimal(pool._miniPoolTotalValueLocked);

  if (amount > currentEthAmount) {
    additionalRewards = amount.minus(currentEthAmount);
  }

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
  const poolMetricsDailySnapshot = getOrCreatePoolsDailySnapshot(
    Address.fromString(PROTOCOL_ID),
    block
  );
  const poolMetricsHourlySnapshot = getOrCreatePoolsHourlySnapshot(
    Address.fromString(PROTOCOL_ID),
    block
  );

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
  let dayId: string = (block.timestamp.toI64() / SECONDS_PER_DAY).toString();
  let financialMetrics = FinancialsDailySnapshot.load(dayId);
  let pool = getOrCreatePool(block.number, block.timestamp);

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
  poolAddress: Address,
  block: ethereum.Block
): PoolDailySnapshot {
  let dayId: string = (block.timestamp.toI64() / SECONDS_PER_DAY).toString();
  let poolMetrics = PoolDailySnapshot.load(dayId);

  if (!poolMetrics) {
    poolMetrics = new PoolDailySnapshot(dayId);
    poolMetrics.protocol = getOrCreateProtocol().id;
    poolMetrics.pool = getOrCreatePool(block.number, block.timestamp).id;
    let pool = getOrCreatePool(block.number, block.timestamp);

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
    poolMetrics.outputTokenSupply = pool.outputTokenSupply;
    poolMetrics.outputTokenPriceUSD = pool.outputTokenPriceUSD;
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
  let pool = getOrCreatePool(block.number, block.timestamp);

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
    poolMetrics.outputTokenSupply = pool.outputTokenSupply;
    poolMetrics.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  }

  // Set block number and timestamp to the latest for snapshots
  poolMetrics.blockNumber = block.number;
  poolMetrics.timestamp = block.timestamp;

  poolMetrics.save();

  return poolMetrics;
}
