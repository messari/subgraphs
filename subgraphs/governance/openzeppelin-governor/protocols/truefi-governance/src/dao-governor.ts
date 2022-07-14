import { Address } from "@graphprotocol/graph-ts";
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
  VotingPeriodSet,
} from "../../../generated/DaoGovernor/DaoGovernor";
import {
  _handleProposalCreated,
  _handleProposalCanceled,
  _handleProposalExecuted,
  _handleProposalQueued,
  _handleVoteCast,
} from "../../../src/handlers";
import { DaoGovernor } from "../../../generated/DaoGovernor/DaoGovernor";
import { GovernanceFramework } from "../../../generated/schema";

export function handleProposalCanceled(event: ProposalCanceled): void {
  _handleProposalCanceled(event.params.proposalId.toString(), event);
}

export function handleProposalCreated(event: ProposalCreated): void {
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
    event
  );
}

export function handleProposalExecuted(event: ProposalExecuted): void {
  _handleProposalExecuted(event.params.proposalId.toString(), event);
}

export function handleProposalQueued(event: ProposalQueued): void {
  _handleProposalQueued(event.params.proposalId, event.params.eta);
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
  _handleVoteCast(
    event.params.proposalId.toString(),
    event.params.voter.toHexString(),
    event.params.weight,
    event.params.reason,
    event.params.support
  );
}
// Treat VoteCastWithParams same as VoteCast
export function handleVoteCastWithParams(event: VoteCastWithParams): void {
  _handleVoteCast(
    event.params.proposalId.toString(),
    event.params.voter.toHexString(),
    event.params.weight,
    event.params.reason,
    event.params.support
  );
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

// Helper function that imports and binds the contract
function getGovernanceFramework(contractAddress: string): GovernanceFramework {
  let governanceFramework = GovernanceFramework.load(contractAddress);

  if (!governanceFramework) {
    governanceFramework = new GovernanceFramework(contractAddress);
    let contract = DaoGovernor.bind(Address.fromString(contractAddress));

    governanceFramework.name = contract.name();
    governanceFramework.type = "OZGovernor";
    governanceFramework.version = contract.version();

    governanceFramework.contractAddress = contractAddress;
    governanceFramework.tokenAddress = contract.timelock().toHexString();
    governanceFramework.timelockAddress = contract.token().toHexString();

    governanceFramework.votingDelay = contract.votingDelay();
    governanceFramework.votingPeriod = contract.votingPeriod();
    governanceFramework.proposalThreshold = contract.proposalThreshold();
    governanceFramework.quorumNumerator = contract.quorumNumerator();
    governanceFramework.quorumDenominator = contract.quorumDenominator();
  }

  return governanceFramework;
}
