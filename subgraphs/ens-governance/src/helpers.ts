import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import {
  Delegate,
  Governance,
  Proposal,
  TokenHolder,
} from "../generated/schema";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_FIVE = BigInt.fromI32(5);
export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);

export const GOVERNANCE_NAME = "OZGovernor";
export const PROPOSAL_STATE_PENDING = "PENDING";
export const PROPOSAL_STATE_ACTIVE = "ACTIVE";
export const PROPOSAL_STATE_CANCELED = "CANCELED";
export const PROPOSAL_STATE_DEFEATED = "DEFEATED";
export const PROPOSAL_STATE_SUCCEEDED = "SUCCEEDED";
export const PROPOSAL_STATE_QUEUED = "QUEUED";
export const PROPOSAL_STATE_EXPIRED = "EXPIRED";
export const PROPOSAL_STATE_EXECUTED = "EXECUTED";

export const VOTE_CHOICE_AGAINST_VALUE = 0;
export const VOTE_CHOICE_FOR_VALUE = 1;
export const VOTE_CHOICE_ABSTAIN_VALUE = 2;
export const VOTE_CHOICE_AGAINST = "AGAINST";
export const VOTE_CHOICE_FOR = "FOR";
export const VOTE_CHOICE_ABSTAIN = "ABSTAIN";

export function getVoteChoiceByValue(choiceValue: number): string {
  if (choiceValue === 0) {
    return VOTE_CHOICE_AGAINST;
  } else if (choiceValue === 1) {
    return VOTE_CHOICE_FOR;
  } else if (choiceValue === 2) {
    return VOTE_CHOICE_ABSTAIN;
  } else {
    // Case that shouldn't happen
    log.error("Voting choice of {} does not exist", [choiceValue.toString()]);
    return VOTE_CHOICE_ABSTAIN;
  }
}

export function toDecimal(value: BigInt, decimals: number = 18): BigDecimal {
  return value.divDecimal(
    BigInt.fromI32(10)
      .pow(<u8>decimals)
      .toBigDecimal()
  );
}

export function addressesToHexStrings(addresses: Address[]): string[] {
  const hexStringAddress: string[] = [];
  for (let i = 0; i < addresses.length; i++) {
    hexStringAddress.push(addresses[i].toHexString());
  }
  return hexStringAddress;
}

export function getGovernance(): Governance {
  let governance = Governance.load(GOVERNANCE_NAME);

  if (governance == null) {
    governance = new Governance(GOVERNANCE_NAME);
    governance.totalTokenHolders = BIGINT_ZERO;
    governance.currentTokenHolders = BIGINT_ZERO;
    governance.currentDelegates = BIGINT_ZERO;
    governance.totalDelegates = BIGINT_ZERO;
    governance.delegatedVotesRaw = BIGINT_ZERO;
    governance.delegatedVotes = BIGDECIMAL_ZERO;
    governance.proposalsQueued = BIGINT_ZERO;

    governance.save();
  }

  return governance;
}

export function getProposal(id: string): Proposal {
  let proposal = Proposal.load(id);

  if (proposal == null) {
    proposal = new Proposal(id);
    proposal.save();
  }

  return proposal;
}

export function getDelegate(address: string): Delegate {
  let delegate = Delegate.load(address);

  if (delegate == null) {
    delegate = new Delegate(address);
    delegate.delegatedVotesRaw = BIGINT_ZERO;
    delegate.delegatedVotes = BIGDECIMAL_ZERO;
    delegate.numberVotes = 0;
    delegate.tokenHoldersRepresentedAmount = 0;

    if (address != ZERO_ADDRESS) {
      let governance = getGovernance();
      governance.totalDelegates = governance.totalDelegates.plus(BIGINT_ONE);
      governance.save();
    }

    delegate.save();
  }

  return delegate;
}

export function getTokenHolder(address: string): TokenHolder {
  let tokenHolder = TokenHolder.load(address);

  if (tokenHolder == null) {
    tokenHolder = new TokenHolder(address);
    tokenHolder.tokenBalanceRaw = BIGINT_ZERO;
    tokenHolder.tokenBalance = BIGDECIMAL_ZERO;
    tokenHolder.totalTokensHeldRaw = BIGINT_ZERO;
    tokenHolder.totalTokensHeld = BIGDECIMAL_ZERO;

    if (address != ZERO_ADDRESS) {
      let governance = getGovernance();
      governance.totalTokenHolders = governance.totalTokenHolders.plus(
        BIGINT_ONE
      );
      governance.save();
    }

    tokenHolder.save();
  }

  return tokenHolder;
}
