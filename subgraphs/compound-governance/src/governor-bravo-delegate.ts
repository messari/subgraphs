import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
  log,
} from "@graphprotocol/graph-ts"
import {
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  BIGINT_ZERO,
  GOVERNANCE_NAME,
  ProposalState,
  VoteChoice,
  ZERO_ADDRESS,
} from "./constants";
import {
  GovernorBravoDelegate,
  NewAdmin,
  NewImplementation,
  NewPendingAdmin,
  ProposalCanceled,
  ProposalCreated,
  ProposalExecuted,
  ProposalQueued,
  ProposalThresholdSet,
  VoteCast,
  VotingDelaySet,
  VotingPeriodSet
} from "../generated/GovernorBravoDelegate/GovernorBravoDelegate"
import {
  Delegate,
  Governance,
  Proposal,
  TokenHolder,
  Vote,
  TokenDailySnapshot,
  VoteDailySnapshot,
} from "../generated/schema"

// ProposalCreated(proposalId, proposer, targets, values, signatures, calldatas, startBlock, endBlock, description)
export function handleProposalCreated(event: ProposalCreated): void {
  let quorumVotes = GovernorBravoDelegate.bind(event.address).quorumVotes();

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

function _handleProposalCreated(
  proposalId: string,
  proposerAddr: string,
  targets: Address[],
  values: BigInt[],
  signatures: string[],
  calldatas: Bytes[],
  startBlock: BigInt,
  endBlock: BigInt,
  description: string,
  quorum: BigInt,
  event: ethereum.Event
): void {
  let proposal = getProposal(proposalId);
  let proposer = getOrCreateDelegate(proposerAddr);

  // Checking if the proposer was a delegate already accounted for, if not we should log an error
  // since it shouldn't be possible for a delegate to propose anything without first being "created"
  if (proposer == null) {
    log.error(
      "Delegate participant {} not found on ProposalCreated. tx_hash: {}",
      [proposerAddr, event.transaction.hash.toHexString()]
    );
  }

  // Creating it anyway since we will want to account for this event data, even though it should've never happened
  proposer = getOrCreateDelegate(proposerAddr);

  proposal.proposer = proposer.id;
  proposal.txnHash = event.transaction.hash.toHexString();
  proposal.againstDelegateVotes = BIGINT_ZERO;
  proposal.forDelegateVotes = BIGINT_ZERO;
  proposal.abstainDelegateVotes = BIGINT_ZERO;
  proposal.totalDelegateVotes = BIGINT_ZERO;
  proposal.againstWeightedVotes = BIGINT_ZERO;
  proposal.forWeightedVotes = BIGINT_ZERO;
  proposal.abstainWeightedVotes = BIGINT_ZERO;
  proposal.totalWeightedVotes = BIGINT_ZERO;
  proposal.targets = addressesToStrings(targets);
  proposal.values = values;
  proposal.signatures = signatures;
  proposal.calldatas = calldatas; // THIS LARGE BYTES[] EXCEEDS GRAPH'S ROW SIZE
  proposal.creationBlock = event.block.number;
  proposal.creationTime = event.block.timestamp;
  proposal.startBlock = startBlock;
  proposal.endBlock = endBlock;
  proposal.description = description;
  proposal.state =
    event.block.number >= proposal.startBlock
      ? ProposalState.ACTIVE
      : ProposalState.PENDING;
  proposal.governanceFramework = event.address.toHexString();
  proposal.quorumVotes = quorum;
  proposal.save();

  // Increment gov proposal count
  const governance = getGovernance();
  governance.proposals = governance.proposals.plus(BIGINT_ONE);
  governance.save();
}

function getProposal(id: string): Proposal {
  let proposal = Proposal.load(id);
  if (!proposal) {
    proposal = new Proposal(id);
    proposal.tokenHoldersAtStart = BIGINT_ZERO;
    proposal.delegatesAtStart = BIGINT_ZERO;
  }

  return proposal as Proposal;
}

function getGovernance(): Governance {
  let governance = Governance.load(GOVERNANCE_NAME);
  if (!governance) {
    governance = new Governance(GOVERNANCE_NAME);
    governance.totalTokenSupply = BIGINT_ZERO;
    governance.proposals = BIGINT_ZERO;
    governance.currentTokenHolders = BIGINT_ZERO;
    governance.totalTokenHolders = BIGINT_ZERO;
    governance.currentDelegates = BIGINT_ZERO;
    governance.totalDelegates = BIGINT_ZERO;
    governance.delegatedVotesRaw = BIGINT_ZERO;
    governance.delegatedVotes = BIGDECIMAL_ZERO;
    governance.proposalsQueued = BIGINT_ZERO;
    governance.proposalsExecuted = BIGINT_ZERO;
    governance.proposalsCanceled = BIGINT_ZERO;
  }

  return governance;
}

function getOrCreateDelegate(address: string): Delegate {
  let delegate = Delegate.load(address);
  if (!delegate) {
    delegate = new Delegate(address);
    delegate.delegatedVotesRaw = BIGINT_ZERO;
    delegate.delegatedVotes = BIGDECIMAL_ZERO;
    delegate.tokenHoldersRepresentedAmount = 0;
    delegate.numberVotes = 0;
    delegate.save();

    if (address != ZERO_ADDRESS) {
      let governance = getGovernance();
      governance.totalDelegates = governance.totalDelegates.plus(BIGINT_ONE);
      governance.save();
    }
  }

  return delegate as Delegate;
}
function addressesToStrings(addresses: Address[]): Array<string> {
  const byteAddresses = new Array<string>();
  for (let i = 0; i < addresses.length; i++) {
    byteAddresses.push(addresses[i].toHexString());
  }
  return byteAddresses;
}