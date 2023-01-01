import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  AdjustedHoldings,
  VaultTotalUpdate,
} from "../../../generated/MembershipVault/MembershipVault";
import { Membership, MembershipRoster } from "../../../generated/schema";

export function getOrInitMembershipRoster(): MembershipRoster {
  let membershipRoster = MembershipRoster.load("1");
  if (!membershipRoster) {
    membershipRoster = new MembershipRoster("1");
    membershipRoster.members = [];
    membershipRoster.eligibleScoreTotal = BigInt.zero();
    membershipRoster.nextEpochScoreTotal = BigInt.zero();
  }
  return membershipRoster;
}

function getOrInitMembership(memberAddress: Address): Membership {
  let membership = Membership.load(memberAddress.toHexString());
  if (!membership) {
    membership = new Membership(memberAddress.toHexString());
    membership.user = memberAddress.toHexString();
    membership.eligibleScore = BigInt.zero();
    membership.nextEpochScore = BigInt.zero();
    membership.save();
  }
  return membership;
}

export function handleAdjustedHoldings(event: AdjustedHoldings): void {
  const membership = getOrInitMembership(event.params.owner);
  membership.eligibleScore = event.params.eligibleAmount;
  membership.nextEpochScore = event.params.nextEpochAmount;
  membership.save();

  const membershipRoster = getOrInitMembershipRoster();
  if (!membershipRoster.members.includes(membership.id)) {
    membershipRoster.members = membershipRoster.members.concat([membership.id]);
    membershipRoster.save();
    // TODO maybe some logic here to remove someone from the member roster if their score becomes 0
  }
}

export function handleVaultTotalUpdate(event: VaultTotalUpdate): void {
  const membershipRoster = getOrInitMembershipRoster();
  membershipRoster.eligibleScoreTotal = event.params.eligibleAmount;
  membershipRoster.nextEpochScoreTotal = event.params.nextEpochAmount;
  membershipRoster.save();
}
