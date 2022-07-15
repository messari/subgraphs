import {
  updateRewardToken,
  updateRewardTokenEmissions,
} from "../modules/Rewards";
import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../prices";
import * as constants from "../common/constants";
import { Address } from "@graphprotocol/graph-ts";
import {
  RewardPaid as RewardPaidEvent,
  RewardAdded as RewardAddedEvent,
  RewardTokenAdded as RewardTokenAddedEvent,
} from "../../generated/templates/PoolRewards/PoolRewards";
import { getOrCreateVault } from "../common/initializers";
import { updateRevenueSnapshots } from "../modules/Revenue";
import { updateFinancials, updateUsageMetrics } from "../modules/Metrics";
import { PoolRewards as PoolRewardsContract } from "../../generated/templates/PoolRewards/PoolRewards";

export function handleRewardAdded(event: RewardAddedEvent): void {
  const rewardAmount = event.params.reward;
  const rewardToken = event.params.rewardToken;

  const poolRewardsAddress = event.address;
  const poolRewardsContract = PoolRewardsContract.bind(poolRewardsAddress);

  const vaultAddress = utils.readValue<Address>(
    poolRewardsContract.try_pool(),
    constants.NULL.TYPE_ADDRESS
  );
  const vault = getOrCreateVault(vaultAddress, event.block);

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
  updateRewardToken(vaultAddress, poolRewardsAddress, event.block);
}

export function handleRewardPaid(event: RewardPaidEvent): void {
  const poolRewardsAddress = event.address;
  const poolRewardsContract = PoolRewardsContract.bind(poolRewardsAddress);

  const vaultAddress = utils.readValue<Address>(
    poolRewardsContract.try_pool(),
    constants.NULL.TYPE_ADDRESS
  );

  updateFinancials(event.block);
  updateUsageMetrics(event.block, event.transaction.from);
  updateRewardToken(vaultAddress, poolRewardsAddress, event.block);
}

export function handleRewardTokenAdded(event: RewardTokenAddedEvent): void {
  const newRewardsAddress = event.params.rewardToken;

  const poolRewardsAddress = event.address;
  const poolRewardsContract = PoolRewardsContract.bind(poolRewardsAddress);

  const vaultAddress = utils.readValue<Address>(
    poolRewardsContract.try_pool(),
    constants.NULL.TYPE_ADDRESS
  );

  updateRewardTokenEmissions(
    newRewardsAddress,
    vaultAddress,
    constants.BIGINT_ZERO,
    event.block
  );
}
