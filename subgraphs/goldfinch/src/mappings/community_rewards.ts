import {CommunityRewardsToken} from "../../generated/schema"
import {
  CommunityRewards as CommunityRewardsContract,
  Granted,
  RewardPaid,
  GrantRevoked,
} from "../../generated/CommunityRewards/CommunityRewards"
import {BigInt} from "@graphprotocol/graph-ts"

// Seems redundant, but this handler gets used to add the startTime/endTime info on tokens
// Remember that this actually runs _before_ GrantAccepted. We can let GrantAccepted fill out the other details.
export function handleGranted(event: Granted): void {
  const communityRewardsToken = new CommunityRewardsToken(event.params.tokenId.toString())
  const communityRewardsContract = CommunityRewardsContract.bind(event.address)
  const tokenLaunchTime = communityRewardsContract.tokenLaunchTimeInSeconds()
  communityRewardsToken.startTime = tokenLaunchTime
  communityRewardsToken.endTime = communityRewardsToken.startTime.plus(event.params.vestingLength)
  // have to set these required fields to avoid an error when saving, even though they get written by a subsequent handler
  communityRewardsToken.source = "MERKLE_DISTRIBUTOR" // Has to be set to something that satisfies the enum
  communityRewardsToken.index = 0
  communityRewardsToken.user = event.params.user.toHexString()
  communityRewardsToken.totalGranted = event.params.amount
  communityRewardsToken.totalClaimed = BigInt.zero()
  communityRewardsToken.cliffLength = event.params.cliffLength
  communityRewardsToken.vestingLength = event.params.vestingLength
  communityRewardsToken.vestingInterval = event.params.vestingInterval
  communityRewardsToken.grantedAt = event.block.timestamp
  communityRewardsToken.revokedAt = BigInt.zero()
  communityRewardsToken.save()
}

export function handleRewardPaid(event: RewardPaid): void {
  const communityRewardsToken = assert(CommunityRewardsToken.load(event.params.tokenId.toString()))
  communityRewardsToken.totalClaimed = communityRewardsToken.totalClaimed.plus(event.params.reward)
  communityRewardsToken.save()
}

export function handleGrantRevoked(event: GrantRevoked): void {
  const communityRewardsToken = assert(CommunityRewardsToken.load(event.params.tokenId.toString()))
  communityRewardsToken.revokedAt = event.block.timestamp
  communityRewardsToken.save()
}
