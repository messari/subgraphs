import {
  Address,
  BigDecimal,
  BigInt,
  ipfs,
  json,
  Bytes,
  log,
  JSONValue,
  JSONValueKind,
} from "@graphprotocol/graph-ts";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  BIGINT_ZERO,
  GOVERNANCE_NAME,
  ProposalState,
  SHORT_EXECUTOR_ADDRESS,
  TOKEN_ADDRESS,
  VoteChoice,
  ZERO_ADDRESS,
} from "../../../src/constants";
import {
  AaveGovernanceV2,
  ProposalCanceled,
  ProposalCreated,
  ProposalExecuted,
  ProposalQueued,
  VoteEmitted,
  VotingDelayChanged,
} from "../../../generated/AaveGovernanceV2/AaveGovernanceV2";
import { Executor } from "../../../generated/AaveGovernanceV2/Executor";
import { GovernanceStrategy } from "../../../generated/AaveGovernanceV2/GovernanceStrategy";
import {
  Delegate,
  Governance,
  GovernanceFramework,
  Proposal,
  TokenHolder,
  Vote,
} from "../../../generated/schema";

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

export function getVoteChoiceByValue(choiceValue: bool): string {
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

export function handleProposalCanceled(event: ProposalCanceled): void {
  let proposal = getOrCreateProposal(event.params.id.toString());
  proposal.state = ProposalState.CANCELED;
  proposal.cancellationBlock = event.block.number;
  proposal.cancellationTime = event.block.timestamp;
  proposal.save();

  // Update governance proposal state counts
  const governance = getGovernance();
  governance.proposalsCanceled = governance.proposalsCanceled.plus(BIGINT_ONE);
  governance.save();
}

export function handleProposalCreated(event: ProposalCreated): void {
  let proposalId = event.params.id.toString();
  let proposerAddr = event.params.creator.toHexString();

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
  proposal.executor = event.params.executor.toHexString();
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
  proposal.targets = addressesToStrings(event.params.targets);
  proposal.values = event.params.values;
  proposal.signatures = event.params.signatures;
  proposal.calldatas = event.params.calldatas;
  proposal.creationBlock = event.block.number;
  proposal.creationTime = event.block.timestamp;
  proposal.startBlock = event.params.startBlock;
  proposal.endBlock = event.params.endBlock;

  // Get description from ipfs hash
  // Adapted from the official Aave Governance Subgraph
  // https://github.com/aave/governance-delegation-subgraph/blob/master/src/mapping/governance.ts#L33
  let description = "";
  let hash = Bytes.fromHexString(
    "1220" + event.params.ipfsHash.toHexString().slice(2)
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
  proposal.state =
    event.block.number >= proposal.startBlock
      ? ProposalState.ACTIVE
      : ProposalState.PENDING;
  proposal.governanceFramework = event.address.toHexString();
  proposal.save();

  // Increment gov proposal count
  const governance = getGovernance();
  governance.proposals = governance.proposals.plus(BIGINT_ONE);
  governance.save();
}

export function handleProposalExecuted(event: ProposalExecuted): void {
  // Update proposal status + execution metadata
  let proposal = getOrCreateProposal(event.params.id.toString());
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

export function handleProposalQueued(event: ProposalQueued): void {
  // Update proposal status + execution metadata
  let proposal = getOrCreateProposal(event.params.id.toString());
  proposal.state = ProposalState.QUEUED;
  // FIXME: check if block no. or block time
  proposal.executionETA = event.params.executionTime;
  proposal.save();

  // Update governance proposal state counts
  let governance = getGovernance();
  governance.proposalsQueued = governance.proposalsQueued.plus(BIGINT_ONE);
  governance.save();
}

function getLatestProposalValues(
  proposalId: string,
  contractAddress: Address,
  blockNumber: BigInt
): Proposal {
  let proposal = getOrCreateProposal(proposalId);

  // On first vote, set state and quorum values
  if (proposal.state == ProposalState.PENDING) {
    proposal.state = ProposalState.ACTIVE;

    // Get govStrat contract address
    let contract = AaveGovernanceV2.bind(contractAddress);
    let govStratAddress = contract.getGovernanceStrategy();
    // Get totalVotingSuppy from GovStrat contract
    let governanceStrategyContract = GovernanceStrategy.bind(govStratAddress);
    let totalVotingSupply = governanceStrategyContract.getTotalVotingSupplyAt(
      blockNumber.minus(BIGINT_ONE)
    );
    // Get minimum voting power from Executor contract
    let executorAddress = Address.fromString(proposal.executor);
    let executorContract = Executor.bind(executorAddress);
    proposal.quorumVotes =
      executorContract.getMinimumVotingPowerNeeded(totalVotingSupply);

    let governance = getGovernance();
    proposal.tokenHoldersAtStart = governance.currentTokenHolders;
    proposal.delegatesAtStart = governance.currentDelegates;
  }
  return proposal;
}
export function handleVoteEmitted(event: VoteEmitted): void {
  let proposal = getLatestProposalValues(
    event.params.id.toString(),
    event.address,
    event.block.number
  );
  let voterAddress = event.params.voter.toHexString();
  let choice = getVoteChoiceByValue(event.params.support);
  let weight = event.params.votingPower;
  let voteId = voterAddress.concat("-").concat(proposal.id);
  let vote = new Vote(voteId);
  vote.proposal = proposal.id;
  vote.voter = voterAddress;
  vote.weight = weight;
  vote.reason = null;
  vote.block = event.block.number;
  vote.blockTime = event.block.timestamp;
  // Retrieve enum string key by value (false = Against, true = For)
  vote.choice = choice;
  vote.save();

  // Increment respective vote choice counts
  if (choice === VoteChoice.FOR) {
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

// VotingDelayChanged (newVotingDelay, initiatorChange)
export function handleVotingDelayChanged(event: VotingDelayChanged): void {
  let governanceFramework = getGovernanceFramework(event.address.toHexString());
  governanceFramework.votingDelay = event.params.newVotingDelay;
  governanceFramework.save();
}

// Helper function that imports and binds the contract
function getGovernanceFramework(contractAddress: string): GovernanceFramework {
  let governanceFramework = GovernanceFramework.load(contractAddress);

  if (!governanceFramework) {
    governanceFramework = new GovernanceFramework(contractAddress);
    let contract = AaveGovernanceV2.bind(Address.fromString(contractAddress));
    governanceFramework.name = contract.NAME();
    governanceFramework.type = GOVERNANCE_NAME;
    governanceFramework.version = "1";

    governanceFramework.contractAddress = contractAddress;
    governanceFramework.tokenAddress = TOKEN_ADDRESS;
    governanceFramework.timelockAddress = SHORT_EXECUTOR_ADDRESS;

    // Init as zero, as govStrat / executor contracts are not deployed yet
    // values will be updated when proposal voting starts
    governanceFramework.votingPeriod = BIGINT_ZERO;
    governanceFramework.proposalThreshold = BIGINT_ZERO;
    governanceFramework.votingDelay = contract.getVotingDelay();
  }

  return governanceFramework;
}
