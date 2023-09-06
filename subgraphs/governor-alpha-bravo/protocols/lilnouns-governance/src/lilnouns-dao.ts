import { Address, BigInt, bigInt } from "@graphprotocol/graph-ts";
import {
  ProposalCanceled,
  ProposalCreated,
  ProposalExecuted,
  ProposalQueued,
  ProposalThresholdBPSSet,
  VoteCast,
  VotingDelaySet,
  VotingPeriodSet,
  NounsDAOLogicV2,
  ProposalCreatedWithRequirements,
} from "../../../generated/NounsDAOLogicV2/NounsDAOLogicV2";
import {
  _handleProposalCreated,
  _handleProposalCanceled,
  _handleProposalExecuted,
  _handleProposalQueued,
  _handleVoteCast,
  getProposal,
  getGovernance,
} from "../../../src/handlers";
import { GovernanceFramework, Proposal } from "../../../generated/schema";
import {
  BIGINT_ONE,
  BIGINT_ZERO,
  GovernanceFrameworkType,
  NA,
  ProposalState,
} from "../../../src/constants";

// ProposalCanceled(proposalId)
export function handleProposalCanceled(event: ProposalCanceled): void {
  _handleProposalCanceled(event.params.id.toString(), event);
}

// ProposalCreated(proposalId, proposer, targets, values, signatures, calldatas, startBlock, endBlock, description)
export function handleProposalCreated(event: ProposalCreated): void {
  const quorumVotes = getQuorumFromContract(event.address, event.params.id);

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

export function handleProposalCreatedWithRequirements(
  event: ProposalCreatedWithRequirements
): void {
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
    event.params.quorumVotes,
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

// ProposalThresholdSet(oldProposalThreshold,newProposalThreshold)
export function handleProposalThresholdSet(
  event: ProposalThresholdBPSSet
): void {
  const governanceFramework = getGovernanceFramework(
    event.address.toHexString()
  );
  // TODO: DO WE NEED THIS??
  governanceFramework.proposalThreshold = event.params.newProposalThresholdBPS;
  governanceFramework.save();
}

function getLatestProposalValues(
  proposalId: string,
  contractAddress: Address
): Proposal {
  const proposal = getProposal(proposalId);

  // On first vote, set state and quorum values
  if (proposal.state == ProposalState.PENDING) {
    const contract = NounsDAOLogicV2.bind(contractAddress);
    proposal.state = ProposalState.ACTIVE;
    const res = contract.try_quorumVotes(bigInt.fromString(proposalId));
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
    event.params.reason,
    event.params.support,
    event
  );
}

// VotingDelaySet(oldVotingDelay,newVotingDelay)
export function handleVotingDelaySet(event: VotingDelaySet): void {
  const governanceFramework = getGovernanceFramework(
    event.address.toHexString()
  );
  governanceFramework.votingDelay = event.params.newVotingDelay;
  governanceFramework.save();
}

// VotingDelaySet(oldVotingPeriod,newVotingPeriod)
export function handleVotingPeriodSet(event: VotingPeriodSet): void {
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
    const contract = NounsDAOLogicV2.bind(Address.fromString(contractAddress));

    governanceFramework.name = "lilnouns-governance";
    governanceFramework.type = GovernanceFrameworkType.GOVERNOR_BRAVO;
    governanceFramework.version = NA;

    governanceFramework.contractAddress = contractAddress;
    governanceFramework.tokenAddress =
      "0x4b10701bfd7bfedc47d50562b76b436fbb5bdb3b";
    governanceFramework.timelockAddress = contract.timelock().toHexString();

    governanceFramework.votingDelay = contract.votingDelay();
    governanceFramework.votingPeriod = contract.votingPeriod();
    governanceFramework.proposalThreshold = contract.proposalThreshold();
  }

  return governanceFramework;
}

function getQuorumFromContract(
  contractAddress: Address,
  proposalId: BigInt
): BigInt {
  const contract = NounsDAOLogicV2.bind(contractAddress);
  const quorumVotes = contract.try_quorumVotes(proposalId);
  if (!quorumVotes.reverted) {
    // Update quorum at the contract level as well
    const governanceFramework = getGovernanceFramework(
      contractAddress.toHexString()
    );
    governanceFramework.quorumVotes = quorumVotes.value;
    governanceFramework.save();
    return quorumVotes.value;
  }
  return BIGINT_ZERO;
}
