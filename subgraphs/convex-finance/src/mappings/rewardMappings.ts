import {
  getOrCreateVault,
  getOrCreateRewardPoolInfo,
} from "../common/initializers";
import * as utils from "../common/utils";
import { getTotalFees } from "../modules/Fees";
import { getUsdPricePerToken } from "../Prices";
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

  let crvRewardTokenAddress = constants.CRV_TOKEN_ADDRESS;
  let crvRewardTokenPrice = getUsdPricePerToken(crvRewardTokenAddress);
  let crvRewardTokenDecimals = utils.getTokenDecimals(crvRewardTokenAddress);

  const vault = getOrCreateVault(poolId, event.block);
  if (!vault) return;

  const rewardPoolInfo = getOrCreateRewardPoolInfo(
    poolId,
    crvRewardPoolAddress,
    event.block
  );

  let beforeHistoricalRewards = rewardPoolInfo.historicalRewards;
  let afterHistoricalRewards = getHistoricalRewards(crvRewardPoolAddress);

  let rewardsEarned = afterHistoricalRewards
    .minus(beforeHistoricalRewards)
    .toBigDecimal();

  let totalFeesConvex = getTotalFees();
  let totalRewardsEarned = rewardsEarned.div(
    constants.BIGDECIMAL_ONE.minus(totalFeesConvex.totalFees())
  );

  let lockFee = totalRewardsEarned.times(totalFeesConvex.lockIncentive); // incentive to crv stakers
  let callFee = totalRewardsEarned.times(totalFeesConvex.callIncentive); // incentive to users who spend gas to make calls
  let stakerFee = totalRewardsEarned.times(totalFeesConvex.stakerIncentive); // incentive to native token stakers
  let platformFee = totalRewardsEarned.times(totalFeesConvex.platformFee); // possible fee to build treasury

  let supplySideRevenue = rewardsEarned
    .plus(lockFee)
    .div(crvRewardTokenDecimals);
  const supplySideRevenueUSD = supplySideRevenue
    .times(crvRewardTokenPrice.usdPrice)
    .div(crvRewardTokenPrice.decimalsBaseTen);

  let protocolSideRevenue = stakerFee
    .plus(callFee)
    .plus(platformFee)
    .div(crvRewardTokenDecimals);
  const protocolSideRevenueUSD = protocolSideRevenue
    .times(crvRewardTokenPrice.usdPrice)
    .div(crvRewardTokenPrice.decimalsBaseTen);

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
    "crvRewardPool: {}, totalRewardsEarned: {}, crvRewardsEarned: {}, supplySideRevenue: {}, supplySideRevenueUSD: {}, protocolSideRevenue: {}, protocolSideRevenueUSD: {}, TxHash: {}",
    [
      crvRewardPoolAddress.toHexString(),
      totalRewardsEarned.toString(),
      rewardsEarned.toString(),
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
