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
} from "../../../generated/FeiDAO/FeiDAO";
import { FeiDAO } from "../../../generated/FeiDAO/FeiDAO";
import { GovernanceFramework, Proposal } from "../../../generated/schema";
import {
  BIGINT_ONE,
  GovernanceFrameworkType,
  ProposalState,
} from "../../../src/constants";
import {
  _handleProposalCreated,
  _handleProposalCanceled,
  _handleProposalExecuted,
  _handleProposalQueued,
  _handleVoteCast,
  getProposal,
  getGovernance,
} from "../../../src/handlers";

export function handleProposalCanceled(event: ProposalCanceled): void {
  _handleProposalCanceled(event.params.proposalId.toString(), event);
}

export function handleProposalCreated(event: ProposalCreated): void {
  const quorumVotes = getQuorumFromContract(
    event.address,
    event.block.number.minus(BIGINT_ONE)
  );

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
    quorumVotes,
    event
  );
}

export function handleProposalExecuted(event: ProposalExecuted): void {
  _handleProposalExecuted(event.params.proposalId.toString(), event);
}

export function handleProposalQueued(event: ProposalQueued): void {
  _handleProposalQueued(event.params.proposalId, event.params.eta, event);
}

export function handleProposalThresholdUpdated(
  event: ProposalThresholdUpdated
): void {
  const governanceFramework = getGovernanceFramework(
    event.address.toHexString()
  );
  governanceFramework.proposalThreshold = event.params.newProposalThreshold;
  governanceFramework.save();
}

// QuorumUpdated(uint256 oldQuorum, uint256 newQuorum);
export function handleQuorumUpdated(event: QuorumUpdated): void {
  const governanceFramework = getGovernanceFramework(
    event.address.toHexString()
  );
  governanceFramework.quorumVotes = event.params.newQuorum;
  governanceFramework.save();
}

export function handleTimelockChange(event: TimelockChange): void {
  const governanceFramework = getGovernanceFramework(
    event.address.toHexString()
  );
  governanceFramework.timelockAddress = event.params.newTimelock.toHexString();
  governanceFramework.save();
}

function getLatestProposalValues(
  proposalId: string,
  contractAddress: Address
): Proposal {
  const proposal = getProposal(proposalId);

  // On first vote, set state and quorum values
  if (proposal.state == ProposalState.PENDING) {
    proposal.state = ProposalState.ACTIVE;
    proposal.quorumVotes = getQuorumFromContract(
      contractAddress,
      proposal.startBlock
    );

    const governance = getGovernance();
    proposal.tokenHoldersAtStart = governance.currentTokenHolders;
    proposal.delegatesAtStart = governance.currentDelegates;
  }
  return proposal;
}

export function handleVoteCast(event: VoteCast): void {
  const proposal = getLatestProposalValues(
    event.params.proposalId.toString(),
    event.address
  );

  // Proposal will be updated as part of handler
  _handleVoteCast(
    proposal,
    event.params.voter.toHexString(),
    event.params.weight,
    event.params.reason,
    event.params.support,
    event
  );
}

// VotingDelayUpdated(uint256 oldVotingDelay, uint256 newVotingDelay);
export function handleVotingDelayUpdated(event: VotingDelayUpdated): void {
  const governanceFramework = getGovernanceFramework(
    event.address.toHexString()
  );
  governanceFramework.votingDelay = event.params.newVotingDelay;
  governanceFramework.save();
}

// VotingPeriodUpdated(uint256 oldVotingPeriod, uint256 newVotingPeriod);
export function handleVotingPeriodUpdated(event: VotingPeriodUpdated): void {
  const governanceFramework = getGovernanceFramework(
    event.address.toHexString()
  );
  governanceFramework.votingPeriod = event.params.newVotingPeriod;
  governanceFramework.save();
}

// Helper function that imports and binds the contract
function getGovernanceFramework(contractAddress: string): GovernanceFramework {
  let governanceFramework = GovernanceFramework.load(contractAddress);

  if (!governanceFramework) {
    governanceFramework = new GovernanceFramework(contractAddress);
    const contract = FeiDAO.bind(Address.fromString(contractAddress));

    governanceFramework.name = "fei-governance";
    governanceFramework.type = GovernanceFrameworkType.OPENZEPPELIN_GOVERNOR;
    governanceFramework.version = contract.version();

    governanceFramework.contractAddress = contractAddress;
    governanceFramework.tokenAddress = contract.token().toHexString();
    governanceFramework.timelockAddress = contract.timelock().toHexString();

    governanceFramework.votingDelay = contract.votingDelay();
    governanceFramework.votingPeriod = contract.votingPeriod();
    governanceFramework.proposalThreshold = contract.proposalThreshold();
    governanceFramework.quorumVotes = contract.quorumVotes(); // FIXME: OZ -- Only for GovA/B
  }

  return governanceFramework;
}

function getQuorumFromContract(
  contractAddress: Address,
  blockNumber: BigInt
): BigInt {
  const contract = FeiDAO.bind(contractAddress);
  const quorumVotes = contract.quorum(blockNumber);

  const governanceFramework = getGovernanceFramework(
    contractAddress.toHexString()
  );
  governanceFramework.quorumVotes = quorumVotes;
  governanceFramework.save();

  return quorumVotes;
}
