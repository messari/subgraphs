import { Delegation } from "../../../generated/schema";
import { Lock, Free } from "../../../generated/DSChief/VoteDelegate";
import {
  createDelegateVotingPowerChange,
  getDelegate,
  getGovernanceFramework,
} from "../../../src/helpers";
import { BIGINT_ZERO, CHIEF } from "../../../src/constants";

export function handleDelegateLock(event: Lock): void {
  const sender = event.params.usr.toHexString();
  const delegateAddress = event.address;
  const delegate = getDelegate(delegateAddress.toHexString());

  const delegationID = delegate.id + "-" + sender;
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

  const delegateVPChange = createDelegateVotingPowerChange(
    event,
    delegation.amount,
    delegation.amount.plus(event.params.wad),
    delegate.id
  );
  delegateVPChange.save();

  delegation.amount = delegation.amount.plus(event.params.wad);
  delegation.save();
  delegate.save();

  const framework = getGovernanceFramework(CHIEF);
  framework.currentTokenDelegated = framework.currentTokenDelegated.plus(
    event.params.wad
  );
  framework.save();
}

export function handleDelegateFree(event: Free): void {
  const sender = event.params.usr.toHexString();
  const delegateAddress = event.address;
  const delegate = getDelegate(delegateAddress.toHexString());

  const delegationID = delegate.id + "-" + sender;
  const delegation = Delegation.load(delegationID);
  if (!delegation) return;

  const delegateVPChange = createDelegateVotingPowerChange(
    event,
    delegation.amount,
    delegation.amount.minus(event.params.wad),
    delegate.id
  );
  delegateVPChange.save();

  delegation.amount = delegation.amount.minus(event.params.wad);
  if (delegation.amount.equals(BIGINT_ZERO)) {
    delegate.tokenHoldersRepresented = delegate.tokenHoldersRepresented - 1;
  }
  delegation.save();
  delegate.save();

  const framework = getGovernanceFramework(CHIEF);
  framework.currentTokenDelegated = framework.currentTokenDelegated.minus(
    event.params.wad
  );
  framework.save();
}
