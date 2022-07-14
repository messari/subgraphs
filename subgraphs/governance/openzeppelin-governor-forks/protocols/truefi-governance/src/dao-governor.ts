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
  _handleProposalCanceled({ proposalId: event.params.proposalId }, event);
}

export function handleProposalCreated(event: ProposalCreated): void {
  _handleProposalCreated(
    {
      proposalId: event.params.proposalId,
      proposer: event.params.proposer,
      targets: event.params.targets,
      values: event.params.values,
      signatures: event.params.signatures,
      calldatas: event.params.calldatas,
      startBlock: event.params.startBlock,
      endBlock: event.params.endBlock,
      description: event.params.description,
    },
    event
  );
}

export function handleProposalExecuted(event: ProposalExecuted): void {
  _handleProposalExecuted({ proposalId: event.params.proposalId }, event);
}

export function handleProposalQueued(event: ProposalQueued): void {
  _handleProposalQueued(
    { proposalId: event.params.proposalId, eta: event.params.eta },
    event
  );
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
    {
      proposalId: event.params.proposalId,
      voter: event.params.voter,
      weight: event.params.weight,
      reason: event.params.reason,
      support: event.params.support,
    },
    event
  );
}
// Treat VoteCastWithParams same as VoteCast
export function handleVoteCastWithParams(event: VoteCastWithParams): void {
  _handleVoteCast(
    {
      proposalId: event.params.proposalId,
      voter: event.params.voter,
      weight: event.params.weight,
      reason: event.params.reason,
      support: event.params.support,
    },
    event
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
