import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import { SeniorPoolStakedPosition } from "../../generated/schema";
import {
  RewardAdded,
  Staked,
  Staked1,
  Unstaked,
  Unstaked1,
  Transfer,
  DepositedAndStaked,
  DepositedAndStaked1,
  UnstakedAndWithdrew,
  UnstakedAndWithdrewMultiple,
  RewardPaid,
} from "../../generated/StakingRewards/StakingRewards";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  GFI_DECIMALS,
  SECONDS_PER_DAY,
  SENIOR_POOL_ADDRESS,
} from "../common/constants";
import { getOrCreateMarket, getRewardPrice } from "../common/getters";
import { bigDecimalToBigInt } from "../common/utils";

import { createTransactionFromEvent } from "../entities/helpers";
import { updateCurrentEarnRate } from "../entities/staking_rewards";

function mapStakedPositionTypeToAmountToken(stakedPositionType: i32): string {
  // NOTE: The return type of this function should be a SupportedCrypto enum value.

  if (stakedPositionType === 0) {
    return "FIDU";
  } else if (stakedPositionType === 1) {
    return "CURVE_LP";
  } else {
    throw new Error(`Unexpected staked position type: ${stakedPositionType}`);
  }
}

export function handleRewardAdded(event: RewardAdded): void {
  updateCurrentEarnRate(event.address);
}

export function handleStaked(event: Staked): void {
  updateCurrentEarnRate(event.address);

  const stakedPosition = new SeniorPoolStakedPosition(
    event.params.tokenId.toString()
  );
  stakedPosition.amount = event.params.amount;
  stakedPosition.initialAmount = event.params.amount;
  stakedPosition.user = event.params.user.toHexString();
  stakedPosition.startTime = event.block.timestamp;
  stakedPosition.positionType = "Fidu"; // Curve integration did not exist at this time
  stakedPosition.totalRewardsClaimed = BigInt.zero();

  stakedPosition.save();
}

export function handleStaked1(event: Staked1): void {
  updateCurrentEarnRate(event.address);

  const stakedPosition = new SeniorPoolStakedPosition(
    event.params.tokenId.toString()
  );
  stakedPosition.amount = event.params.amount;
  stakedPosition.initialAmount = event.params.amount;
  stakedPosition.user = event.params.user.toHexString();
  stakedPosition.startTime = event.block.timestamp;
  if (event.params.positionType == 0) {
    stakedPosition.positionType = "Fidu";
  } else if (event.params.positionType == 1) {
    stakedPosition.positionType = "CurveLP";
  } else {
    log.critical(
      "Encountered unrecognized positionType in a Staked event: {}",
      [event.params.positionType.toString()]
    );
  }
  stakedPosition.totalRewardsClaimed = BigInt.zero();

  stakedPosition.save();

  const amountToken = mapStakedPositionTypeToAmountToken(
    event.params.positionType
  );
  createTransactionFromEvent(
    event,
    "SENIOR_POOL_STAKE",
    event.params.user,
    event.params.amount,
    amountToken
  );
}

// Note that Unstaked and Unstaked1 refer to two different versions of this event with different signatures.
export function handleUnstaked(event: Unstaked): void {
  updateCurrentEarnRate(event.address);

  const stakedPosition = assert(
    SeniorPoolStakedPosition.load(event.params.tokenId.toString())
  );
  stakedPosition.amount = stakedPosition.amount.minus(event.params.amount);

  stakedPosition.save();

  const amountToken = mapStakedPositionTypeToAmountToken(
    // The historical/legacy Unstaked events that didn't have a `positionType` param were all of FIDU type.
    0
  );
  createTransactionFromEvent(
    event,
    "SENIOR_POOL_STAKE",
    event.params.user,
    event.params.amount,
    amountToken
  );
}

export function handleUnstaked1(event: Unstaked1): void {
  updateCurrentEarnRate(event.address);

  const stakedPosition = assert(
    SeniorPoolStakedPosition.load(event.params.tokenId.toString())
  );
  stakedPosition.amount = stakedPosition.amount.minus(event.params.amount);

  stakedPosition.save();

  const amountToken = mapStakedPositionTypeToAmountToken(
    event.params.positionType
  );
  createTransactionFromEvent(
    event,
    "SENIOR_POOL_STAKE",
    event.params.user,
    event.params.amount,
    amountToken
  );
}

export function handleTransfer(event: Transfer): void {
  if (
    event.params.from.notEqual(
      Bytes.fromHexString("0x0000000000000000000000000000000000000000")
    )
  ) {
    const stakedPosition = assert(
      SeniorPoolStakedPosition.load(event.params.tokenId.toString())
    );
    stakedPosition.user = event.params.to.toHexString();
    stakedPosition.save();
  }
}

export function handleDepositedAndStaked(event: DepositedAndStaked): void {
  createTransactionFromEvent(
    event,
    "SENIOR_POOL_STAKE",
    event.params.user,
    event.params.depositedAmount
  );
}

export function handleDepositedAndStaked1(event: DepositedAndStaked1): void {
  createTransactionFromEvent(
    event,
    "SENIOR_POOL_DEPOSIT_AND_STAKE",
    event.params.user,
    event.params.depositedAmount
  );
}

export function handleUnstakedAndWithdrew(event: UnstakedAndWithdrew): void {
  createTransactionFromEvent(
    event,
    "SENIOR_POOL_UNSTAKE_AND_WITHDRAWAL",
    event.params.user,
    event.params.usdcReceivedAmount
  );
}

export function handleUnstakedAndWithdrewMultiple(
  event: UnstakedAndWithdrewMultiple
): void {
  createTransactionFromEvent(
    event,
    "SENIOR_POOL_UNSTAKE_AND_WITHDRAWAL",
    event.params.user,
    event.params.usdcReceivedAmount
  );
}

export function handleRewardPaid(event: RewardPaid): void {
  // set RewardTokenEmission for senior pool
  // normalized to daily amount
  const seniorPool = getOrCreateMarket(SENIOR_POOL_ADDRESS, event);
  seniorPool._cumulativeRewardAmount = seniorPool._cumulativeRewardAmount!.plus(
    event.params.reward
  );
  const currTimestamp = event.block.timestamp;
  if (!seniorPool._rewardTimestamp) {
    log.info(
      "[handleRewardPaid]_rewardTimestamp for senior pool not set, skip updating reward emission, current timestamp={}",
      [currTimestamp.toString()]
    );
    seniorPool._rewardTimestamp = currTimestamp;
    seniorPool.save();
    return;
  }

  // update reward emission every day or longer
  if (
    currTimestamp.lt(
      seniorPool._rewardTimestamp!.plus(BigInt.fromI32(SECONDS_PER_DAY))
    )
  ) {
    log.info(
      "[handleRewardPaid]Reward emission updated less than 1 day ago (rewardTimestamp={}, current timestamp={}), skip updating reward emission",
      [seniorPool._rewardTimestamp!.toString(), currTimestamp.toString()]
    );
    seniorPool.save();
    return;
  }

  const secondsSince = currTimestamp
    .minus(seniorPool._rewardTimestamp!)
    .toBigDecimal();
  const dailyScaler = BigInt.fromI32(SECONDS_PER_DAY).divDecimal(secondsSince);
  const rewardTokenEmissionsAmount = bigDecimalToBigInt(
    seniorPool._cumulativeRewardAmount!.toBigDecimal().times(dailyScaler)
  );
  // Note rewards are recorded when they are claimed
  const GFIpriceUSD = getRewardPrice(event);
  const rewardTokenEmissionsUSD = rewardTokenEmissionsAmount
    .divDecimal(GFI_DECIMALS)
    .times(GFIpriceUSD);
  seniorPool.rewardTokenEmissionsAmount = [rewardTokenEmissionsAmount];
  seniorPool.rewardTokenEmissionsUSD = [rewardTokenEmissionsUSD];

  //reset _cumulativeRewardAmount and _rewardTimestamp for next update
  seniorPool._rewardTimestamp = currTimestamp;
  seniorPool._cumulativeRewardAmount = BIGINT_ZERO;
  seniorPool.save();

  //
  const position = assert(
    SeniorPoolStakedPosition.load(event.params.tokenId.toString())
  );
  position.totalRewardsClaimed = position.totalRewardsClaimed.plus(
    event.params.reward
  );
  position.save();
}
