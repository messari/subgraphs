import { Address, Bytes, log } from "@graphprotocol/graph-ts";
import {
  ProposalCanceled,
  ProposalCreated,
  ProposalExecuted,
  ProposalQueued,
  QuorumNumeratorUpdated,
  TimelockChange,
  VoteCast,
} from "../generated/ENSGovernor/ENSGovernor";
import { Vote } from "../generated/schema";
import {
  BIGINT_ONE,
  getGovernance,
  getOrCreateDelegate,
  getOrCreateProposal,
  getVoteChoiceByValue,
  getGovernanceFramework,
  ProposalState,
  addressesToBytes,
} from "./helpers";

// ProposalCanceled(proposalId)
export function handleProposalCanceled(event: ProposalCanceled): void {
  let proposal = getOrCreateProposal(event.params.proposalId.toString());
  proposal.state = ProposalState.CANCELED;
  proposal.cancellationBlock = event.block.number;
  proposal.cancellationTime = event.block.timestamp;
  proposal.save();

  // Update governance proposal state counts
  const governance = getGovernance();
  governance.proposalsCanceled = governance.proposalsCanceled.plus(BIGINT_ONE);
  governance.save();
}

// ProposalCreated(proposalId, proposer, targets, values, signatures, calldatas, startBlock, endBlock, description)
export function handleProposalCreated(event: ProposalCreated): void {
  log.info("Proposal #{} created by {}", [
    event.params.proposalId.toString(),
    event.params.proposer.toHexString(),
  ]);
  let proposal = getOrCreateProposal(event.params.proposalId.toString());
  let proposer = getOrCreateDelegate(event.params.proposer, false);

  // Checking if the proposer was a delegate already accounted for, if not we should log an error
  // since it shouldn't be possible for a delegate to propose anything without first being "created"
  if (proposer == null) {
    log.error(
      "Delegate participant {} not found on ProposalCreated. tx_hash: {}",
      [
        event.params.proposer.toHexString(),
        event.transaction.hash.toHexString(),
      ]
    );
  }

  // Creating it anyway since we will want to account for this event data, even though it should've never happened
  proposer = getOrCreateDelegate(event.params.proposer);

  proposal.proposer = proposer.id;
  proposal.targets = addressesToBytes(event.params.targets);
  proposal.values = event.params.values;
  proposal.signatures = event.params.signatures;
  proposal.calldatas = event.params.calldatas;
  proposal.creationBlock = event.block.number;
  proposal.creationTime = event.block.timestamp;
  proposal.startBlock = event.params.startBlock;
  proposal.endBlock = event.params.endBlock;
  proposal.description = event.params.description;
  proposal.state =
    event.block.number >= proposal.startBlock
      ? ProposalState.ACTIVE
      : ProposalState.PENDING;
  proposal.save();

  // Increment gov proposal count
  const governance = getGovernance();
  governance.proposals = governance.proposals.plus(BIGINT_ONE);
  governance.save();
}

// ProposalExecuted(proposalId)
export function handleProposalExecuted(event: ProposalExecuted): void {
  // Update proposal status + execution metadata
  let proposal = getOrCreateProposal(event.params.proposalId.toString());
  proposal.state = ProposalState.EXECUTED;
  proposal.executionETA = null;
  proposal.executionBlock = event.block.number;
  proposal.executionTime = event.block.timestamp;
  proposal.save();

  // Update governance proposal state counts
  let governance = getGovernance();
  governance.proposalsQueued = governance.proposalsQueued.minus(BIGINT_ONE);
  governance.proposalsExecuted = governance.proposalsExecuted.plus(BIGINT_ONE);
  governance.save();
}

// ProposalQueued(proposalId, eta)
export function handleProposalQueued(event: ProposalQueued): void {
  // Update proposal status + execution metadata
  let proposal = getOrCreateProposal(event.params.proposalId.toString());
  proposal.state = ProposalState.QUEUED;
  proposal.executionETA = event.params.eta;
  proposal.save();

  // Update governance proposal state counts
  let governance = getGovernance();
  governance.proposalsQueued = governance.proposalsQueued.plus(BIGINT_ONE);
  governance.save();
}

// QuorumNumeratorUpdated(oldQuorumNumerator, newQuorumNumerator)
export function handleQuorumNumeratorUpdated(
  event: QuorumNumeratorUpdated
): void {
  let governanceFramework = getGovernanceFramework(event.address);
  governanceFramework.quorumNumerator = event.params.newQuorumNumerator;
  governanceFramework.save();
}

// TimelockChange (address oldTimelock, address newTimelock)
export function handleTimelockChange(event: TimelockChange): void {
  let governanceFramework = getGovernanceFramework(event.address);
  governanceFramework.timelockAddress = event.params.newTimelock;
  governanceFramework.save();
}

// VoteCast(account, proposalId, support, weight, reason);
export function handleVoteCast(event: VoteCast): void {
  const proposalId = event.params.proposalId.toString();
  const voterAddress = event.params.voter;

  let voteId = voterAddress
    .toHexString()
    .concat("-")
    .concat(proposalId);
  let vote = new Vote(voteId);
  vote.proposal = proposalId;
  vote.voter = voterAddress;
  vote.weight = event.params.weight;
  vote.reason = event.params.reason;

  // Retrieve enum string key by value (0 = Against, 1 = For, 2 = Abstain)
  vote.choice = getVoteChoiceByValue(event.params.support);
  vote.save();

  let proposal = getOrCreateProposal(proposalId);
  if (proposal.state == ProposalState.PENDING) {
    proposal.state = ProposalState.ACTIVE;
  }

  // Increment respective vote choice counts
  if (event.params.support === 0) {
    proposal.againstVotes = proposal.againstVotes.plus(BIGINT_ONE);
  } else if (event.params.support === 1) {
    proposal.forVotes = proposal.forVotes.plus(BIGINT_ONE);
  } else if (event.params.support === 2) {
    proposal.abstainVotes = proposal.abstainVotes.plus(BIGINT_ONE);
  }
  proposal.save();

  // Add 1 to participant's proposal voting count
  let voter = getOrCreateDelegate(voterAddress);
  voter.numberVotes = voter.numberVotes + 1;
  voter.save();
}
