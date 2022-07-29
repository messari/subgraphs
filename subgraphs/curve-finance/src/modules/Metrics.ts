import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
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
  getOrCreateLiquidityPoolFee,
} from "../common/initializers";
import { enumToPrefix } from "../common/utils";
import * as constants from "../common/constants";
import { updateRevenueSnapshots } from "./Revenue";

export function updateUsageMetrics(block: ethereum.Block, from: Address): void {
  const account = getOrCreateAccount(from.toHexString());

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

  let dailyActiveAccountId = (
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
  let pool = LiquidityPoolStore.load(poolAddress.toHexString());
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

export function updateTokenVolume(
  poolAddress: Address,
  tokenAddress: string,
  tokenAmount: BigInt,
  tokenAmountUSD: BigDecimal,
  block: ethereum.Block,
  underlying: boolean
): void {
  if (underlying) return;

  const pool = getOrCreateLiquidityPool(poolAddress, block);

  let poolDailySnaphot = getOrCreateLiquidityPoolDailySnapshots(
    poolAddress.toHexString(),
    block
  );
  let poolHourlySnaphot = getOrCreateLiquidityPoolHourlySnapshots(
    poolAddress.toHexString(),
    block
  );

  let tokenIndex = pool.inputTokens.indexOf(tokenAddress);
  if (tokenIndex == -1 && !underlying) {
    log.warning("", []);

    return;
  }

  poolDailySnaphot.dailyVolumeByTokenAmount[
    tokenIndex
  ] = poolDailySnaphot.dailyVolumeByTokenAmount[tokenIndex].plus(tokenAmount);
  poolHourlySnaphot.hourlyVolumeByTokenAmount[
    tokenIndex
  ] = poolHourlySnaphot.hourlyVolumeByTokenAmount[tokenIndex].plus(tokenAmount);

  poolDailySnaphot.dailyVolumeByTokenUSD[
    tokenIndex
  ] = poolDailySnaphot.dailyVolumeByTokenUSD[tokenIndex].plus(tokenAmountUSD);
  poolHourlySnaphot.hourlyVolumeByTokenUSD[
    tokenIndex
  ] = poolHourlySnaphot.hourlyVolumeByTokenUSD[tokenIndex].plus(tokenAmountUSD);

  poolHourlySnaphot.save();
  poolDailySnaphot.save();
}

export function updateSnapshotsVolume(
  poolAddress: Address,
  volumeUSD: BigDecimal,
  block: ethereum.Block
): void {
  let protcol = getOrCreateDexAmmProtocol();
  let financialsDailySnapshot = getOrCreateFinancialDailySnapshots(block);
  let poolDailySnaphot = getOrCreateLiquidityPoolDailySnapshots(
    poolAddress.toHexString(),
    block
  );
  let poolHourlySnaphot = getOrCreateLiquidityPoolHourlySnapshots(
    poolAddress.toHexString(),
    block
  );

  financialsDailySnapshot.dailyVolumeUSD = financialsDailySnapshot.dailyVolumeUSD.plus(
    volumeUSD
  );
  poolDailySnaphot.dailyVolumeUSD = poolDailySnaphot.dailyVolumeUSD.plus(
    volumeUSD
  );
  poolHourlySnaphot.hourlyVolumeUSD = poolHourlySnaphot.hourlyVolumeUSD.plus(
    volumeUSD
  );
  protcol.cumulativeVolumeUSD = protcol.cumulativeVolumeUSD.plus(volumeUSD);

  financialsDailySnapshot.save();
  poolHourlySnaphot.save();
  poolDailySnaphot.save();
  protcol.save();
}

export function updateProtocolRevenue(
  liquidityPoolAddress: Address,
  volumeUSD: BigDecimal,
  block: ethereum.Block
): void {
  const pool = getOrCreateLiquidityPool(liquidityPoolAddress, block);

  let lpFeeId =
    enumToPrefix(constants.LiquidityPoolFeeType.FIXED_LP_FEE) +
    liquidityPoolAddress.toHexString();
  const lpFee = getOrCreateLiquidityPoolFee(
    lpFeeId,
    constants.LiquidityPoolFeeType.FIXED_LP_FEE
  );

  let protocolFeeId =
    enumToPrefix(constants.LiquidityPoolFeeType.FIXED_PROTOCOL_FEE) +
    liquidityPoolAddress.toHexString();
  const protocolFee = getOrCreateLiquidityPoolFee(
    protocolFeeId,
    constants.LiquidityPoolFeeType.FIXED_PROTOCOL_FEE
  );

  let supplySideRevenueUSD = lpFee
    .feePercentage!.times(volumeUSD)
    .div(constants.BIGDECIMAL_HUNDRED);
  let protocolSideRevenueUSD = protocolFee
    .feePercentage!.times(volumeUSD)
    .div(constants.BIGDECIMAL_HUNDRED);

  updateRevenueSnapshots(
    pool,
    supplySideRevenueUSD,
    protocolSideRevenueUSD,
    block
  );
}
