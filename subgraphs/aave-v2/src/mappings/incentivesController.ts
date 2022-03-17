import { Address, BigInt, BigDecimal } from "@graphprotocol/graph-ts";

import {
  RewardsClaimed,
  AaveIncentivesController as IncentivesControllerContract
} from "../../generated/templates/IncentivesController/AaveIncentivesController";

import { Market, MarketDailySnapshot, RewardToken } from "../../generated/schema";

import {
  initRewardToken,
  loadMarketDailySnapshot,
  zeroAddr,
  loadMarket
} from "./utilFunctions";

export function handleRewardsClaimed(event: RewardsClaimed): void {
  // Handle event emitted when reward tokens are claimed

  // event.address is the incentiveController address
  const incentiveContAddr = event.address;
  if (incentiveContAddr.toHexString() != zeroAddr) {
    // Instantiate IncentivesController to get access to contract read methods
    const contract = IncentivesControllerContract.bind(incentiveContAddr);
    // Get the contract Reward Token's address
    const rewardTokenAddr = contract.REWARD_TOKEN().toHexString();
    // Need to revise market creation/loading functions, need to gather all proper arguments to create market if doesnt exist
    let market = loadMarket() as Market;

    // If the initRewardToken() call creates a new RewardToken implementation, the Market implementation adds the reward token to its array
    // Therefore the market needs to be pulled again to account for the updated RewardToken field 
    initRewardToken(Address.fromHexString(rewardTokenAddr), market);
    market = loadMarket() as Market;
    // Load/Create the daily market snapshot entity instance
    const marketDailySnapshot = loadMarketDailySnapshot(event, market) as MarketDailySnapshot;
    if (market.rewardTokens) {
      if (!marketDailySnapshot.rewardTokenEmissionsAmount || marketDailySnapshot.rewardTokenEmissionsAmount.length < market.rewardTokens.length) {
        // If the current day's snapshot "rewardTokenEmissionsAmount" has not been initialized or is the incorrect length
        const rewardEmissionsAmounts: BigDecimal[] = [];
        market.rewardTokens.forEach(() => {
          // For each reward token, create a zero value to initialize the amount of reward emissions for that day
          rewardEmissionsAmounts.push(new BigDecimal(new BigInt(0)));
        });
        marketDailySnapshot.rewardTokenEmissionsAmount = rewardEmissionsAmounts;
      }
      for (let i = 0; i < market.rewardTokens.length; i++) {
        // Loop through the reward tokens on the market entity instance to compare the addresses to the reward token address
        const token = market.rewardTokens[i];
        if (rewardTokenAddr === token) {
          // If the current token iteration is the reward token address which is to be updated-
          // Add the rewardTokenEmissionsAmount of that index by the amount of reward tokens claimed
          marketDailySnapshot.rewardTokenEmissionsAmount[i].plus(new BigDecimal(event.params.amount));
        }
      }
    }
    marketDailySnapshot.save();
  }
}
