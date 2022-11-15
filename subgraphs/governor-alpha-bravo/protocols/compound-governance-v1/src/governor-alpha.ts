import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  ProposalCanceled,
  ProposalCreated,
  ProposalExecuted,
  ProposalQueued,
  VoteCast,
} from "../../../generated/GovernorAlpha/GovernorAlpha";
import {
  _handleProposalCreated,
  _handleProposalCanceled,
  _handleProposalExecuted,
  _handleProposalQueued,
  _handleVoteCast,
  getProposal,
  getGovernance,
} from "../../../src/handlers";
import { GovernorAlpha } from "../../../generated/GovernorAlpha/GovernorAlpha";
import { GovernanceFramework, Proposal } from "../../../generated/schema";
import {
  BIGINT_ONE,
  GovernanceFrameworkType,
  ProposalState,
} from "../../../src/constants";

// ProposalCanceled(proposalId)
export function handleProposalCanceled(event: ProposalCanceled): void {
  _handleProposalCanceled(event.params.id.toString(), event);
}

// ProposalCreated(proposalId, proposer, targets, values, signatures, calldatas, startBlock, endBlock, description)
export function handleProposalCreated(event: ProposalCreated): void {
  const quorumVotes = getQuorumFromContract(event.address);

  // FIXME: Prefer to use a single object arg for params
  // e.g.  { proposalId: event.params.proposalId, proposer: event.params.proposer, ...}
  // but graph wasm compilation breaks for unknown reasons
  _handleProposalCreated(
    event.params.id.toString(),
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
  _handleProposalExecuted(event.params.id.toString(), event);
}

// ProposalQueued(proposalId, eta)
export function handleProposalQueued(event: ProposalQueued): void {
  _handleProposalQueued(event.params.id, event.params.eta, event);
}

function getLatestProposalValues(
  proposalId: string,
  contractAddress: Address
): Proposal {
  const proposal = getProposal(proposalId);

  // On first vote, set state and quorum values
  if (proposal.state == ProposalState.PENDING) {
    const contract = GovernorAlpha.bind(contractAddress);
    proposal.state = ProposalState.ACTIVE;
    const res = contract.try_quorumVotes();
    if (!res.reverted) {
      proposal.quorumVotes = res.value;
    } else {
      proposal.quorumVotes = BIGINT_ONE;
    }

    const governance = getGovernance();
    proposal.tokenHoldersAtStart = governance.currentTokenHolders;
    proposal.delegatesAtStart = governance.currentDelegates;
  }
  return proposal;
}
// VoteCast(account, proposalId, support, weight, reason);
export function handleVoteCast(event: VoteCast): void {
  const proposal = getLatestProposalValues(
    event.params.proposalId.toString(),
    event.address
  );

  // Proposal will be updated as part of handler
  _handleVoteCast(
    proposal,
    event.params.voter.toHexString(),
    event.params.votes,
    "",
    event.params.support,
    event
  );
}

// Helper function that imports and binds the contract
function getGovernanceFramework(contractAddress: string): GovernanceFramework {
  let governanceFramework = GovernanceFramework.load(contractAddress);

  if (!governanceFramework) {
    governanceFramework = new GovernanceFramework(contractAddress);
    const contract = GovernorAlpha.bind(Address.fromString(contractAddress));

    governanceFramework.name = "compound-governance-v1";
    governanceFramework.type = GovernanceFrameworkType.GOVERNOR_ALPHA;
    governanceFramework.version = "1";

    governanceFramework.contractAddress = contractAddress;
    governanceFramework.tokenAddress = contract.comp().toHexString();
    governanceFramework.timelockAddress = contract.timelock().toHexString();

    governanceFramework.votingDelay = contract.votingDelay();
    governanceFramework.votingPeriod = contract.votingPeriod();
    governanceFramework.proposalThreshold = contract.proposalThreshold();
    governanceFramework.quorumVotes = contract.quorumVotes();
  }

  return governanceFramework;
}

function getQuorumFromContract(contractAddress: Address): BigInt {
  const contract = GovernorAlpha.bind(contractAddress);
  const quorumVotes = contract.quorumVotes();

  // Update quorum at the contract level as well
  const governanceFramework = getGovernanceFramework(
    contractAddress.toHexString()
  );
  governanceFramework.quorumVotes = quorumVotes;
  governanceFramework.save();

  return quorumVotes;
}
