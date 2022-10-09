// import { log } from '@graphprotocol/graph-ts'
import { BigDecimal, ethereum, BigInt, Address } from "@graphprotocol/graph-ts";
import {
  Account,
  ActiveAccount,
  DexAmmProtocol,
  LiquidityPool,
} from "../../generated/schema";
import {
  SECONDS_PER_DAY,
  INT_ZERO,
  INT_ONE,
  BIGDECIMAL_ONE,
  UsageType,
  SECONDS_PER_HOUR,
  INT_TWO,
  BIGINT_ZERO,
  BIGINT_NEG_ONE,
} from "./constants";
import {
  getOrCreateDex,
  getLiquidityPool,
  getLiquidityPoolFee,
  getOrCreateLiquidityPoolDailySnapshot,
  getOrCreateLiquidityPoolHourlySnapshot,
  getOrCreateFinancialsDailySnapshot,
  getOrCreateUsageMetricDailySnapshot,
  getOrCreateUsageMetricHourlySnapshot,
} from "./getters";
import { percToDec } from "./utils";

// Update FinancialsDailySnapshots entity with blocknumber, timestamp, total value locked, and volume
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
  usageMetricsDaily.totalPoolCount = protocol.totalPoolCount;

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

// Update UsagePoolDailySnapshot entity
export function updatePoolMetrics(event: ethereum.Event): void {
  // get or create pool metrics
  let poolMetricsDaily = getOrCreateLiquidityPoolDailySnapshot(event);
  let poolMetricsHourly = getOrCreateLiquidityPoolHourlySnapshot(event);

  let pool = getLiquidityPool(event.address.toHexString());

  // Update the block number and timestamp to that of the last transaction of that day
  poolMetricsDaily.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetricsDaily.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  poolMetricsDaily.inputTokenBalances = pool.inputTokenBalances;
  poolMetricsDaily.inputTokenWeights = pool.inputTokenWeights;
  poolMetricsDaily.blockNumber = event.block.number;
  poolMetricsDaily.timestamp = event.block.timestamp;

  poolMetricsHourly.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetricsHourly.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  poolMetricsHourly.inputTokenBalances = pool.inputTokenBalances;
  poolMetricsHourly.inputTokenWeights = pool.inputTokenWeights;
  poolMetricsHourly.blockNumber = event.block.number;
  poolMetricsHourly.timestamp = event.block.timestamp;

  poolMetricsDaily.save();
  poolMetricsHourly.save();
}

// Update the volume and accrued fees for all relavant entities
export function updateVolumeAndFees(
  event: ethereum.Event,
  protocol: DexAmmProtocol,
  pool: LiquidityPool,
  trackedAmountUSD: BigDecimal[],
  token0Amount: BigInt,
  token1Amount: BigInt
): void {
  let financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  let poolMetricsDaily = getOrCreateLiquidityPoolDailySnapshot(event);
  let poolMetricsHourly = getOrCreateLiquidityPoolHourlySnapshot(event);
  let supplyFee = getLiquidityPoolFee(pool.fees[INT_ZERO]);
  let protocolFee = getLiquidityPoolFee(pool.fees[INT_ONE]);
  let tradingFee = getLiquidityPoolFee(pool.fees[INT_TWO]);

  // Update volume occurred during swaps

  // Daily volume by pool token in USD
  poolMetricsDaily.dailyVolumeByTokenUSD = [
    poolMetricsDaily.dailyVolumeByTokenUSD[INT_ZERO].plus(
      trackedAmountUSD[INT_ZERO]
    ),
    poolMetricsDaily.dailyVolumeByTokenUSD[INT_ONE].plus(
      trackedAmountUSD[INT_ONE]
    ),
  ];

  // Daily volume by pool token amount
  if (token0Amount.lt(BIGINT_ZERO)) {
    poolMetricsDaily.dailyVolumeByTokenAmount = [
      poolMetricsDaily.dailyVolumeByTokenAmount[INT_ZERO].plus(
        token0Amount.times(BIGINT_NEG_ONE)
      ),
      poolMetricsDaily.dailyVolumeByTokenAmount[INT_ONE].plus(token1Amount),
    ];
  } else {
    poolMetricsDaily.dailyVolumeByTokenAmount = [
      poolMetricsDaily.dailyVolumeByTokenAmount[INT_ZERO].plus(token0Amount),
      poolMetricsDaily.dailyVolumeByTokenAmount[INT_ONE].plus(
        token1Amount.times(BIGINT_NEG_ONE)
      ),
    ];
  }

  // Hourly volume by pool token in USD
  poolMetricsHourly.hourlyVolumeByTokenUSD = [
    poolMetricsHourly.hourlyVolumeByTokenUSD[INT_ZERO].plus(
      trackedAmountUSD[INT_ZERO]
    ),
    poolMetricsHourly.hourlyVolumeByTokenUSD[INT_ONE].plus(
      trackedAmountUSD[INT_ONE]
    ),
  ];

  // Hourly volume by pool token amount
  if (token0Amount.lt(BIGINT_ZERO)) {
    poolMetricsHourly.hourlyVolumeByTokenAmount = [
      poolMetricsHourly.hourlyVolumeByTokenAmount[INT_ZERO].plus(
        token0Amount.times(BIGINT_NEG_ONE)
      ),
      poolMetricsHourly.hourlyVolumeByTokenAmount[INT_ONE].plus(token1Amount),
    ];
  } else {
    poolMetricsHourly.hourlyVolumeByTokenAmount = [
      poolMetricsHourly.hourlyVolumeByTokenAmount[INT_ZERO].plus(token0Amount),
      poolMetricsHourly.hourlyVolumeByTokenAmount[INT_ONE].plus(
        token1Amount.times(BIGINT_NEG_ONE)
      ),
    ];
  }

  // Daily volume by pool in USD
  poolMetricsDaily.dailyVolumeUSD = poolMetricsDaily.dailyVolumeUSD.plus(
    trackedAmountUSD[INT_TWO]
  );
  poolMetricsHourly.hourlyVolumeUSD = poolMetricsHourly.hourlyVolumeUSD.plus(
    trackedAmountUSD[INT_TWO]
  );

  financialMetrics.dailyVolumeUSD = financialMetrics.dailyVolumeUSD.plus(
    trackedAmountUSD[INT_TWO]
  );
  pool.cumulativeVolumeUSD = pool.cumulativeVolumeUSD.plus(
    trackedAmountUSD[INT_TWO]
  );
  protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(
    trackedAmountUSD[INT_TWO]
  );

  // Fee Amounts
  let tradingFeeAmountUSD = trackedAmountUSD[INT_TWO].times(
    percToDec(tradingFee.feePercentage!)
  );
  let supplyFeeAmountUSD = trackedAmountUSD[INT_TWO].times(
    percToDec(supplyFee.feePercentage!)
  );
  let protocolFeeAmountUSD = trackedAmountUSD[INT_TWO].times(
    percToDec(protocolFee.feePercentage!)
  );
  // TODO: keep/remove
  // let protocolFeeAmountUSD = tradingFeeAmountUSD.minus(supplyFeeAmountUSD);

  // Update fees collected during swaps
  // Protocol revenues
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(tradingFeeAmountUSD);
  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(supplyFeeAmountUSD);
  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(protocolFeeAmountUSD);

  // Pool revenues
  pool.cumulativeTotalRevenueUSD =
    pool.cumulativeTotalRevenueUSD.plus(tradingFeeAmountUSD);
  pool.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD.plus(supplyFeeAmountUSD);
  pool.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD.plus(protocolFeeAmountUSD);

  // Financial Metrics revenues
  financialMetrics.dailyTotalRevenueUSD =
    financialMetrics.dailyTotalRevenueUSD.plus(tradingFeeAmountUSD);
  financialMetrics.dailySupplySideRevenueUSD =
    financialMetrics.dailySupplySideRevenueUSD.plus(supplyFeeAmountUSD);
  financialMetrics.dailyProtocolSideRevenueUSD =
    financialMetrics.dailyProtocolSideRevenueUSD.plus(protocolFeeAmountUSD);

  financialMetrics.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;
  financialMetrics.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;

  // Daily Pool Metrics revenues
  poolMetricsDaily.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  poolMetricsDaily.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolMetricsDaily.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;

  poolMetricsDaily.dailyTotalRevenueUSD =
    poolMetricsDaily.dailyTotalRevenueUSD.plus(tradingFeeAmountUSD);
  poolMetricsDaily.dailySupplySideRevenueUSD =
    poolMetricsDaily.dailySupplySideRevenueUSD.plus(supplyFeeAmountUSD);
  poolMetricsDaily.dailyProtocolSideRevenueUSD =
    poolMetricsDaily.dailyProtocolSideRevenueUSD.plus(protocolFeeAmountUSD);

  // Hourly Pool Metrics revenues
  poolMetricsHourly.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  poolMetricsHourly.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolMetricsHourly.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;

  poolMetricsHourly.hourlyTotalRevenueUSD =
    poolMetricsHourly.hourlyTotalRevenueUSD.plus(tradingFeeAmountUSD);
  poolMetricsHourly.hourlySupplySideRevenueUSD =
    poolMetricsHourly.hourlySupplySideRevenueUSD.plus(supplyFeeAmountUSD);
  poolMetricsHourly.hourlyProtocolSideRevenueUSD =
    poolMetricsHourly.hourlyProtocolSideRevenueUSD.plus(protocolFeeAmountUSD);

  financialMetrics.save();
  poolMetricsDaily.save();
  poolMetricsHourly.save();
  protocol.save();
  pool.save();
}
