import { Delegation } from "../generated/schema";
import { Lock, Free } from "../generated/DSChief/VoteDelegate";
import { getDelegate } from "./helpers";
import { BIGINT_ZERO } from "./constants";

export function handleDelegateLock(event: Lock): void {
  let sender = event.params.usr.toHexString();
  let delegateAddress = event.address;
  let delegate = getDelegate(delegateAddress.toHexString());

  let delegationID = delegate.id + "-" + sender;
  let delegation = Delegation.load(delegationID);
  if (!delegation) {
    delegation = new Delegation(delegationID);
    delegation.delegator = sender;
    delegation.amount = BIGINT_ZERO;
    delegate.delegations = delegate.delegations.concat([delegationID]);
  }
  if (delegation.amount.equals(BIGINT_ZERO)) {
    delegate.tokenHoldersRepresented = delegate.tokenHoldersRepresented + 1;
  }
  delegation.amount = delegation.amount.plus(event.params.wad);
  delegation.save();
  delegate.save();
}

export function handleDelegateFree(event: Free): void {
  let sender = event.params.usr.toHexString();
  let delegateAddress = event.address;
  let delegate = getDelegate(delegateAddress.toHexString());

  let delegationID = delegate.id + "-" + sender;
  let delegation = Delegation.load(delegationID);
  if (!delegation) return;
  delegation.amount = delegation.amount.minus(event.params.wad);
  if (delegation.amount.equals(BIGINT_ZERO)) {
    delegate.tokenHoldersRepresented = delegate.tokenHoldersRepresented - 1;
  }
  delegation.save();
  delegate.save();
}
