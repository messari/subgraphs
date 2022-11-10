import { BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { TranchedPoolToken, _PoolToken } from "../../generated/schema";
import {
  BackerRewardsSetTotalRewards,
  BackerRewardsSetMaxInterestDollarsEligible,
  BackerRewardsClaimed,
  BackerRewardsClaimed1,
} from "../../generated/BackerRewards/BackerRewards";

import { updateBackerRewardsData } from "../entities/backer_rewards";
import { calculateApyFromGfiForAllPools } from "../entities/tranched_pool";
import { getOrCreateMarket, getRewardPrice } from "../common/getters";
import { bigDecimalToBigInt } from "../common/utils";
import {
  BIGINT_ZERO,
  GFI_DECIMALS,
  SECONDS_PER_DAY,
} from "../common/constants";

export function handleSetTotalRewards(
  event: BackerRewardsSetTotalRewards
): void {
  updateBackerRewardsData(event.address);
  // It's a little odd to see this calculation initiated here, but it's in order to ensure that rewards are calculated if the backer contract is deployed after some pools
  calculateApyFromGfiForAllPools();
}

export function handleSetMaxInterestDollarsEligible(
  event: BackerRewardsSetMaxInterestDollarsEligible
): void {
  updateBackerRewardsData(event.address);
  // It's a little odd to see this calculation initiated here, but it's in order to ensure that rewards are calculated if the backer contract is deployed after some pools
  calculateApyFromGfiForAllPools();
}

export function handleBackerRewardsClaimed(event: BackerRewardsClaimed): void {
  const tokenId = event.params.tokenId.toString();
  const amount = event.params.amount;
  _handleBackRewardEmission(tokenId, amount, event);

  //
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
  _handleBackRewardEmission(tokenId, amount, event);

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

function _handleBackRewardEmission(
  tokenId: string,
  amount: BigInt,
  event: ethereum.Event
): void {
  const ERC721Token = _PoolToken.load(tokenId);
  log.info("[handleBackerRewardsClaimed]tokenId={}", [tokenId]);
  if (!ERC721Token) {
    log.error("[handleBackerRewardsClaimed]tokenId={} not in _PoolToken", [
      tokenId,
    ]);
    return;
  }
  const marketId = ERC721Token.market;
  const market = getOrCreateMarket(marketId, event);
  market._cumulativeRewardAmount = market._cumulativeRewardAmount!.plus(amount);
  const currTimestamp = event.block.timestamp;
  if (!market._rewardTimestamp) {
    log.info(
      "[handleBackerRewardsClaimed]_rewardTimestamp for tranched pool {} not set, skip updating reward emission, current timestamp={}",
      [marketId, currTimestamp.toString()]
    );
    market._rewardTimestamp = currTimestamp;
    market.save();
    return;
  }

  // update reward emission every day or longer
  if (
    currTimestamp.lt(
      market._rewardTimestamp!.plus(BigInt.fromI32(SECONDS_PER_DAY))
    )
  ) {
    log.info(
      "[handleBackerRewardsClaimed]Backer reward emission updated less than 1 day ago (rewardTimestamp={}, current timestamp={}), skip updating backer reward emission",
      [market._rewardTimestamp!.toString(), currTimestamp.toString()]
    );
    market.save();
    return;
  }

  const secondsSince = event.block.timestamp
    .minus(market._rewardTimestamp!)
    .toBigDecimal();
  const dailyScaler = BigInt.fromI32(SECONDS_PER_DAY).divDecimal(secondsSince);
  const rewardTokenEmissionsAmount = bigDecimalToBigInt(
    market._cumulativeRewardAmount!.toBigDecimal().times(dailyScaler)
  );
  // Note rewards are recorded when they are claimed
  const GFIpriceUSD = getRewardPrice(event);
  const rewardTokenEmissionsUSD = rewardTokenEmissionsAmount
    .divDecimal(GFI_DECIMALS)
    .times(GFIpriceUSD);
  market.rewardTokenEmissionsAmount = [rewardTokenEmissionsAmount];
  market.rewardTokenEmissionsUSD = [rewardTokenEmissionsUSD];

  //reset _cumulativeRewardAmount and _rewardTimestamp for next update
  market._rewardTimestamp = currTimestamp;
  market._cumulativeRewardAmount = BIGINT_ZERO;
  market.save();
}
