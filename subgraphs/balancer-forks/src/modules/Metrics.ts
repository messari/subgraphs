import { BigInt, Address, ethereum, BigDecimal } from "@graphprotocol/graph-ts";
import {
  ActiveAccount,
  LiquidityPool as LiquidityPoolStore,
} from "../../generated/schema";
import {
  getOrCreateAccount,
  getOrCreateLiquidityPool,
  getOrCreateDexAmmProtocol,
  getOrCreateFinancialDailySnapshots,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
  getOrCreateLiquidityPoolDailySnapshots,
  getOrCreateLiquidityPoolHourlySnapshots,
} from "../common/initializers";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { updateRevenueSnapshots } from "./Revenue";

export function updateUsageMetrics(block: ethereum.Block, from: Address): void {
  getOrCreateAccount(from.toHexString());

  const protocol = getOrCreateDexAmmProtocol();
  const usageMetricsDaily = getOrCreateUsageMetricsDailySnapshot(block);
  const usageMetricsHourly = getOrCreateUsageMetricsHourlySnapshot(block);

  usageMetricsDaily.blockNumber = block.number;
  usageMetricsHourly.blockNumber = block.number;

  usageMetricsDaily.timestamp = block.timestamp;
  usageMetricsHourly.timestamp = block.timestamp;

  usageMetricsDaily.dailyTransactionCount += 1;
  usageMetricsHourly.hourlyTransactionCount += 1;

  usageMetricsDaily.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetricsHourly.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  const dailyActiveAccountId = (
    block.timestamp.toI64() / constants.SECONDS_PER_DAY
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
  poolAddress: Address,
  block: ethereum.Block
): void {
  const pool = LiquidityPoolStore.load(poolAddress.toHexString());
  if (!pool) return;

  const poolDailySnapshots = getOrCreateLiquidityPoolDailySnapshots(
    poolAddress.toHexString(),
    block
  );
  const poolHourlySnapshots = getOrCreateLiquidityPoolHourlySnapshots(
    poolAddress.toHexString(),
    block
  );

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

  poolDailySnapshots.blockNumber = block.number;
  poolHourlySnapshots.blockNumber = block.number;

  poolDailySnapshots.timestamp = block.timestamp;
  poolHourlySnapshots.timestamp = block.timestamp;

  poolHourlySnapshots.save();
  poolDailySnapshots.save();
}

export function updateFinancials(block: ethereum.Block): void {
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

  financialMetrics.blockNumber = block.number;
  financialMetrics.timestamp = block.timestamp;

  financialMetrics.save();
}

export function updateTokenVolumeAndBalance(
  poolAddress: Address,
  tokenAddress: string,
  tokenAmount: BigInt,
  tokenAmountUSD: BigDecimal,
  block: ethereum.Block
): void {
  const pool = getOrCreateLiquidityPool(poolAddress, block);

  const poolDailySnaphot = getOrCreateLiquidityPoolDailySnapshots(
    poolAddress.toHexString(),
    block
  );
  const poolHourlySnaphot = getOrCreateLiquidityPoolHourlySnapshots(
    poolAddress.toHexString(),
    block
  );

  const tokenIndex = pool.inputTokens.indexOf(tokenAddress);
  if (tokenIndex == -1) return;

  const dailyVolumeByTokenAmount = poolDailySnaphot.dailyVolumeByTokenAmount;
  dailyVolumeByTokenAmount[tokenIndex] =
    dailyVolumeByTokenAmount[tokenIndex].plus(tokenAmount);

  const hourlyVolumeByTokenAmount = poolHourlySnaphot.hourlyVolumeByTokenAmount;
  hourlyVolumeByTokenAmount[tokenIndex] =
    hourlyVolumeByTokenAmount[tokenIndex].plus(tokenAmount);

  const dailyVolumeByTokenUSD = poolDailySnaphot.dailyVolumeByTokenUSD;
  dailyVolumeByTokenUSD[tokenIndex] =
    dailyVolumeByTokenUSD[tokenIndex].plus(tokenAmountUSD);

  const hourlyVolumeByTokenUSD = poolHourlySnaphot.hourlyVolumeByTokenUSD;
  hourlyVolumeByTokenUSD[tokenIndex] =
    hourlyVolumeByTokenUSD[tokenIndex].plus(tokenAmountUSD);

  poolDailySnaphot.dailyVolumeByTokenAmount = dailyVolumeByTokenAmount;
  poolHourlySnaphot.hourlyVolumeByTokenAmount = hourlyVolumeByTokenAmount;

  poolDailySnaphot.dailyVolumeByTokenUSD = dailyVolumeByTokenUSD;
  poolHourlySnaphot.hourlyVolumeByTokenUSD = hourlyVolumeByTokenUSD;

  poolHourlySnaphot.save();
  poolDailySnaphot.save();
}

export function updateSnapshotsVolume(
  poolAddress: Address,
  volumeUSD: BigDecimal,
  block: ethereum.Block
): void {
  const protocol = getOrCreateDexAmmProtocol();
  const financialsDailySnapshot = getOrCreateFinancialDailySnapshots(block);
  const poolDailySnaphot = getOrCreateLiquidityPoolDailySnapshots(
    poolAddress.toHexString(),
    block
  );
  const poolHourlySnaphot = getOrCreateLiquidityPoolHourlySnapshots(
    poolAddress.toHexString(),
    block
  );

  financialsDailySnapshot.dailyVolumeUSD =
    financialsDailySnapshot.dailyVolumeUSD.plus(volumeUSD);
  poolDailySnaphot.dailyVolumeUSD =
    poolDailySnaphot.dailyVolumeUSD.plus(volumeUSD);
  poolHourlySnaphot.hourlyVolumeUSD =
    poolHourlySnaphot.hourlyVolumeUSD.plus(volumeUSD);

  if (!constants.BLACKLISTED_PHANTOM_POOLS.includes(poolAddress)) {
    protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(volumeUSD);
  }

  financialsDailySnapshot.save();
  poolHourlySnaphot.save();
  poolDailySnaphot.save();
  protocol.save();
}

export function updateProtocolRevenue(
  liquidityPoolAddress: Address,
  volumeUSD: BigDecimal,
  block: ethereum.Block
): void {
  const pool = getOrCreateLiquidityPool(liquidityPoolAddress, block);
  const poolFees = utils.getPoolFees(liquidityPoolAddress);

  const supplySideRevenueUSD = volumeUSD.times(
    poolFees.getTradingFees.minus(poolFees.getProtocolFees)
  );

  const protocolSideRevenueUSD = volumeUSD.times(poolFees.getProtocolFees);

  updateRevenueSnapshots(
    pool,
    supplySideRevenueUSD,
    protocolSideRevenueUSD,
    block
  );
}
