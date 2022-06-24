import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  log,
} from "@graphprotocol/graph-ts";
import { ENSGovernor } from "../generated/ENSGovernor/ENSGovernor";
import {
  Delegate,
  Governance,
  GovernanceFramework,
  Proposal,
  TokenHolder,
} from "../generated/schema";

export const ZERO_ADDRESS = Address.fromHexString(
  "0x0000000000000000000000000000000000000000"
);
export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_FIVE = BigInt.fromI32(5);
export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);

export const GOVERNANCE_NAME = "OZGovernor";
export namespace ProposalState {
  export const PENDING = "PENDING";
  export const ACTIVE = "ACTIVE";
  export const CANCELED = "CANCELED";
  export const DEFEATED = "DEFEATED";
  export const SUCCEEDED = "SUCCEEDED";
  export const QUEUED = "QUEUED";
  export const EXPIRED = "EXPIRED";
  export const EXECUTED = "EXECUTED";
}

export namespace VoteChoice {
  export const AGAINST_VALUE = 0;
  export const FOR_VALUE = 1;
  export const ABSTAIN_VALUE = 2;
  export const AGAINST = "AGAINST";
  export const FOR = "FOR";
  export const ABSTAIN = "ABSTAIN";
}

export function getVoteChoiceByValue(choiceValue: number): string {
  if (choiceValue === VoteChoice.ABSTAIN_VALUE) {
    return VoteChoice.AGAINST;
  } else if (choiceValue === VoteChoice.FOR_VALUE) {
    return VoteChoice.FOR;
  } else if (choiceValue === VoteChoice.ABSTAIN_VALUE) {
    return VoteChoice.ABSTAIN;
  } else {
    // Case that shouldn't happen
    log.error("Voting choice of {} does not exist", [choiceValue.toString()]);
    return VoteChoice.ABSTAIN;
  }
}

export function toDecimal(value: BigInt, decimals: number = 18): BigDecimal {
  return value.divDecimal(
    BigInt.fromI32(10)
      .pow(<u8>decimals)
      .toBigDecimal()
  );
}

export function addressesToBytes(addresses: Address[]): Array<Bytes> {
  const byteAddresses = new Array<Bytes>();
  for (let i = 0; i < addresses.length; i++) {
    byteAddresses.push(addresses[i] as Bytes);
  }
  return byteAddresses;
}

export function getGovernance(): Governance {
  let governance = Governance.load(GOVERNANCE_NAME);

  if (!governance) {
    governance = new Governance(GOVERNANCE_NAME);
    governance.proposals = BIGINT_ZERO;
    governance.currentTokenHolders = BIGINT_ZERO;
    governance.totalTokenHolders = BIGINT_ZERO;
    governance.currentDelegates = BIGINT_ZERO;
    governance.totalDelegates = BIGINT_ZERO;
    governance.delegatedVotesRaw = BIGINT_ZERO;
    governance.delegatedVotes = BIGDECIMAL_ZERO;
    governance.proposalsQueued = BIGINT_ZERO;
    governance.proposalsExecuted = BIGINT_ZERO;
    governance.proposalsCanceled = BIGINT_ZERO;

    governance.save();
  }

  return governance;
}

export function getGovernanceFramework(
  contractAddress: Bytes
): GovernanceFramework {
  let governanceFramework = GovernanceFramework.load(contractAddress);

  if (!governanceFramework) {
    governanceFramework = new GovernanceFramework(contractAddress);
    let contract = ENSGovernor.bind(Address.fromBytes(contractAddress));

    governanceFramework.name = contract.name();
    governanceFramework.type = "OZGovernor";
    governanceFramework.version = contract.version();

    governanceFramework.contractAddress = contractAddress;
    governanceFramework.tokenAddress = contract.timelock();
    governanceFramework.timelockAddress = contract.token();

    governanceFramework.votingDelay = contract.votingDelay();
    governanceFramework.votingPeriod = contract.votingPeriod();
    governanceFramework.proposalThreshold = contract.proposalThreshold();
    governanceFramework.quorumNumerator = contract.quorumNumerator();
    governanceFramework.quorumDenominator = contract.quorumDenominator();

    governanceFramework.save();
  }

  return governanceFramework;
}

export function getProposal(id: string): Proposal {
  let proposal = Proposal.load(id);

  if (proposal == null) {
    proposal = new Proposal(id);
    proposal.save();
  }

  return proposal;
}

export function getDelegate(address: Bytes): Delegate {
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

export function getTokenHolder(address: Bytes): TokenHolder {
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
