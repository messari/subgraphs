import { CommunityRewardsToken } from "../../generated/schema";
import { GrantAccepted } from "../../generated/BackerMerkleDistributor/BackerMerkleDistributor";
import { log } from "@graphprotocol/graph-ts";

export function handleGrantAccepted(event: GrantAccepted): void {
  const communityRewardsToken = CommunityRewardsToken.load(
    event.params.tokenId.toString()
  );
  if (!communityRewardsToken) {
    log.error(
      "[handleGrantAccepted] No community rewards token found for tokenId: {}",
      [event.params.tokenId.toString()]
    );
    return;
  }
  communityRewardsToken.user = event.params.account.toHexString();
  communityRewardsToken.source = "BACKER_MERKLE_DISTRIBUTOR";
  communityRewardsToken.index = event.params.index.toI32();
  communityRewardsToken.totalGranted = event.params.amount;
  communityRewardsToken.grantedAt = event.block.timestamp;
  communityRewardsToken.cliffLength = event.params.cliffLength;
  communityRewardsToken.vestingLength = event.params.vestingLength;
  communityRewardsToken.vestingInterval = event.params.vestingInterval;
  communityRewardsToken.save();
}
