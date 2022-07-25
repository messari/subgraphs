import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  ProposalCanceled,
  ProposalCreated,
  ProposalExecuted,
  ProposalQueued,
  QuorumUpdated,
  TimelockChange,
  VoteCast,
  VotingDelayUpdated,
  VotingPeriodUpdated,
} from "../../../generated/UnlockProtocolGovernor/UnlockProtocolGovernor";
import {
  _handleProposalCreated,
  _handleProposalCanceled,
  _handleProposalExecuted,
  _handleProposalQueued,
  _handleVoteCast,
  getOrCreateProposal,
  getGovernance,
} from "../../../src/handlers";
import { UnlockProtocolGovernor } from "../../../generated/UnlockProtocolGovernor/UnlockProtocolGovernor";
import { GovernanceFramework, Proposal } from "../../../generated/schema";
import {
  BIGINT_ONE,
  BIGINT_ZERO,
  GovernanceFrameworkType,
  ProposalState,
} from "../../../src/constants";

// ProposalCanceled(proposalId)
export function handleProposalCanceled(event: ProposalCanceled): void {
  _handleProposalCanceled(event.params.proposalId.toString(), event);
}

// ProposalCreated(proposalId, proposer, targets, values, signatures, calldatas, startBlock, endBlock, description)
export function handleProposalCreated(event: ProposalCreated): void {
  let quorumVotes = UnlockProtocolGovernor.bind(event.address).quorum(
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

// ProposalExecuted(proposalId)
export function handleProposalExecuted(event: ProposalExecuted): void {
  _handleProposalExecuted(event.params.proposalId.toString(), event);
}

// ProposalQueued(proposalId, eta)
export function handleProposalQueued(event: ProposalQueued): void {
  _handleProposalQueued(event.params.proposalId, event.params.eta);
}

// QuorumUpdated(oldQuorum, newQuorum)
export function handleQuorumUpdated(event: QuorumUpdated): void {
  let governanceFramework = getGovernanceFramework(event.address.toHexString());
  governanceFramework.quorumVotes = event.params.newQuorum;
  governanceFramework.save();
}

// TimelockChange (address oldTimelock, address newTimelock)
export function handleTimelockChange(event: TimelockChange): void {
  let governanceFramework = getGovernanceFramework(event.address.toHexString());
  governanceFramework.timelockAddress = event.params.newTimelock.toHexString();
  governanceFramework.save();
}

function getLatestProposalValues(
  proposalId: string,
  contractAddress: Address
): Proposal {
  let proposal = getOrCreateProposal(proposalId);

  // On first vote, set state and quorum values
  if (proposal.state == ProposalState.PENDING) {
    let contract = UnlockProtocolGovernor.bind(contractAddress);
    proposal.state = ProposalState.ACTIVE;
    proposal.quorumVotes = contract.quorum(proposal.startBlock);

    let governance = getGovernance();
    proposal.tokenHoldersAtStart = governance.currentTokenHolders;
    proposal.delegatesAtStart = governance.currentDelegates;
  }
  return proposal;
}
// VoteCast(account, proposalId, support, weight, reason);
export function handleVoteCast(event: VoteCast): void {
  let proposal = getLatestProposalValues(
    event.params.proposalId.toString(),
    event.address
  );

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
    let contract = UnlockProtocolGovernor.bind(
      Address.fromString(contractAddress)
    );

    governanceFramework.name = contract.name();
    governanceFramework.type = GovernanceFrameworkType.OPENZEPPELIN_GOVERNOR;
    governanceFramework.version = contract.version();

    governanceFramework.contractAddress = contractAddress;
    governanceFramework.tokenAddress = contract.token().toHexString();
    governanceFramework.timelockAddress = contract.timelock().toHexString();

    governanceFramework.votingDelay = contract.votingDelay();
    governanceFramework.votingPeriod = contract.votingPeriod();

    // Missing from this old version of Governor, default it to Zero
    governanceFramework.proposalThreshold = BIGINT_ZERO;

    const startBlock = new BigInt(13148447);
    governanceFramework.quorumVotes = contract.quorum(startBlock);
  }

  return governanceFramework;
}
