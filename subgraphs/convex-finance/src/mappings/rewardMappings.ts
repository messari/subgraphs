import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../Prices";
import * as constants from "../common/constants";
import { updateRewardToken } from "../modules/Rewards";
import { getOrCreateVault } from "../common/initializers";
import { updateRevenueSnapshots } from "../modules/Revenue";
import {
  RewardPaid,
  RewardAdded,
} from "../../generated/templates/PoolCrvRewards/BaseRewardPool";
import { Address, BigInt, dataSource } from "@graphprotocol/graph-ts";
import { updateFinancials, updateUsageMetrics } from "../modules/Metric";
import { BaseRewardPool as BaseRewardPoolContract } from "../../generated/Booster/BaseRewardPool";

export function handleRewardAdded(event: RewardAdded): void {
  const context = dataSource.context();
  const poolId = BigInt.fromString(context.getString("poolId"));

  const rewardAmount = event.params.reward;
  const poolRewardsAddress = event.address;

  const vault = getOrCreateVault(poolId, event.block);
  if (!vault) return;

  const rewardsContract = BaseRewardPoolContract.bind(poolRewardsAddress);
  const rewardToken = utils.readValue<Address>(
    rewardsContract.try_rewardToken(),
    constants.NULL.TYPE_ADDRESS
  );
  let rewardTokenPrice = getUsdPricePerToken(rewardToken);
  let rewardTokenDecimals = utils.getTokenDecimals(rewardToken);

  const supplySideRevenueUSD = rewardAmount
    .toBigDecimal()
    .div(rewardTokenDecimals)
    .times(rewardTokenPrice.usdPrice)
    .div(rewardTokenPrice.decimalsBaseTen);

  updateRevenueSnapshots(
    vault,
    supplySideRevenueUSD,
    constants.BIGDECIMAL_ZERO,
    event.block
  );
  updateRewardToken(poolId, poolRewardsAddress, event.block);
}

export function handleRewardPaid(event: RewardPaid): void {
  const context = dataSource.context();
  const poolId = BigInt.fromString(context.getString("poolId"));

  const poolRewardsAddress = event.address;

  updateFinancials(event.block);
  updateUsageMetrics(event.block, event.transaction.from);
  updateRewardToken(poolId, poolRewardsAddress, event.block);
}
