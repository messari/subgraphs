import {
  getOrCreateVault,
  getOrCreateRewardPoolInfo,
} from "../common/initializers";
import * as utils from "../common/utils";
import { getTotalFees } from "../modules/Fees";
import { getUsdPricePerToken } from "../prices";
import * as constants from "../common/constants";
import { updateRevenueSnapshots } from "../modules/Revenue";
import {
  RewardPaid,
  RewardAdded,
} from "../../generated/templates/PoolCrvRewards/BaseRewardPool";
import { BigInt, dataSource, log } from "@graphprotocol/graph-ts";
import { updateFinancials, updateUsageMetrics } from "../modules/Metric";
import { getHistoricalRewards, updateRewardToken } from "../modules/Rewards";

export function handleRewardAdded(event: RewardAdded): void {
  const context = dataSource.context();
  const poolId = BigInt.fromString(context.getString("poolId"));

  const crvRewardPoolAddress = event.address;

  const crvRewardTokenAddress = constants.CRV_TOKEN_ADDRESS;
  const crvRewardTokenPrice = getUsdPricePerToken(
    crvRewardTokenAddress,
    event.block
  );
  const crvRewardTokenDecimals = utils.getTokenDecimals(crvRewardTokenAddress);

  const vault = getOrCreateVault(poolId, event.block);
  if (!vault) return;

  const rewardPoolInfo = getOrCreateRewardPoolInfo(
    poolId,
    crvRewardPoolAddress,
    event.block
  );

  const beforeHistoricalRewards = rewardPoolInfo.historicalRewards;
  const afterHistoricalRewards = getHistoricalRewards(crvRewardPoolAddress);

  const rewardsEarned = afterHistoricalRewards.minus(beforeHistoricalRewards);

  const cvxRewardTokenAddress = constants.CONVEX_TOKEN_ADDRESS;
  const cvxRewardTokenPrice = getUsdPricePerToken(
    cvxRewardTokenAddress,
    event.block
  );
  const cvxRewardTokenDecimals = utils.getTokenDecimals(cvxRewardTokenAddress);

  const cvxRewardsEarned = utils.getConvexTokenMintAmount(rewardsEarned);
  const cvxRewardEarnedUsd = cvxRewardsEarned
    .div(cvxRewardTokenDecimals)
    .times(cvxRewardTokenPrice.usdPrice)
    .truncate(1);

  const totalFeesConvex = getTotalFees();
  const totalRewardsEarned = rewardsEarned
    .toBigDecimal()
    .div(constants.BIGDECIMAL_ONE.minus(totalFeesConvex.totalFees()))
    .truncate(0);

  const lockFee = totalRewardsEarned.times(totalFeesConvex.lockIncentive); // incentive to crv stakers
  const callFee = totalRewardsEarned.times(totalFeesConvex.callIncentive); // incentive to users who spend gas to make calls
  const stakerFee = totalRewardsEarned.times(totalFeesConvex.stakerIncentive); // incentive to native token stakers
  const platformFee = totalRewardsEarned.times(totalFeesConvex.platformFee); // possible fee to build treasury

  const supplySideRevenue = rewardsEarned
    .toBigDecimal()
    .plus(lockFee)
    .div(crvRewardTokenDecimals)
    .truncate(0);
  const supplySideRevenueUSD = supplySideRevenue
    .times(crvRewardTokenPrice.usdPrice)
    .plus(cvxRewardEarnedUsd)
    .truncate(1);

  const protocolSideRevenue = stakerFee
    .plus(callFee)
    .plus(platformFee)
    .div(crvRewardTokenDecimals)
    .truncate(0);
  const protocolSideRevenueUSD = protocolSideRevenue
    .times(crvRewardTokenPrice.usdPrice)
    .truncate(1);

  rewardPoolInfo.historicalRewards = afterHistoricalRewards;
  rewardPoolInfo.lastRewardTimestamp = event.block.timestamp;
  rewardPoolInfo.save();

  updateRevenueSnapshots(
    vault,
    supplySideRevenueUSD,
    protocolSideRevenueUSD,
    event.block
  );
  updateRewardToken(poolId, crvRewardPoolAddress, event.block);

  log.warning(
    "[RewardAdded] Pool: {}, totalRewardsEarned: {}, crvRewardsEarned: {}, cvxRewardsEarned: {}, \
    cvxRewardsEarnedUSD: {}, supplySideRevenue: {}, supplySideRevenueUSD: {}, protocolSideRevenue: {}, \
    protocolSideRevenueUSD: {}, TxHash: {}",
    [
      crvRewardPoolAddress.toHexString(),
      totalRewardsEarned.toString(),
      rewardsEarned.toString(),
      cvxRewardsEarned.toString(),
      cvxRewardEarnedUsd.toString(),
      supplySideRevenue.toString(),
      supplySideRevenueUSD.toString(),
      protocolSideRevenue.toString(),
      protocolSideRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleRewardPaid(event: RewardPaid): void {
  const context = dataSource.context();
  const poolId = BigInt.fromString(context.getString("poolId"));

  const poolRewardsAddress = event.address;

  updateFinancials(event.block);
  updateUsageMetrics(event.block, event.transaction.from);
  updateRewardToken(poolId, poolRewardsAddress, event.block);
}
