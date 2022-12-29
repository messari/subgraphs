import { EpochFinalized } from "../../../generated/MembershipCollector/MembershipCollector";
import {
  Membership,
  MembershipEpoch,
  MembershipRewardDisbursement,
} from "../../../generated/schema";
import { getOrInitMembershipRoster } from "./membership_vault";
import { BigInt } from "@graphprotocol/graph-ts";

export function handleEpochFinalized(event: EpochFinalized): void {
  const epoch = new MembershipEpoch(event.params.epoch.toString());
  epoch.epoch = event.params.epoch;
  epoch.totalRewards = event.params.totalRewards;
  epoch.finalizedAt = event.block.timestamp.toI32();
  epoch.save();

  // Create a MembershipRewardDisbursement entity for each member (this is used for the line graph at the top of /membership)
  const membershipRoster = getOrInitMembershipRoster();
  for (let i = 0; i < membershipRoster.members.length; i++) {
    const membership = Membership.load(membershipRoster.members[i]);
    if (!membership) {
      continue;
    }
    // create the disbursement
    const disbursement = new MembershipRewardDisbursement(
      `${event.params.epoch.toString()}-${membership.id}`
    );
    disbursement.user = membership.user;
    disbursement.epoch = event.params.epoch;
    disbursement.rewards = membershipRoster.eligibleScoreTotal.isZero()
      ? BigInt.zero()
      : membership.eligibleScore
          .times(event.params.totalRewards)
          .div(membershipRoster.eligibleScoreTotal);
    disbursement.allocatedAt = event.block.timestamp.toI32();
    disbursement.save();

    // update eligibleScore for each member
    membership.eligibleScore = membership.nextEpochScore;
    membership.save();
  }
  membershipRoster.eligibleScoreTotal = membershipRoster.nextEpochScoreTotal;
  membershipRoster.save();
}
