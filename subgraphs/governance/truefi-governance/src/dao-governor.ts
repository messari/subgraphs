import { log } from "@graphprotocol/graph-ts";
import {
  ProposalCanceled,
  ProposalCreated,
  ProposalExecuted,
  ProposalQueued,
  ProposalThresholdSet,
  QuorumNumeratorUpdated,
  TimelockChange,
  VoteCast,
  VoteCastWithParams,
  VotingDelaySet,
  VotingPeriodSet
} from "../generated/DaoGovernor/DaoGovernor"
import { Vote } from "../generated/schema";
import {
  getOrCreateProposal,
  ProposalState,
  getGovernance,
  BIGINT_ONE,
  addressesToStrings,
  getOrCreateDelegate,
  getGovernanceFramework,
  getVoteChoiceByValue,
  BIGINT_ZERO,
} from "./helpers";

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

export function handleProposalCreated(event: ProposalCreated): void {
  let proposal = getOrCreateProposal(event.params.proposalId.toString());
  let proposer = getOrCreateDelegate(
    event.params.proposer.toHexString(),
    false
  );

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
  proposer = getOrCreateDelegate(event.params.proposer.toHexString());

  proposal.proposer = proposer.id;
  proposal.againstVotes = BIGINT_ZERO;
  proposal.forVotes = BIGINT_ZERO;
  proposal.abstainVotes = BIGINT_ZERO;
  proposal.targets = addressesToStrings(event.params.targets);
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

export function handleProposalThresholdSet(event: ProposalThresholdSet): void {
  let governanceFramework = getGovernanceFramework(event.address.toHexString());
  governanceFramework.proposalThreshold = event.params.newProposalThreshold;
  governanceFramework.save();
}

export function handleQuorumNumeratorUpdated(
  event: QuorumNumeratorUpdated
): void {
  let governanceFramework = getGovernanceFramework(event.address.toHexString());
  governanceFramework.quorumNumerator = event.params.newQuorumNumerator;
  governanceFramework.save();
}

export function handleTimelockChange(event: TimelockChange): void {
  let governanceFramework = getGovernanceFramework(event.address.toHexString());
  governanceFramework.timelockAddress = event.params.newTimelock.toHexString();
  governanceFramework.save();
}

export function handleVoteCast(event: VoteCast): void {
  const proposalId = event.params.proposalId.toString();
  const voterAddress = event.params.voter.toHexString();

  let voteId = voterAddress.concat("-").concat(proposalId);
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
// Treat VoteCastWithParams same as VoteCast
export function handleVoteCastWithParams(event: VoteCastWithParams): void {
  const proposalId = event.params.proposalId.toString();
  const voterAddress = event.params.voter.toHexString();

  let voteId = voterAddress.concat("-").concat(proposalId);
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

export function handleVotingDelaySet(event: VotingDelaySet): void {
  let governanceFramework = getGovernanceFramework(event.address.toHexString());
  governanceFramework.votingDelay = event.params.newVotingDelay;
  governanceFramework.save();
}

export function handleVotingPeriodSet(event: VotingPeriodSet): void {
  let governanceFramework = getGovernanceFramework(event.address.toHexString());
  governanceFramework.votingPeriod = event.params.newVotingPeriod;
  governanceFramework.save();
}
