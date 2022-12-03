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
  createTransactionFromEvent,
  usdcWithFiduPrecision,
} from "../entities/helpers";
import {
  updateCurrentEarnRate,
  updateSeniorPoolRewardTokenEmissions,
} from "../entities/staking_rewards";
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

  // messari schema
  updateSeniorPoolRewardTokenEmissions(event);
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

  // messari schema
  updateSeniorPoolRewardTokenEmissions(event);
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

  // messari schema
  updateSeniorPoolRewardTokenEmissions(event);
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

  // messari schema
  updateSeniorPoolRewardTokenEmissions(event);
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

  // messari schema
  updateSeniorPoolRewardTokenEmissions(event);
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
