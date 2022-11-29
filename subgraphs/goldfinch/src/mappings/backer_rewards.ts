import {BigInt} from "@graphprotocol/graph-ts"
import {TranchedPoolToken} from "../../generated/schema"
import {
  BackerRewardsSetTotalRewards,
  BackerRewardsSetMaxInterestDollarsEligible,
  BackerRewardsClaimed,
  BackerRewardsClaimed1,
} from "../../generated/BackerRewards/BackerRewards"

import {updateBackerRewardsData} from "../entities/backer_rewards"
import {calculateApyFromGfiForAllPools} from "../entities/tranched_pool"

export function handleSetTotalRewards(event: BackerRewardsSetTotalRewards): void {
  updateBackerRewardsData(event.address)
  // It's a little odd to see this calculation initiated here, but it's in order to ensure that rewards are calculated if the backer contract is deployed after some pools
  calculateApyFromGfiForAllPools(event.block.timestamp)
}

export function handleSetMaxInterestDollarsEligible(event: BackerRewardsSetMaxInterestDollarsEligible): void {
  updateBackerRewardsData(event.address)
  // It's a little odd to see this calculation initiated here, but it's in order to ensure that rewards are calculated if the backer contract is deployed after some pools
  calculateApyFromGfiForAllPools(event.block.timestamp)
}

export function handleBackerRewardsClaimed(event: BackerRewardsClaimed): void {
  const poolToken = assert(TranchedPoolToken.load(event.params.tokenId.toString()))
  poolToken.rewardsClaimed = event.params.amount
  poolToken.rewardsClaimable = BigInt.zero()
  poolToken.save()
}

export function handleBackerRewardsClaimed1(event: BackerRewardsClaimed1): void {
  const poolToken = assert(TranchedPoolToken.load(event.params.tokenId.toString()))
  poolToken.rewardsClaimed = event.params.amountOfTranchedPoolRewards
  poolToken.stakingRewardsClaimed = event.params.amountOfSeniorPoolRewards
  poolToken.rewardsClaimable = BigInt.zero()
  poolToken.stakingRewardsClaimable = BigInt.zero()
  poolToken.save()
}
