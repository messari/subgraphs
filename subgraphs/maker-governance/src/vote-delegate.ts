import { Spell } from "../generated/schema";
import { Lock, Free } from "../generated/DSChief/VoteDelegate";
import { getDelegate } from "./helpers";

export function handleDelegateLock(event: Lock): void {
  let delegateAddress = event.address;
  let delegate = getDelegate(delegateAddress.toHexString());
  delegate.tokenHoldersRepresented = delegate.tokenHoldersRepresented + 1;
  delegate.save();
}

export function handleDelegateFree(event: Free): void {
  let delegateAddress = event.address;
  let delegate = getDelegate(delegateAddress.toHexString());
  delegate.tokenHoldersRepresented = delegate.tokenHoldersRepresented - 1;
  delegate.save();
}
