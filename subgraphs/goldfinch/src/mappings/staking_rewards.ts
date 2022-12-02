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
import { getOrCreateMarket, getGFIPrice } from "../common/getters";
import { bigDecimalToBigInt } from "../common/utils";

import {
  createTransactionFromEvent,
  usdcWithFiduPrecision,
} from "../entities/helpers";
import { updateCurrentEarnRate } from "../entities/staking_rewards";
import { getOrInitUser } from "../entities/user";

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
  stakedPosition.user = getOrInitUser(event.params.user).id;
  stakedPosition.startTime = event.block.timestamp;
  stakedPosition.positionType = "Fidu"; // Curve integration did not exist at this time
  stakedPosition.totalRewardsClaimed = BigInt.zero();

  stakedPosition.save();

  const transaction = createTransactionFromEvent(
    event,
    "SENIOR_POOL_STAKE",
    event.params.user
  );
  transaction.sentAmount = event.params.amount;
  transaction.sentToken = "FIDU";
  transaction.receivedNftId = event.params.tokenId.toString();
  transaction.receivedNftType = "STAKING_TOKEN";
  transaction.save();
}

export function handleStaked1(event: Staked1): void {
  updateCurrentEarnRate(event.address);

  const stakedPosition = new SeniorPoolStakedPosition(
    event.params.tokenId.toString()
  );
  stakedPosition.amount = event.params.amount;
  stakedPosition.initialAmount = event.params.amount;
  stakedPosition.user = getOrInitUser(event.params.user).id;
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

  const transaction = createTransactionFromEvent(
    event,
    "SENIOR_POOL_STAKE",
    event.params.user
  );
  transaction.sentAmount = event.params.amount;
  transaction.sentToken = mapStakedPositionTypeToAmountToken(
    event.params.positionType
  );
  transaction.receivedNftId = event.params.tokenId.toString();
  transaction.receivedNftType = "STAKING_TOKEN";
  transaction.save();
}

// Note that Unstaked and Unstaked1 refer to two different versions of this event with different signatures.
export function handleUnstaked(event: Unstaked): void {
  updateCurrentEarnRate(event.address);

  const stakedPosition = assert(
    SeniorPoolStakedPosition.load(event.params.tokenId.toString())
  );
  stakedPosition.amount = stakedPosition.amount.minus(event.params.amount);

  stakedPosition.save();

  const transaction = createTransactionFromEvent(
    event,
    "SENIOR_POOL_UNSTAKE",
    event.params.user
  );
  transaction.sentNftId = event.params.tokenId.toString();
  transaction.sentNftType = "STAKING_TOKEN";
  transaction.receivedAmount = event.params.amount;
  transaction.receivedToken = mapStakedPositionTypeToAmountToken(
    // The historical/legacy Unstaked events that didn't have a `positionType` param were all of FIDU type.
    0
  );
  transaction.save();
}

export function handleUnstaked1(event: Unstaked1): void {
  updateCurrentEarnRate(event.address);

  const stakedPosition = assert(
    SeniorPoolStakedPosition.load(event.params.tokenId.toString())
  );
  stakedPosition.amount = stakedPosition.amount.minus(event.params.amount);

  stakedPosition.save();

  const transaction = createTransactionFromEvent(
    event,
    "SENIOR_POOL_UNSTAKE",
    event.params.user
  );
  transaction.sentNftId = event.params.tokenId.toString();
  transaction.sentNftType = "STAKING_TOKEN";
  transaction.receivedAmount = event.params.amount;
  transaction.receivedToken = mapStakedPositionTypeToAmountToken(
    event.params.positionType
  );
  transaction.save();
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
    stakedPosition.user = getOrInitUser(event.params.to).id;
    stakedPosition.save();
  }
}

export function handleDepositedAndStaked(event: DepositedAndStaked): void {
  const transaction = createTransactionFromEvent(
    event,
    "SENIOR_POOL_DEPOSIT_AND_STAKE",
    event.params.user
  );
  transaction.sentAmount = event.params.depositedAmount;
  transaction.sentToken = "USDC";

  // Technically depositAndStake doesn't result in the depositer actually gaining FIDU (they gain the NFT), but for the sake of the frontend this helps
  transaction.receivedAmount = event.params.amount;
  transaction.receivedToken = "FIDU";

  transaction.receivedNftId = event.params.tokenId.toString();
  transaction.receivedNftType = "STAKING_TOKEN";
  // usdc / fidu
  transaction.fiduPrice = usdcWithFiduPrecision(
    event.params.depositedAmount
  ).div(event.params.amount);
  transaction.save();
}

export function handleDepositedAndStaked1(event: DepositedAndStaked1): void {
  const transaction = createTransactionFromEvent(
    event,
    "SENIOR_POOL_DEPOSIT_AND_STAKE",
    event.params.user
  );
  transaction.sentAmount = event.params.depositedAmount;
  transaction.sentToken = "USDC";

  // Technically depositAndStake doesn't result in the depositer actually gaining FIDU (they gain the NFT), but for the sake of the frontend this helps
  transaction.receivedAmount = event.params.amount;
  transaction.receivedToken = "FIDU";

  transaction.receivedNftId = event.params.tokenId.toString();
  transaction.receivedNftType = "STAKING_TOKEN";

  // usdc / fidu
  transaction.fiduPrice = usdcWithFiduPrecision(
    event.params.depositedAmount
  ).div(event.params.amount);
  transaction.save();
}

export function handleUnstakedAndWithdrew(event: UnstakedAndWithdrew): void {
  const transaction = createTransactionFromEvent(
    event,
    "SENIOR_POOL_UNSTAKE_AND_WITHDRAWAL",
    event.params.user
  );
  transaction.sentAmount = event.params.amount;
  transaction.sentToken = "FIDU";
  transaction.sentNftId = event.params.tokenId.toString();
  transaction.sentNftType = "STAKING_TOKEN";
  transaction.receivedAmount = event.params.usdcReceivedAmount;
  transaction.receivedToken = "USDC";
  transaction.save();
}

export function handleUnstakedAndWithdrewMultiple(
  event: UnstakedAndWithdrewMultiple
): void {
  const transaction = createTransactionFromEvent(
    event,
    "SENIOR_POOL_UNSTAKE_AND_WITHDRAWAL",
    event.params.user
  );

  transaction.sentAmount = event.params.amounts.reduce(
    (prevValue: BigInt, currValue: BigInt) => prevValue.plus(currValue),
    BigInt.zero()
  );
  transaction.sentToken = "FIDU";
  transaction.receivedAmount = event.params.usdcReceivedAmount;
  transaction.receivedToken = "USDC";
  transaction.save();
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
  const GFIpriceUSD = getGFIPrice(event);
  const rewardTokenEmissionsUSD = !GFIpriceUSD
    ? BIGDECIMAL_ZERO
    : rewardTokenEmissionsAmount.divDecimal(GFI_DECIMALS).times(GFIpriceUSD);
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

  const transaction = createTransactionFromEvent(
    event,
    "STAKING_REWARDS_CLAIMED",
    event.params.user
  );
  transaction.receivedAmount = event.params.reward;
  transaction.receivedToken = "GFI";
  transaction.save();
}
