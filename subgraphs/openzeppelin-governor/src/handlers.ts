import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  BIGINT_ZERO,
  GOVERNANCE_NAME,
  ProposalState,
  VoteChoice,
  ZERO_ADDRESS,
} from "./constants";
import {
  Delegate,
  Governance,
  Proposal,
  TokenHolder,
  Vote,
} from "../generated/schema";

export function toDecimal(value: BigInt, decimals: number = 18): BigDecimal {
  return value.divDecimal(
    BigInt.fromI32(10)
      .pow(<u8>decimals)
      .toBigDecimal()
  );
}
export function addressesToStrings(addresses: Address[]): Array<string> {
  const byteAddresses = new Array<string>();
  for (let i = 0; i < addresses.length; i++) {
    byteAddresses.push(addresses[i].toHexString());
  }
  return byteAddresses;
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
  }

  return governance;
}

export function getOrCreateProposal(
  id: string,
  createIfNotFound: boolean = true,
  save: boolean = false
): Proposal {
  let proposal = Proposal.load(id);

  if (!proposal && createIfNotFound) {
    proposal = new Proposal(id);
    if (save) {
      proposal.save();
    }
  }

  return proposal as Proposal;
}

export function getOrCreateDelegate(
  address: string,
  createIfNotFound: boolean = true,
  save: boolean = true
): Delegate {
  let delegate = Delegate.load(address);

  if (!delegate && createIfNotFound) {
    delegate = new Delegate(address);
    delegate.delegatedVotesRaw = BIGINT_ZERO;
    delegate.delegatedVotes = BIGDECIMAL_ZERO;
    delegate.tokenHoldersRepresentedAmount = 0;
    delegate.numberVotes = 0;
    if (save) {
      delegate.save();
    }

    if (address != ZERO_ADDRESS) {
      let governance = getGovernance();
      governance.totalDelegates = governance.totalDelegates.plus(BIGINT_ONE);
      governance.save();
    }
  }

  return delegate as Delegate;
}

export function getOrCreateTokenHolder(
  address: string,
  createIfNotFound: boolean = true,
  save: boolean = true
): TokenHolder {
  let tokenHolder = TokenHolder.load(address);

  if (!tokenHolder && createIfNotFound) {
    tokenHolder = new TokenHolder(address);
    tokenHolder.tokenBalanceRaw = BIGINT_ZERO;
    tokenHolder.tokenBalance = BIGDECIMAL_ZERO;
    tokenHolder.totalTokensHeldRaw = BIGINT_ZERO;
    tokenHolder.totalTokensHeld = BIGDECIMAL_ZERO;
    if (save) {
      tokenHolder.save();
    }

    if (address != ZERO_ADDRESS) {
      let governance = getGovernance();
      governance.totalTokenHolders =
        governance.totalTokenHolders.plus(BIGINT_ONE);
      governance.save();
    }
  }

  return tokenHolder as TokenHolder;
}

export function _handleProposalCreated(
  proposalId: string,
  proposerAddr: string,
  targets: Address[],
  values: BigInt[],
  signatures: string[],
  calldatas: Bytes[],
  startBlock: BigInt,
  endBlock: BigInt,
  description: string,
  quorum: BigInt,
  event: ethereum.Event
): void {
  let proposal = getOrCreateProposal(proposalId);
  let proposer = getOrCreateDelegate(proposerAddr, false);

  // Checking if the proposer was a delegate already accounted for, if not we should log an error
  // since it shouldn't be possible for a delegate to propose anything without first being "created"
  if (proposer == null) {
    log.error(
      "Delegate participant {} not found on ProposalCreated. tx_hash: {}",
      [proposerAddr, event.transaction.hash.toHexString()]
    );
  }

  // Creating it anyway since we will want to account for this event data, even though it should've never happened
  proposer = getOrCreateDelegate(proposerAddr);

  proposal.proposer = proposer.id;
  proposal.delegateAgainstVotes = BIGINT_ZERO;
  proposal.delegateForVotes = BIGINT_ZERO;
  proposal.delegateAbstainVotes = BIGINT_ZERO;
  proposal.delegateTotalVotes = BIGINT_ZERO;
  proposal.againstVotes = BIGINT_ZERO;
  proposal.forVotes = BIGINT_ZERO;
  proposal.abstainVotes = BIGINT_ZERO;
  proposal.totalVotes = BIGINT_ZERO;
  proposal.targets = addressesToStrings(targets);
  proposal.values = values;
  proposal.signatures = signatures;
  proposal.calldatas = calldatas;
  proposal.creationBlock = event.block.number;
  proposal.creationTime = event.block.timestamp;
  proposal.startBlock = startBlock;
  proposal.endBlock = endBlock;
  proposal.description = description;
  proposal.state =
    event.block.number >= proposal.startBlock
      ? ProposalState.ACTIVE
      : ProposalState.PENDING;
  proposal.governanceFramework = event.address.toHexString();
  proposal.quorumVotes = quorum;
  proposal.save();

  // Increment gov proposal count
  const governance = getGovernance();
  governance.proposals = governance.proposals.plus(BIGINT_ONE);
  governance.save();
}

export function _handleProposalCanceled(
  proposalId: string,
  event: ethereum.Event
): void {
  let proposal = getOrCreateProposal(proposalId);
  proposal.state = ProposalState.CANCELED;
  proposal.cancellationBlock = event.block.number;
  proposal.cancellationTime = event.block.timestamp;
  proposal.save();

  // Update governance proposal state counts
  const governance = getGovernance();
  governance.proposalsCanceled = governance.proposalsCanceled.plus(BIGINT_ONE);
  governance.save();
}

export function _handleProposalExecuted(
  proposalId: string,
  event: ethereum.Event
): void {
  // Update proposal status + execution metadata
  let proposal = getOrCreateProposal(proposalId);
  proposal.state = ProposalState.EXECUTED;
  proposal.executionBlock = event.block.number;
  proposal.executionTime = event.block.timestamp;
  proposal.save();

  // Update governance proposal state counts
  let governance = getGovernance();
  governance.proposalsQueued = governance.proposalsQueued.minus(BIGINT_ONE);
  governance.proposalsExecuted = governance.proposalsExecuted.plus(BIGINT_ONE);
  governance.save();
}

export function _handleProposalExtended(
  proposalId: string,
  extendedDeadline: BigInt
): void {
  // Update proposal endBlock
  let proposal = getOrCreateProposal(proposalId);
  proposal.endBlock = extendedDeadline;
  proposal.save();
}

export function _handleProposalQueued(proposalId: BigInt, eta: BigInt): void {
  // Update proposal status + execution metadata
  let proposal = getOrCreateProposal(proposalId.toString());
  proposal.state = ProposalState.QUEUED;
  proposal.executionETA = eta;
  proposal.save();

  // Update governance proposal state counts
  let governance = getGovernance();
  governance.proposalsQueued = governance.proposalsQueued.plus(BIGINT_ONE);
  governance.save();
}

export function _handleVoteCast(
  proposalId: string,
  voterAddress: string,
  weight: BigInt,
  reason: string,
  support: i32,
  event: ethereum.Event
): void {
  let voteId = voterAddress.concat("-").concat(proposalId);
  let vote = new Vote(voteId);
  vote.proposal = proposalId;
  vote.voter = voterAddress;
  vote.weight = weight;
  vote.reason = reason;
  vote.block = event.block.number;
  vote.blockTime = event.block.timestamp;

  // Retrieve enum string key by value (0 = Against, 1 = For, 2 = Abstain)
  vote.choice = getVoteChoiceByValue(support);
  vote.save();

  let proposal = getOrCreateProposal(proposalId);
  if (proposal.state == ProposalState.PENDING) {
    proposal.state = ProposalState.ACTIVE;
  }

  // Increment respective vote choice counts
  // NOTE: We are counting the weight instead of individual votes
  if (support === 0) {
    proposal.delegateAgainstVotes =
      proposal.delegateAgainstVotes.plus(BIGINT_ONE);
    proposal.againstVotes = proposal.againstVotes.plus(weight);
  } else if (support === 1) {
    proposal.delegateForVotes = proposal.delegateForVotes.plus(BIGINT_ONE);
    proposal.forVotes = proposal.forVotes.plus(weight);
  } else if (support === 2) {
    proposal.delegateAbstainVotes =
      proposal.delegateAbstainVotes.plus(BIGINT_ONE);
    proposal.abstainVotes = proposal.abstainVotes.plus(weight);
  }
  // Increment total
  proposal.delegateTotalVotes = proposal.delegateTotalVotes.plus(BIGINT_ONE);
  proposal.totalVotes = proposal.totalVotes.plus(weight);
  proposal.save();

  // Add 1 to participant's proposal voting count
  let voter = getOrCreateDelegate(voterAddress);
  voter.numberVotes = voter.numberVotes + 1;
  voter.save();
}
