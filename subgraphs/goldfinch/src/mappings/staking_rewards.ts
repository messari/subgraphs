import {BigInt, Bytes, log} from "@graphprotocol/graph-ts"
import {SeniorPoolStakedPosition} from "../../generated/schema"
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
} from "../../generated/StakingRewards/StakingRewards"

import {createTransactionFromEvent} from "../entities/helpers"
import {updateCurrentEarnRate} from "../entities/staking_rewards"

function mapStakedPositionTypeToAmountToken(stakedPositionType: i32): string {
  // NOTE: The return type of this function should be a SupportedCrypto enum value.

  if (stakedPositionType === 0) {
    return "FIDU"
  } else if (stakedPositionType === 1) {
    return "CURVE_LP"
  } else {
    throw new Error(`Unexpected staked position type: ${stakedPositionType}`)
  }
}

export function handleRewardAdded(event: RewardAdded): void {
  updateCurrentEarnRate(event.address)
}

export function handleStaked(event: Staked): void {
  updateCurrentEarnRate(event.address)

  const stakedPosition = new SeniorPoolStakedPosition(event.params.tokenId.toString())
  stakedPosition.amount = event.params.amount
  stakedPosition.initialAmount = event.params.amount
  stakedPosition.user = event.params.user.toHexString()
  stakedPosition.startTime = event.block.timestamp
  stakedPosition.positionType = "Fidu" // Curve integration did not exist at this time
  stakedPosition.totalRewardsClaimed = BigInt.zero()

  stakedPosition.save()
}

export function handleStaked1(event: Staked1): void {
  updateCurrentEarnRate(event.address)

  const stakedPosition = new SeniorPoolStakedPosition(event.params.tokenId.toString())
  stakedPosition.amount = event.params.amount
  stakedPosition.initialAmount = event.params.amount
  stakedPosition.user = event.params.user.toHexString()
  stakedPosition.startTime = event.block.timestamp
  if (event.params.positionType == 0) {
    stakedPosition.positionType = "Fidu"
  } else if (event.params.positionType == 1) {
    stakedPosition.positionType = "CurveLP"
  } else {
    log.critical("Encountered unrecognized positionType in a Staked event: {}", [event.params.positionType.toString()])
  }
  stakedPosition.totalRewardsClaimed = BigInt.zero()

  stakedPosition.save()

  const transaction = createTransactionFromEvent(event, "SENIOR_POOL_STAKE", event.params.user)
  transaction.amount = event.params.amount
  transaction.amountToken = mapStakedPositionTypeToAmountToken(event.params.positionType)
  transaction.save()
}

// Note that Unstaked and Unstaked1 refer to two different versions of this event with different signatures.
export function handleUnstaked(event: Unstaked): void {
  updateCurrentEarnRate(event.address)

  const stakedPosition = assert(SeniorPoolStakedPosition.load(event.params.tokenId.toString()))
  stakedPosition.amount = stakedPosition.amount.minus(event.params.amount)

  stakedPosition.save()

  const transaction = createTransactionFromEvent(event, "SENIOR_POOL_UNSTAKE", event.params.user)
  transaction.amount = event.params.amount
  transaction.amountToken = mapStakedPositionTypeToAmountToken(
    // The historical/legacy Unstaked events that didn't have a `positionType` param were all of FIDU type.
    0
  )
  transaction.save()
}

export function handleUnstaked1(event: Unstaked1): void {
  updateCurrentEarnRate(event.address)

  const stakedPosition = assert(SeniorPoolStakedPosition.load(event.params.tokenId.toString()))
  stakedPosition.amount = stakedPosition.amount.minus(event.params.amount)

  stakedPosition.save()

  const transaction = createTransactionFromEvent(event, "SENIOR_POOL_UNSTAKE", event.params.user)
  transaction.amount = event.params.amount
  transaction.amountToken = mapStakedPositionTypeToAmountToken(event.params.positionType)
  transaction.save()
}

export function handleTransfer(event: Transfer): void {
  if (event.params.from.notEqual(Bytes.fromHexString("0x0000000000000000000000000000000000000000"))) {
    const stakedPosition = assert(SeniorPoolStakedPosition.load(event.params.tokenId.toString()))
    stakedPosition.user = event.params.to.toHexString()
    stakedPosition.save()
  }
}

export function handleDepositedAndStaked(event: DepositedAndStaked): void {
  const transaction = createTransactionFromEvent(event, "SENIOR_POOL_DEPOSIT_AND_STAKE", event.params.user)
  transaction.amount = event.params.depositedAmount
  transaction.amountToken = "USDC"
  transaction.save()
}

export function handleDepositedAndStaked1(event: DepositedAndStaked1): void {
  const transaction = createTransactionFromEvent(event, "SENIOR_POOL_DEPOSIT_AND_STAKE", event.params.user)
  transaction.amount = event.params.depositedAmount
  transaction.amountToken = "USDC"
  transaction.save()
}

export function handleUnstakedAndWithdrew(event: UnstakedAndWithdrew): void {
  const transaction = createTransactionFromEvent(event, "SENIOR_POOL_UNSTAKE_AND_WITHDRAWAL", event.params.user)
  transaction.amount = event.params.usdcReceivedAmount
  transaction.amountToken = "USDC"
  transaction.save()
}

export function handleUnstakedAndWithdrewMultiple(event: UnstakedAndWithdrewMultiple): void {
  const transaction = createTransactionFromEvent(event, "SENIOR_POOL_UNSTAKE_AND_WITHDRAWAL", event.params.user)
  transaction.amount = event.params.usdcReceivedAmount
  transaction.amountToken = "USDC"
  transaction.save()
}

export function handleRewardPaid(event: RewardPaid): void {
  const position = assert(SeniorPoolStakedPosition.load(event.params.tokenId.toString()))
  position.totalRewardsClaimed = position.totalRewardsClaimed.plus(event.params.reward)
  position.save()
}
