import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  BIGINT_ONE,
  BIGINT_ZERO,
  GOVERNANCE_TYPE,
  NA,
  ProposalState,
} from "../../../src/constants";
import {
  getGovernance,
  getProposal,
  _handleProposalCanceled,
  _handleProposalCreated,
  _handleProposalExecuted,
  _handleProposalQueued,
  _handleVoteEmitted,
} from "../../../src/handlers";
import {
  DydxGovernor,
  ProposalCanceled,
  ProposalCreated,
  ProposalExecuted,
  ProposalQueued,
  VoteEmitted,
  VotingDelayChanged,
} from "../../../generated/DydxGovernor/DydxGovernor";
import { Executor } from "../../../generated/DydxGovernor/Executor";
import { GovernanceStrategy } from "../../../generated/DydxGovernor/GovernanceStrategy";
import { GovernanceFramework } from "../../../generated/schema";

export function handleProposalCanceled(event: ProposalCanceled): void {
  _handleProposalCanceled(event.params.id.toString(), event);
}

export function handleProposalCreated(event: ProposalCreated): void {
  const executor = event.params.executor;
  const quorumVotes = getQuorumFromContract(
    event.address,
    executor,
    event.block.number.minus(BIGINT_ONE)
  );

  _handleProposalCreated(
    event.params.id.toString(),
    event.params.creator.toHexString(),
    executor.toHexString(),
    event.params.targets,
    event.params.values,
    event.params.signatures,
    event.params.calldatas,
    event.params.startBlock,
    event.params.endBlock,
    event.params.ipfsHash,
    quorumVotes,
    event
  );
}

export function handleProposalExecuted(event: ProposalExecuted): void {
  _handleProposalExecuted(event.params.id.toString(), event);
}

export function handleProposalQueued(event: ProposalQueued): void {
  _handleProposalQueued(
    event.params.id.toString(),
    event.params.executionTime,
    event
  );
}

export function handleVoteEmitted(event: VoteEmitted): void {
  const proposal = getProposal(event.params.id.toString());

  // if state is pending (i.e. the first vote), set state, quorum, delegates and tokenholders
  if (proposal.state == ProposalState.PENDING) {
    proposal.state = ProposalState.ACTIVE;
    // Set snapshot for quorum, tokenholders and delegates
    proposal.quorumVotes = getQuorumFromContract(
      event.address,
      Address.fromString(proposal.executor),
      event.block.number.minus(BIGINT_ONE)
    );
    const governance = getGovernance();
    proposal.tokenHoldersAtStart = governance.currentTokenHolders;
    proposal.delegatesAtStart = governance.currentDelegates;
  }

  // Proposal will be updated as part of handler
  _handleVoteEmitted(
    proposal,
    event.params.voter.toHexString(),
    event.params.votingPower,
    event.params.support,
    event
  );
}

// VotingDelayChanged (newVotingDelay, initiatorChange)
export function handleVotingDelayChanged(event: VotingDelayChanged): void {
  const governanceFramework = getGovernanceFramework(
    event.address.toHexString()
  );
  governanceFramework.votingDelay = event.params.newVotingDelay;
  governanceFramework.save();
}

// Helper function that imports and binds the contract
function getGovernanceFramework(contractAddress: string): GovernanceFramework {
  let governanceFramework = GovernanceFramework.load(contractAddress);

  if (!governanceFramework) {
    governanceFramework = new GovernanceFramework(contractAddress);
    const contract = DydxGovernor.bind(Address.fromString(contractAddress));
    governanceFramework.name = contract.EIP712_DOMAIN_NAME();
    governanceFramework.type = GOVERNANCE_TYPE;
    governanceFramework.version = NA;

    governanceFramework.contractAddress = contractAddress;
    governanceFramework.tokenAddress =
      "0x92d6c1e31e14520e676a687f0a93788b716beff5";
    governanceFramework.timelockAddress =
      "0x64c7d40c07efabec2aafdc243bf59eaf2195c6dc";

    // Init as zero, as govStrat / executor contracts are not deployed yet
    // values will be updated when proposal voting starts
    governanceFramework.votingPeriod = BIGINT_ZERO;
    governanceFramework.proposalThreshold = BIGINT_ZERO;
    governanceFramework.votingDelay = contract.getVotingDelay();
  }

  return governanceFramework;
}
function getQuorumFromContract(
  contractAddress: Address,
  executorAddress: Address,
  blockNumber: BigInt
): BigInt {
  // Get govStrat contract address
  const contract = DydxGovernor.bind(contractAddress);
  const govStratAddress = contract.getGovernanceStrategy();
  // Get totalVotingSuppy from GovStrat contract
  const governanceStrategyContract = GovernanceStrategy.bind(govStratAddress);
  const totalVotingSupply = governanceStrategyContract.getTotalVotingSupplyAt(
    blockNumber.minus(BIGINT_ONE)
  );
  // Get minimum voting power from Executor contract
  const executorContract = Executor.bind(executorAddress);
  const quorumVotes =
    executorContract.getMinimumVotingPowerNeeded(totalVotingSupply);

  // Update quorum at the contract level as well
  const governanceFramework = getGovernanceFramework(
    contractAddress.toHexString()
  );
  governanceFramework.quorumVotes = quorumVotes;
  governanceFramework.save();

  return quorumVotes;
}
