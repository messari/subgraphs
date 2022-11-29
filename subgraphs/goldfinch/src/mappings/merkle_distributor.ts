import {CommunityRewardsToken} from "../../generated/schema"
import {GrantAccepted} from "../../generated/MerkleDistributor/MerkleDistributor"

export function handleGrantAccepted(event: GrantAccepted): void {
  const communityRewardsToken = assert(CommunityRewardsToken.load(event.params.tokenId.toString()))
  communityRewardsToken.user = event.params.account.toHexString()
  communityRewardsToken.source = "MERKLE_DISTRIBUTOR"
  communityRewardsToken.index = event.params.index.toI32()
  communityRewardsToken.totalGranted = event.params.amount
  communityRewardsToken.grantedAt = event.block.timestamp
  communityRewardsToken.cliffLength = event.params.cliffLength
  communityRewardsToken.vestingLength = event.params.vestingLength
  communityRewardsToken.vestingInterval = event.params.vestingInterval
  communityRewardsToken.save()
}
