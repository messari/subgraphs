import { ethereum, BigInt } from "@graphprotocol/graph-ts";
import {
  DelegateChanged,
  DelegateVotesChanged,
  Transfer,
} from "../../../generated/GovernanceToken/GovernanceToken";
import {
  DelegateChange,
  DelegateVotingPowerChange,
} from "../../../generated/schema";
import { BIGINT_ONE, BIGINT_ZERO } from "../../../src/constants";
import {
  getGovernance,
  getOrCreateDelegate,
  getOrCreateTokenHolder,
  toDecimal,
} from "../../../src/handlers";
import { _handleTransfer } from "../../../src/tokenHandlers";

// DelegateChanged(indexed address,indexed address,indexed address)
export function handleDelegateChanged(event: DelegateChanged): void {
  // NOTE: We are using a copy/paste of the common _handleDelegateChanged function here
  // because we want to override the delegateChangeId to include the block number.
  // This is due to Optimism having multiple blocks with the same block timestamp
  _handleDelegateChanged(
    event.params.delegator.toHexString(),
    event.params.fromDelegate.toHexString(),
    event.params.toDelegate.toHexString(),
    event
  );
}

// DelegateVotesChanged(indexed address,uint256,uint256)
// Called in succession to the above DelegateChanged event
export function handleDelegateVotesChanged(event: DelegateVotesChanged): void {
  // NOTE: We are using a copy/paste of the common _handleDelegateVotesChanged function here
  // because we want to override the delegateVotingPwerChangeId to include the block number.
  // This is due to Optimism having multiple blocks with the same block timestamp
  _handleDelegateVotesChanged(
    event.params.delegate.toHexString(),
    event.params.previousBalance,
    event.params.newBalance,
    event
  );
}

// ================= Extracted from subgraphs/openzeppelin-governor/src/tokenHandlers.ts =================
function _handleDelegateChanged(
  delegator: string,
  fromDelegate: string,
  toDelegate: string,
  event: ethereum.Event
): void {
  const tokenHolder = getOrCreateTokenHolder(delegator);
  const previousDelegate = getOrCreateDelegate(fromDelegate);
  const newDelegate = getOrCreateDelegate(toDelegate);

  tokenHolder.delegate = newDelegate.id;
  tokenHolder.save();

  previousDelegate.tokenHoldersRepresentedAmount =
    previousDelegate.tokenHoldersRepresentedAmount - 1;
  previousDelegate.save();

  newDelegate.tokenHoldersRepresentedAmount =
    newDelegate.tokenHoldersRepresentedAmount + 1;
  newDelegate.save();

  const delegateChanged = createDelegateChange(
    event,
    toDelegate,
    fromDelegate,
    delegator
  );

  delegateChanged.save();
}

function _handleDelegateVotesChanged(
  delegateAddress: string,
  previousBalance: BigInt,
  newBalance: BigInt,
  event: ethereum.Event
): void {
  const votesDifference = newBalance.minus(previousBalance);

  const delegate = getOrCreateDelegate(delegateAddress);
  delegate.delegatedVotesRaw = newBalance;
  delegate.delegatedVotes = toDecimal(newBalance);
  delegate.save();

  // Create DelegateVotingPowerChange
  const delegateVPChange = createDelegateVotingPowerChange(
    event,
    previousBalance,
    newBalance,
    delegateAddress
  );
  delegateVPChange.save();

  // Update governance delegate count
  const governance = getGovernance();
  if (previousBalance == BIGINT_ZERO && newBalance > BIGINT_ZERO) {
    governance.currentDelegates = governance.currentDelegates.plus(BIGINT_ONE);
  }
  if (newBalance == BIGINT_ZERO) {
    governance.currentDelegates = governance.currentDelegates.minus(BIGINT_ONE);
  }
  governance.delegatedVotesRaw =
    governance.delegatedVotesRaw.plus(votesDifference);
  governance.delegatedVotes = toDecimal(governance.delegatedVotesRaw);
  governance.save();
}

// ================= Extracted from subgraphs/openzeppelin-governor/src/handlers.ts =================
function createDelegateChange(
  event: ethereum.Event,
  toDelegate: string,
  fromDelegate: string,
  delegator: string
): DelegateChange {
  // THIS SINGLE LINE IS THE ONLY DIFFERENCE FROM THE ORIGINAL FUNCTION
  // We are adding the block number to the id to avoid duplicate ids when there are multiple blocks
  // with the same timestamp
  const delegateChangeId = `${event.block.timestamp.toI64()}-${
    event.block.number
  }-${event.logIndex}`;

  const delegateChange = new DelegateChange(delegateChangeId);

  delegateChange.delegate = toDelegate;
  delegateChange.delegator = delegator;
  delegateChange.previousDelegate = fromDelegate;
  delegateChange.tokenAddress = event.address.toHexString();
  delegateChange.txnHash = event.transaction.hash.toHexString();
  delegateChange.blockNumber = event.block.number;
  delegateChange.blockTimestamp = event.block.timestamp;
  delegateChange.logIndex = event.logIndex;

  return delegateChange;
}

function createDelegateVotingPowerChange(
  event: ethereum.Event,
  previousBalance: BigInt,
  newBalance: BigInt,
  delegate: string
): DelegateVotingPowerChange {
  // THIS SINGLE LINE IS THE ONLY DIFFERENCE FROM THE ORIGINAL FUNCTION
  // We are adding the block number to the id to avoid duplicate ids when there are multiple blocks
  // with the same timestamp
  const delegateVotingPwerChangeId = `${event.block.timestamp.toI64()}-${
    event.block.number
  }-${event.logIndex}`;

  const delegateVPChange = new DelegateVotingPowerChange(
    delegateVotingPwerChangeId
  );

  delegateVPChange.previousBalance = previousBalance;
  delegateVPChange.newBalance = newBalance;
  delegateVPChange.delegate = delegate;
  delegateVPChange.tokenAddress = event.address.toHexString();
  delegateVPChange.txnHash = event.transaction.hash.toHexString();
  delegateVPChange.blockTimestamp = event.block.timestamp;
  delegateVPChange.logIndex = event.logIndex;
  delegateVPChange.blockNumber = event.block.number;

  return delegateVPChange;
}

// Transfer(indexed address,indexed address,uint256)
export function handleTransfer(event: Transfer): void {
  _handleTransfer(
    event.params.from.toHexString(),
    event.params.to.toHexString(),
    event.params.value,
    event
  );
}
