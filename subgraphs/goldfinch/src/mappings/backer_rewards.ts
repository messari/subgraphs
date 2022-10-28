import { BigInt } from "@graphprotocol/graph-ts";
import { TranchedPoolToken } from "../../generated/schema";
import {
  BackerRewardsSetTotalRewards,
  BackerRewardsSetMaxInterestDollarsEligible,
  BackerRewardsClaimed,
  BackerRewardsClaimed1,
} from "../../generated/BackerRewards/BackerRewards";

import { updateBackerRewardsData } from "../entities/backer_rewards";
import { calculateApyFromGfiForAllPools } from "../entities/tranched_pool";
import { getOrCreateMarket, getOrCreatePoolToken } from "../common/getters";
import { bigDecimalToBigInt } from "../common/utils";
import { SECONDS_PER_DAY } from "../common/constants";

export function handleSetTotalRewards(
  event: BackerRewardsSetTotalRewards
): void {
  updateBackerRewardsData(event.address);
  // It's a little odd to see this calculation initiated here, but it's in order to ensure that rewards are calculated if the backer contract is deployed after some pools
  calculateApyFromGfiForAllPools(event.block.timestamp);
}

export function handleSetMaxInterestDollarsEligible(
  event: BackerRewardsSetMaxInterestDollarsEligible
): void {
  updateBackerRewardsData(event.address);
  // It's a little odd to see this calculation initiated here, but it's in order to ensure that rewards are calculated if the backer contract is deployed after some pools
  calculateApyFromGfiForAllPools(event.block.timestamp);
}

export function handleBackerRewardsClaimed(event: BackerRewardsClaimed): void {
  const poolToken = assert(
    TranchedPoolToken.load(event.params.tokenId.toString())
  );
  poolToken.rewardsClaimed = event.params.amount;
  poolToken.rewardsClaimable = BigInt.zero();
  poolToken.save();
}

export function handleBackerRewardsClaimed1(
  event: BackerRewardsClaimed1
): void {
  const tokenId = event.params.tokenId.toString();
  const amount = event.params.amountOfTranchedPoolRewards.plus(
    event.params.amountOfSeniorPoolRewards
  );
  const ERC721Token = getOrCreatePoolToken(tokenId);
  const marketId = ERC721Token.market;
  const market = getOrCreateMarket(marketId, event);
  market._cumulativeRewardAmount = market._cumulativeRewardAmount!.plus(amount);
  const secondsSince = event.block.timestamp
    .minus(market._rewardTimestamp!)
    .toBigDecimal();
  const dailyScaler = BigInt.fromI32(SECONDS_PER_DAY).divDecimal(secondsSince);
  market.rewardTokenEmissionsAmount = [
    bigDecimalToBigInt(
      market._cumulativeRewardAmount!.toBigDecimal().times(dailyScaler)
    ),
  ];
  // Note rewards are recorded when they are claimed
  // since there is no oracle, cannot update
  // market.rewardTokenEmissionsAmountUSD
  market.save();

  //
  const poolToken = assert(
    TranchedPoolToken.load(event.params.tokenId.toString())
  );
  poolToken.rewardsClaimed = event.params.amountOfTranchedPoolRewards;
  poolToken.stakingRewardsClaimed = event.params.amountOfSeniorPoolRewards;
  poolToken.rewardsClaimable = BigInt.zero();
  poolToken.stakingRewardsClaimable = BigInt.zero();
  poolToken.save();
}
