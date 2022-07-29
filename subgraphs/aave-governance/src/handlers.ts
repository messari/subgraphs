import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
  log,
  ipfs,
  json,
  JSONValue,
  JSONValueKind,
} from "@graphprotocol/graph-ts";
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
  Delegate,
  Governance,
  Proposal,
  TokenHolder,
  Vote,
} from "../generated/schema";

export function toDecimal(value: BigInt, decimals: number = 18): BigDecimal {
  return value.divDecimal(
    BigInt.fromI32(10)
      .pow(<u8>decimals)
      .toBigDecimal()
  );
}
export function addressesToStrings(addresses: Address[]): Array<string> {
  const byteAddresses = new Array<string>();
  for (let i = 0; i < addresses.length; i++) {
    byteAddresses.push(addresses[i].toHexString());
  }
  return byteAddresses;
}

export function getVoteChoiceByValue(choiceValue: boolean): string {
  if (choiceValue === true) {
    return VoteChoice.FOR;
  } else {
    return VoteChoice.AGAINST;
  }
}

export function getGovernance(): Governance {
  let governance = Governance.load(GOVERNANCE_NAME);

  if (!governance) {
    governance = new Governance(GOVERNANCE_NAME);
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

export function getOrCreateProposal(
  id: string,
  createIfNotFound: boolean = true,
  save: boolean = false
): Proposal {
  let proposal = Proposal.load(id);

  if (!proposal && createIfNotFound) {
    proposal = new Proposal(id);
    proposal.tokenHoldersAtStart = BIGINT_ZERO;
    proposal.delegatesAtStart = BIGINT_ZERO;
    if (save) {
      proposal.save();
    }
  }

  return proposal as Proposal;
}

export function getOrCreateDelegate(
  address: string,
  createIfNotFound: boolean = true,
  save: boolean = true
): Delegate {
  let delegate = Delegate.load(address);

  if (!delegate && createIfNotFound) {
    delegate = new Delegate(address);
    delegate.delegatedVotesRaw = BIGINT_ZERO;
    delegate.delegatedVotes = BIGDECIMAL_ZERO;
    delegate.tokenHoldersRepresentedAmount = 0;
    delegate.numberVotes = 0;
    if (save) {
      delegate.save();
    }

    if (address != ZERO_ADDRESS) {
      let governance = getGovernance();
      governance.totalDelegates = governance.totalDelegates.plus(BIGINT_ONE);
      governance.save();
    }
  }

  return delegate as Delegate;
}

export function getOrCreateTokenHolder(
  address: string,
  createIfNotFound: boolean = true,
  save: boolean = true
): TokenHolder {
  let tokenHolder = TokenHolder.load(address);

  if (!tokenHolder && createIfNotFound) {
    tokenHolder = new TokenHolder(address);
    tokenHolder.tokenBalanceRaw = BIGINT_ZERO;
    tokenHolder.tokenBalance = BIGDECIMAL_ZERO;
    tokenHolder.totalTokensHeldRaw = BIGINT_ZERO;
    tokenHolder.totalTokensHeld = BIGDECIMAL_ZERO;
    if (save) {
      tokenHolder.save();
    }

    if (address != ZERO_ADDRESS) {
      let governance = getGovernance();
      governance.totalTokenHolders =
        governance.totalTokenHolders.plus(BIGINT_ONE);
      governance.save();
    }
  }

  return tokenHolder as TokenHolder;
}

export function _handleProposalCreated(
  proposalId: string,
  proposerAddr: string,
  executorAddr: string,
  targets: Address[],
  values: BigInt[],
  signatures: string[],
  calldatas: Bytes[],
  startBlock: BigInt,
  endBlock: BigInt,
  ipfsHash: Bytes,
  quorum: BigInt,
  event: ethereum.Event
): void {
  let proposal = getOrCreateProposal(proposalId);
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
  proposal.executor = executorAddr;
  proposal.proposer = proposer.id;
  proposal.quorumVotes = BIGINT_ZERO;
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
  proposal.calldatas = calldatas;
  proposal.creationBlock = event.block.number;
  proposal.creationTime = event.block.timestamp;
  proposal.startBlock = startBlock;
  proposal.endBlock = endBlock;

  // Get description from ipfs hash (from official Aave Governance Subgraph)
  // https://github.com/aave/governance-delegation-subgraph/blob/master/src/mapping/governance.ts#L33
  let description = "";
  let hash = Bytes.fromHexString(
    "1220" + ipfsHash.toHexString().slice(2)
  ).toBase58();
  let data = ipfs.cat(hash);
  let proposalData = json.try_fromBytes(data as Bytes);
  let descriptionJSON: JSONValue | null = null;
  if (proposalData.isOk && proposalData.value.kind == JSONValueKind.OBJECT) {
    let jsonData = proposalData.value.toObject();
    descriptionJSON = jsonData.get("description");
    if (descriptionJSON) {
      description = descriptionJSON.toString();
    }
  }
  proposal.description = description;
  proposal.governanceFramework = event.address.toHexString();

  // If start block reached, proposal starts as active
  if (event.block.number >= proposal.startBlock) {
    proposal.state = ProposalState.ACTIVE;

    // Set snapshot for quorum, tokenholders and delegates
    proposal.quorumVotes = quorum;
    let governance = getGovernance();
    proposal.tokenHoldersAtStart = governance.currentTokenHolders;
    proposal.delegatesAtStart = governance.currentDelegates;
  } else {
    proposal.state = ProposalState.PENDING;
  }

  proposal.save();

  // Increment gov proposal count
  const governance = getGovernance();
  governance.proposals = governance.proposals.plus(BIGINT_ONE);
  governance.save();
}

export function _handleProposalCanceled(
  proposalId: string,
  event: ethereum.Event
): void {
  let proposal = getOrCreateProposal(proposalId);
  proposal.state = ProposalState.CANCELED;
  proposal.cancellationBlock = event.block.number;
  proposal.cancellationTime = event.block.timestamp;
  proposal.save();

  // Update governance proposal state counts
  const governance = getGovernance();
  governance.proposalsCanceled = governance.proposalsCanceled.plus(BIGINT_ONE);
  governance.save();
}

export function _handleProposalExecuted(
  proposalId: string,
  event: ethereum.Event
): void {
  // Update proposal status + execution metadata
  let proposal = getOrCreateProposal(proposalId);
  proposal.state = ProposalState.EXECUTED;
  proposal.executionBlock = event.block.number;
  proposal.executionTime = event.block.timestamp;
  proposal.save();

  // Update governance proposal state counts
  let governance = getGovernance();
  governance.proposalsQueued = governance.proposalsQueued.minus(BIGINT_ONE);
  governance.proposalsExecuted = governance.proposalsExecuted.plus(BIGINT_ONE);
  governance.save();
}

export function _handleProposalExtended(
  proposalId: string,
  extendedDeadline: BigInt
): void {
  // Update proposal endBlock
  let proposal = getOrCreateProposal(proposalId);
  proposal.endBlock = extendedDeadline;
  proposal.save();
}

export function _handleProposalQueued(proposalId: string, eta: BigInt): void {
  // Update proposal status + execution metadata
  let proposal = getOrCreateProposal(proposalId.toString());
  proposal.state = ProposalState.QUEUED;
  proposal.executionETA = eta;
  proposal.save();

  // Update governance proposal state counts
  let governance = getGovernance();
  governance.proposalsQueued = governance.proposalsQueued.plus(BIGINT_ONE);
  governance.save();
}

export function _handleVoteEmitted(
  proposal: Proposal,
  voterAddress: string,
  weight: BigInt,
  support: boolean,
  event: ethereum.Event
): void {
  let choice = getVoteChoiceByValue(support);
  let voteId = voterAddress.concat("-").concat(proposal.id);

  let vote = Vote.load(voteId);
  if (vote) {
    // Avoid edge case for duplicate votes with zero weights
    return;
  }

  vote = new Vote(voteId);
  vote.proposal = proposal.id;
  vote.voter = voterAddress;
  vote.weight = weight;
  vote.reason = null;
  vote.block = event.block.number;
  vote.blockTime = event.block.timestamp;
  vote.txnHash = event.transaction.hash.toHexString();
  vote.choice = choice;
  vote.save();

  // Increment respective vote choice counts
  if (choice === VoteChoice.AGAINST) {
    proposal.againstDelegateVotes =
      proposal.againstDelegateVotes.plus(BIGINT_ONE);
    proposal.againstWeightedVotes = proposal.againstWeightedVotes.plus(weight);
  } else {
    proposal.forDelegateVotes = proposal.forDelegateVotes.plus(BIGINT_ONE);
    proposal.forWeightedVotes = proposal.forWeightedVotes.plus(weight);
  }
  // Increment total
  proposal.totalDelegateVotes = proposal.totalDelegateVotes.plus(BIGINT_ONE);
  proposal.totalWeightedVotes = proposal.totalWeightedVotes.plus(weight);
  proposal.save();

  // Add 1 to participant's proposal voting count
  let voter = getOrCreateDelegate(voterAddress);
  voter.numberVotes = voter.numberVotes + 1;
  voter.save();
}
