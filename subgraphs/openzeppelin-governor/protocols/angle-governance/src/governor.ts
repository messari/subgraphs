import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  ProposalCanceled,
  ProposalCreated,
  ProposalExecuted,
  ProposalQueued,
  ProposalThresholdUpdated,
  QuorumUpdated,
  TimelockChange,
  VoteCast,
  VotingDelayUpdated,
  VotingPeriodUpdated,
} from "../../../generated/Governor/Governor";
import { Governor } from "../../../generated/Governor/Governor";
import { GovernanceFramework } from "../../../generated/schema";
import { GovernanceFrameworkType } from "../../../src/constants";
import {
  _handleProposalCreated,
  _handleProposalCanceled,
  _handleProposalExecuted,
  _handleProposalQueued,
  _handleVoteCast,
} from "../../../src/handlers";

export function handleProposalCanceled(event: ProposalCanceled): void {
  _handleProposalCanceled(event.params.proposalId.toString(), event);
}

export function handleProposalCreated(event: ProposalCreated): void {
  let contract = Governor.bind(event.address);
  let quorum = contract.quorum(event.block.number);

  // FIXME: Prefer to use a single object arg for params
  // e.g.  { proposalId: event.params.proposalId, proposer: event.params.proposer, ...}
  // but graph wasm compilation breaks for unknown reasons
  _handleProposalCreated(
    event.params.proposalId.toString(),
    event.params.proposer.toHexString(),
    event.params.targets,
    event.params.values,
    event.params.signatures,
    event.params.calldatas,
    event.params.startBlock,
    event.params.endBlock,
    event.params.description,
    quorum,
    event
  );
}

export function handleProposalExecuted(event: ProposalExecuted): void {
  _handleProposalExecuted(event.params.proposalId.toString(), event);
}

export function handleProposalQueued(event: ProposalQueued): void {
  _handleProposalQueued(event.params.proposalId, event.params.eta);
}

export function handleProposalThresholdUpdated(
  event: ProposalThresholdUpdated
): void {
  let governanceFramework = getGovernanceFramework(event.address.toHexString());
  governanceFramework.proposalThreshold = event.params.newProposalThreshold;
  governanceFramework.save();
}

// QuorumUpdated(uint256 oldQuorum, uint256 newQuorum);
export function handleQuorumUpdated(event: QuorumUpdated): void {
  let governanceFramework = getGovernanceFramework(event.address.toHexString());
  governanceFramework.quorumVotes = event.params.newQuorum;
  governanceFramework.save();
}

export function handleTimelockChange(event: TimelockChange): void {
  let governanceFramework = getGovernanceFramework(event.address.toHexString());
  governanceFramework.timelockAddress = event.params.newTimelock.toHexString();
  governanceFramework.save();
}

export function handleVoteCast(event: VoteCast): void {
  _handleVoteCast(
    event.params.proposalId.toString(),
    event.params.voter.toHexString(),
    event.params.weight,
    event.params.reason,
    event.params.support,
    event
  );
}

// VotingDelayUpdated(uint256 oldVotingDelay, uint256 newVotingDelay);
export function handleVotingDelayUpdated(event: VotingDelayUpdated): void {
  let governanceFramework = getGovernanceFramework(event.address.toHexString());
  governanceFramework.votingDelay = event.params.newVotingDelay;
  governanceFramework.save();
}

// VotingPeriodUpdated(uint256 oldVotingPeriod, uint256 newVotingPeriod);
export function handleVotingPeriodUpdated(event: VotingPeriodUpdated): void {
  let governanceFramework = getGovernanceFramework(event.address.toHexString());
  governanceFramework.votingPeriod = event.params.newVotingPeriod;
  governanceFramework.save();
}

// Helper function that imports and binds the contract
function getGovernanceFramework(contractAddress: string): GovernanceFramework {
  let governanceFramework = GovernanceFramework.load(contractAddress);

  if (!governanceFramework) {
    governanceFramework = new GovernanceFramework(contractAddress);
    let contract = Governor.bind(Address.fromString(contractAddress));

    governanceFramework.name = contract.name();
    governanceFramework.type = GovernanceFrameworkType.OPENZEPPELIN_GOVERNOR;
    governanceFramework.version = contract.version();

    governanceFramework.contractAddress = contractAddress;
    governanceFramework.tokenAddress = contract.token().toHexString();
    governanceFramework.timelockAddress = contract.timelock().toHexString();

    governanceFramework.votingDelay = contract.votingDelay();
    governanceFramework.votingPeriod = contract.votingPeriod();
    governanceFramework.proposalThreshold = contract.proposalThreshold();

    // Use start block for quorum at governanceFramework creation
    const startBlock = new BigInt(13473019);
    governanceFramework.quorumVotes = contract.quorum(startBlock);
  }

  return governanceFramework;
}
