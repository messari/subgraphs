import { BigInt, Address, cosmos, BigDecimal } from "@graphprotocol/graph-ts";
import {
  Account,
  ActiveAccount,
  LiquidityPool as LiquidityPoolStore,
  LiquidityPoolFee,
} from "../../generated/schema";
import * as constants from "../common/constants";
import {
  getOrCreateDexAmmProtocol,
  getOrCreateFinancialDailySnapshots,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
  getOrCreateLiquidityPoolDailySnapshots,
  getOrCreateLiquidityPoolHourlySnapshots,
} from "../common/initializer";
import { updateRevenueSnapshots } from "./Revenue";

export function updateUsageMetrics(
  block: cosmos.HeaderOnlyBlock,
  from: Address
): void {
  const protocol = getOrCreateDexAmmProtocol();
  const usageMetricsDaily = getOrCreateUsageMetricsDailySnapshot(block);
  const usageMetricsHourly = getOrCreateUsageMetricsHourlySnapshot(block);

  const blockNumber = BigInt.fromI32(block.header.height as i32);
  usageMetricsDaily.blockNumber = blockNumber;
  usageMetricsHourly.blockNumber = blockNumber;

  const timestamp = BigInt.fromI32(block.header.time.seconds as i32);
  usageMetricsDaily.timestamp = timestamp;
  usageMetricsHourly.timestamp = timestamp;

  usageMetricsDaily.dailyTransactionCount += 1;
  usageMetricsHourly.hourlyTransactionCount += 1;

  usageMetricsDaily.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetricsHourly.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  const dailyActiveAccountId = (
    block.header.time.seconds / constants.SECONDS_PER_DAY
  )
    .toString()
    .concat("-")
    .concat(from.toHexString());
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();

    usageMetricsDaily.dailyActiveUsers += 1;
    usageMetricsHourly.hourlyActiveUsers += 1;
  }

  usageMetricsDaily.save();
  usageMetricsHourly.save();
}

export function updatePoolSnapshots(
  liquidityPoolId: string,
  block: cosmos.HeaderOnlyBlock
): void {
  const pool = LiquidityPoolStore.load(liquidityPoolId);
  if (!pool) {
    return;
  }
  const poolDailySnapshots = getOrCreateLiquidityPoolDailySnapshots(
    liquidityPoolId,
    block
  );
  const poolHourlySnapshots = getOrCreateLiquidityPoolHourlySnapshots(
    liquidityPoolId,
    block
  );
  if (!poolDailySnapshots || !poolHourlySnapshots) {
    return;
  }

  poolDailySnapshots.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolHourlySnapshots.totalValueLockedUSD = pool.totalValueLockedUSD;

  poolDailySnapshots.inputTokenBalances = pool.inputTokenBalances;
  poolHourlySnapshots.inputTokenBalances = pool.inputTokenBalances;

  poolDailySnapshots.inputTokenWeights = pool.inputTokenWeights;
  poolHourlySnapshots.inputTokenWeights = pool.inputTokenWeights;

  poolDailySnapshots.outputTokenSupply = pool.outputTokenSupply!;
  poolHourlySnapshots.outputTokenSupply = pool.outputTokenSupply!;

  poolDailySnapshots.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolHourlySnapshots.outputTokenPriceUSD = pool.outputTokenPriceUSD;

  poolDailySnapshots.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;
  poolHourlySnapshots.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;

  poolDailySnapshots.rewardTokenEmissionsAmount =
    pool.rewardTokenEmissionsAmount;
  poolHourlySnapshots.rewardTokenEmissionsAmount =
    pool.rewardTokenEmissionsAmount;

  poolDailySnapshots.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
  poolHourlySnapshots.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;

  poolDailySnapshots.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  poolHourlySnapshots.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;

  poolDailySnapshots.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolHourlySnapshots.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;

  poolDailySnapshots.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  poolHourlySnapshots.cumulativeTotalRevenueUSD =
    pool.cumulativeTotalRevenueUSD;

  poolDailySnapshots.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  poolHourlySnapshots.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;

  poolDailySnapshots.blockNumber = BigInt.fromI32(block.header.height as i32);
  poolHourlySnapshots.blockNumber = BigInt.fromI32(block.header.height as i32);

  const timestamp = BigInt.fromI32(block.header.time.seconds as i32);
  poolDailySnapshots.timestamp = timestamp;
  poolHourlySnapshots.timestamp = timestamp;

  poolHourlySnapshots.save();
  poolDailySnapshots.save();
}

export function updateFinancials(block: cosmos.HeaderOnlyBlock): void {
  const protocol = getOrCreateDexAmmProtocol();
  const financialMetrics = getOrCreateFinancialDailySnapshots(block);

  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetrics.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD;
  financialMetrics.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialMetrics.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;

  financialMetrics.blockNumber = BigInt.fromI32(block.header.height as i32);
  financialMetrics.timestamp = BigInt.fromI32(block.header.time.seconds as i32);

  financialMetrics.save();
}

export function updateTokenVolumeAndBalance(
  liquidityPoolId: string,
  tokenAddress: string,
  tokenAmount: BigInt,
  tokenAmountUSD: BigDecimal,
  block: cosmos.HeaderOnlyBlock
): void {
  const pool = LiquidityPoolStore.load(liquidityPoolId);
  if (!pool) {
    return;
  }
  const poolDailySnaphot = getOrCreateLiquidityPoolDailySnapshots(
    liquidityPoolId,
    block
  );
  const poolHourlySnaphot = getOrCreateLiquidityPoolHourlySnapshots(
    liquidityPoolId,
    block
  );
  if (!poolDailySnaphot || !poolHourlySnaphot) {
    return;
  }

  const tokenIndex = pool.inputTokens.indexOf(tokenAddress);
  if (tokenIndex < 0) {
    return;
  }

  const dailyVolumeByTokenAmount = poolDailySnaphot.dailyVolumeByTokenAmount;
  dailyVolumeByTokenAmount[tokenIndex] = dailyVolumeByTokenAmount[
    tokenIndex
  ].plus(tokenAmount);
  const hourlyVolumeByTokenAmount = poolHourlySnaphot.hourlyVolumeByTokenAmount;
  hourlyVolumeByTokenAmount[tokenIndex] = hourlyVolumeByTokenAmount[
    tokenIndex
  ].plus(tokenAmount);
  poolDailySnaphot.dailyVolumeByTokenAmount = dailyVolumeByTokenAmount;
  poolHourlySnaphot.hourlyVolumeByTokenAmount = hourlyVolumeByTokenAmount;

  const dailyVolumeByTokenUSD = poolDailySnaphot.dailyVolumeByTokenUSD;
  dailyVolumeByTokenUSD[tokenIndex] = dailyVolumeByTokenUSD[tokenIndex].plus(
    tokenAmountUSD
  );
  const hourlyVolumeByTokenUSD = poolHourlySnaphot.hourlyVolumeByTokenUSD;
  hourlyVolumeByTokenUSD[tokenIndex] = hourlyVolumeByTokenUSD[tokenIndex].plus(
    tokenAmountUSD
  );
  poolDailySnaphot.dailyVolumeByTokenUSD = dailyVolumeByTokenUSD;
  poolHourlySnaphot.hourlyVolumeByTokenUSD = hourlyVolumeByTokenUSD;

  poolHourlySnaphot.save();
  poolDailySnaphot.save();
}

export function updateSnapshotsVolume(
  liquidityPoolId: string,
  volumeUSD: BigDecimal,
  block: cosmos.HeaderOnlyBlock
): void {
  const protocol = getOrCreateDexAmmProtocol();
  const financialsDailySnapshot = getOrCreateFinancialDailySnapshots(block);
  const liquidityPool = LiquidityPoolStore.load(liquidityPoolId);
  if (!liquidityPool) {
    return;
  }
  const poolDailySnaphot = getOrCreateLiquidityPoolDailySnapshots(
    liquidityPoolId,
    block
  );
  const poolHourlySnaphot = getOrCreateLiquidityPoolHourlySnapshots(
    liquidityPoolId,
    block
  );
  if (!poolDailySnaphot || !poolHourlySnaphot) {
    return;
  }

  const blockNumber = BigInt.fromI32(block.header.height as i32);
  const timestamp = BigInt.fromI32(block.header.time.seconds as i32);

  protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(volumeUSD);

  financialsDailySnapshot.dailyVolumeUSD = financialsDailySnapshot.dailyVolumeUSD.plus(
    volumeUSD
  );
  financialsDailySnapshot.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD;
  financialsDailySnapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialsDailySnapshot.blockNumber = blockNumber;
  financialsDailySnapshot.timestamp = timestamp;

  poolDailySnaphot.dailyVolumeUSD = poolDailySnaphot.dailyVolumeUSD.plus(
    volumeUSD
  );
  poolDailySnaphot.cumulativeVolumeUSD = liquidityPool.cumulativeVolumeUSD;
  poolDailySnaphot.totalValueLockedUSD = liquidityPool.totalValueLockedUSD;
  poolDailySnaphot.inputTokenBalances = liquidityPool.inputTokenBalances;
  poolDailySnaphot.inputTokenWeights = liquidityPool.inputTokenWeights;
  poolDailySnaphot.outputTokenSupply = liquidityPool.outputTokenSupply;
  poolDailySnaphot.outputTokenPriceUSD = liquidityPool.outputTokenPriceUSD;
  poolDailySnaphot.blockNumber = blockNumber;
  poolDailySnaphot.timestamp = timestamp;

  poolHourlySnaphot.hourlyVolumeUSD = poolHourlySnaphot.hourlyVolumeUSD.plus(
    volumeUSD
  );
  poolHourlySnaphot.cumulativeVolumeUSD = liquidityPool.cumulativeVolumeUSD;
  poolHourlySnaphot.totalValueLockedUSD = liquidityPool.totalValueLockedUSD;
  poolHourlySnaphot.inputTokenBalances = liquidityPool.inputTokenBalances;
  poolHourlySnaphot.inputTokenWeights = liquidityPool.inputTokenWeights;
  poolHourlySnaphot.outputTokenSupply = liquidityPool.outputTokenSupply;
  poolHourlySnaphot.outputTokenPriceUSD = liquidityPool.outputTokenPriceUSD;
  poolHourlySnaphot.blockNumber = blockNumber;
  poolHourlySnaphot.timestamp = timestamp;

  protocol.save();
  financialsDailySnapshot.save();
  poolDailySnaphot.save();
  poolHourlySnaphot.save();
}

export function updateSupplySideRevenue(
  liquidityPoolId: string,
  volumeUSD: BigDecimal,
  block: cosmos.HeaderOnlyBlock
): void {
  const pool = LiquidityPoolStore.load(liquidityPoolId);
  if (!pool) {
    return;
  }
  const poolFees = pool.fees;
  if (!poolFees || poolFees.length != 3) {
    return;
  }
  const tradingFee = LiquidityPoolFee.load(poolFees[0]);
  if (!tradingFee || !tradingFee.feePercentage) {
    return;
  }

  const supplySideRevenueUSD = volumeUSD
    .times(tradingFee.feePercentage!)
    .div(constants.BIGDECIMAL_HUNDRED);

  updateRevenueSnapshots(
    pool,
    supplySideRevenueUSD,
    constants.BIGDECIMAL_ZERO,
    block
  );
}

export function updateMetrics(
  block: cosmos.HeaderOnlyBlock,
  from: string,
  usageType: string
): void {
  const protocol = getOrCreateDexAmmProtocol();

  // Update hourly and daily deposit transaction count
  const metricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(block);
  const metricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(block);

  metricsDailySnapshot.blockNumber = BigInt.fromI32(block.header.height as i32);
  metricsDailySnapshot.timestamp = BigInt.fromI32(
    block.header.time.seconds as i32
  );
  metricsDailySnapshot.dailyTransactionCount += 1;

  metricsHourlySnapshot.blockNumber = BigInt.fromI32(
    block.header.height as i32
  );
  metricsHourlySnapshot.timestamp = BigInt.fromI32(
    block.header.time.seconds as i32
  );
  metricsHourlySnapshot.hourlyTransactionCount += 1;

  if (usageType == constants.UsageType.DEPOSIT) {
    metricsDailySnapshot.dailyDepositCount += 1;
    metricsHourlySnapshot.hourlyDepositCount += 1;
  } else if (usageType == constants.UsageType.WITHDRAW) {
    metricsDailySnapshot.dailyWithdrawCount += 1;
    metricsHourlySnapshot.hourlyWithdrawCount += 1;
  } else if (usageType == constants.UsageType.SWAP) {
    metricsDailySnapshot.dailySwapCount += 1;
    metricsHourlySnapshot.hourlySwapCount += 1;
  }

  // Number of days since Unix epoch
  const day = (block.header.time.seconds as i32) / constants.SECONDS_PER_DAY;
  const hour = (block.header.time.seconds as i32) / constants.SECONDS_PER_HOUR;

  const dayId = day.toString();
  const hourId = hour.toString();

  // Combine the id and the user address to generate a unique user id for the day
  const dailyActiveAccountId = from.concat("-").concat(dayId);
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    metricsDailySnapshot.dailyActiveUsers += 1;
    dailyActiveAccount.save();
  }

  const hourlyActiveAccountId = from.concat("-").concat(hourId);
  let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountId);
  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountId);
    metricsHourlySnapshot.hourlyActiveUsers += 1;
    hourlyActiveAccount.save();
  }

  let account = Account.load(from);
  if (!account) {
    account = new Account(from);
    protocol.cumulativeUniqueUsers += 1;
    account.save();
  }
  metricsDailySnapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  metricsHourlySnapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  metricsDailySnapshot.save();
  metricsHourlySnapshot.save();
  protocol.save();
}
