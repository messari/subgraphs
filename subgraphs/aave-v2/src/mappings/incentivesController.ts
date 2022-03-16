import { Address, BigInt, BigDecimal } from "@graphprotocol/graph-ts";

import {
  RewardsClaimed,
  AaveIncentivesController as IncentivesControllerContract
} from "../../generated/templates/IncentivesController/AaveIncentivesController";

import { Market, RewardToken } from "../../generated/schema";

import { initRewardToken, updateMarketDailySnapshot, zeroAddr, getLendingPoolFromCtx, createMarket, metricsDailySnapshot, updateMetricsDailySnapshot } from "./utilFunctions";

export function handleRewardsClaimed(event: RewardsClaimed): void {
  // Handle event emitted when reward tokens are claimed

  // event.address is the incentiveController address
  const incentiveContAddr = event.address;
  if (incentiveContAddr.toHexString() != zeroAddr) {
    // Instantiate IncentivesController to get access to contract read methods
    const contract = IncentivesControllerContract.bind(incentiveContAddr);
    // Get the contract Reward Token's address
    const rewardTokenAddr = contract.REWARD_TOKEN().toHexString();
    // Load the reward token entity instance
    const rewardToken = RewardToken.load(rewardTokenAddr);
    const marketAddr = getLendingPoolFromCtx();
    // Need to revise market creation/loading functions, need to gather all proper arguments to create market if doesnt exist
    const market = Market.load(marketAddr);

    // In the case of multiple rewards tokens, get the index of the current reward token address
    let rewardTokenIndex = market.rewardTokens?.length || 0;
    if (market.rewardTokens.indexOf(rewardTokenAddr) >= 0) {
      rewardTokenIndex = market.rewardTokens.indexOf(rewardTokenAddr);
    } else {
      // If the reward token has not been added to market or as a RewardToken entity
      // In initRewardToken(), the reward token entity will be instantiated (if not yet instantiated)
      // Also, the reward token will be added to the mMarket instance rewardToken array
      // The reward token will have an index equal to the length of market.rewardTokens before the current reward token was pushed to the list
      initRewardToken(Address.fromHexString(rewardTokenAddr), market);
    }

    // Update the current market daily snapshot to add to the daily reward token emissions
    let marketDailySnapshot = updateMarketDailySnapshot(event, market);
    // THIS SECTION NEEDS TO BE REWRITTEN.
    // Initialize the length of array of reward tokens for each index to contain a zero value? 
    // Some days the reward tokens may be claimed in a different order than they are in the rewardTokens Array 
    if (marketDailySnapshot.rewardTokenEmissionsAmount[rewardTokenIndex]) {
      marketDailySnapshot.rewardTokenEmissionsAmount[rewardTokenIndex].plus(new BigDecimal(event.params.amount));
    } else {
      marketDailySnapshot.rewardTokenEmissionsAmount = [new BigDecimal(event.params.amount)];
    }
    marketDailySnapshot.save();
  }
}
