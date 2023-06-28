import { BigInt } from "@graphprotocol/graph-ts";
import { PoolToken } from "../../generated/schema";
import {
  BackerRewardsSetTotalRewards,
  BackerRewardsSetMaxInterestDollarsEligible,
  BackerRewardsClaimed,
  BackerRewardsClaimed1,
} from "../../generated/BackerRewards/BackerRewards";

import {
  updateBackerRewardsData,
  updateMarketRewardTokenEmissions,
} from "../entities/backer_rewards";
import { calculateApyFromGfiForAllPools } from "../entities/tranched_pool";
import { createTransactionFromEvent } from "../entities/helpers";

export function handleSetTotalRewards(
  event: BackerRewardsSetTotalRewards
): void {
  updateBackerRewardsData(event.address);
  // It's a little odd to see this calculation initiated here, but it's in order to ensure that rewards are calculated if the backer contract is deployed after some pools
  calculateApyFromGfiForAllPools();

  // messari schema
  updateMarketRewardTokenEmissions(event);
}

export function handleSetMaxInterestDollarsEligible(
  event: BackerRewardsSetMaxInterestDollarsEligible
): void {
  updateBackerRewardsData(event.address);
  // It's a little odd to see this calculation initiated here, but it's in order to ensure that rewards are calculated if the backer contract is deployed after some pools
  calculateApyFromGfiForAllPools();

  // messari schema
  updateMarketRewardTokenEmissions(event);
}

export function handleBackerRewardsClaimed(event: BackerRewardsClaimed): void {
  const poolToken = assert(PoolToken.load(event.params.tokenId.toString()));
  poolToken.rewardsClaimed = event.params.amount;
  poolToken.rewardsClaimable = BigInt.zero();
  poolToken.save();

  const transaction = createTransactionFromEvent(
    event,
    "BACKER_REWARDS_CLAIMED",
    event.params.owner
  );
  transaction.receivedAmount = event.params.amount;
  transaction.receivedToken = "GFI";
  transaction.loan = poolToken.loan;
  transaction.save();
}

export function handleBackerRewardsClaimed1(
  event: BackerRewardsClaimed1
): void {
  const poolToken = assert(PoolToken.load(event.params.tokenId.toString()));
  poolToken.rewardsClaimed = event.params.amountOfTranchedPoolRewards;
  poolToken.stakingRewardsClaimed = event.params.amountOfSeniorPoolRewards;
  poolToken.rewardsClaimable = BigInt.zero();
  poolToken.stakingRewardsClaimable = BigInt.zero();
  poolToken.save();
}
