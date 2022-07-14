import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { BIGINT_ONE, BIGINT_ZERO, ZERO_ADDRESS } from "./constants";
import {
  getGovernance,
  getOrCreateDelegate,
  getOrCreateTokenHolder,
  toDecimal,
} from "./handlers";

export function _handleDelegateChanged(
  params: { delegator: Address; fromDelegate: Address; toDelegate: Address },
  event: ethereum.Event
): void {
  let tokenHolder = getOrCreateTokenHolder(params.delegator.toHexString());
  let previousDelegate = getOrCreateDelegate(params.fromDelegate.toHexString());
  let newDelegate = getOrCreateDelegate(params.toDelegate.toHexString());

  tokenHolder.delegate = newDelegate.id;
  tokenHolder.save();

  previousDelegate.tokenHoldersRepresentedAmount =
    previousDelegate.tokenHoldersRepresentedAmount - 1;
  previousDelegate.save();

  newDelegate.tokenHoldersRepresentedAmount =
    newDelegate.tokenHoldersRepresentedAmount + 1;
  newDelegate.save();
}

export function _handleDelegateVotesChanged(
  params: { delegate: Address; previousBalance: BigInt; newBalance: BigInt },
  event: ethereum.Event
): void {
  const delegateAddress = params.delegate;
  const previousBalance = params.previousBalance;
  const newBalance = params.newBalance;

  let votesDifference = newBalance.minus(previousBalance);

  let delegate = getOrCreateDelegate(delegateAddress.toHexString());
  delegate.delegatedVotesRaw = newBalance;
  delegate.delegatedVotes = toDecimal(newBalance);
  delegate.save();

  // Update governance delegate count
  let governance = getGovernance();
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

export function _handleTransfer(
  params: { from: Address; to: Address; value: BigInt },
  event: ethereum.Event
): void {
  const from = params.from.toHexString();
  const to = params.to.toHexString();
  const value = params.value;

  let fromHolder = getOrCreateTokenHolder(from);
  let toHolder = getOrCreateTokenHolder(to);
  let governance = getGovernance();

  // Deduct from from holder balance + decrement gov token holders
  // if holder now owns 0 or increment gov token holders if new holder
  if (from != ZERO_ADDRESS) {
    let fromHolderPreviousBalance = fromHolder.tokenBalanceRaw;
    fromHolder.tokenBalanceRaw = fromHolder.tokenBalanceRaw.minus(value);
    fromHolder.tokenBalance = toDecimal(fromHolder.tokenBalanceRaw);

    if (fromHolder.tokenBalanceRaw < BIGINT_ZERO) {
      log.error("Negative balance on holder {} with balance {}", [
        fromHolder.id,
        fromHolder.tokenBalanceRaw.toString(),
      ]);
    }

    if (
      fromHolder.tokenBalanceRaw == BIGINT_ZERO &&
      fromHolderPreviousBalance > BIGINT_ZERO
    ) {
      governance.currentTokenHolders =
        governance.currentTokenHolders.minus(BIGINT_ONE);
      governance.save();
    } else if (
      fromHolder.tokenBalanceRaw > BIGINT_ZERO &&
      fromHolderPreviousBalance == BIGINT_ZERO
    ) {
      governance.currentTokenHolders =
        governance.currentTokenHolders.plus(BIGINT_ONE);
      governance.save();
    }

    fromHolder.save();
  }

  // Increment to holder balance and total tokens ever held
  let toHolderPreviousBalance = toHolder.tokenBalanceRaw;
  toHolder.tokenBalanceRaw = toHolder.tokenBalanceRaw.plus(value);
  toHolder.tokenBalance = toDecimal(toHolder.tokenBalanceRaw);
  toHolder.totalTokensHeldRaw = toHolder.totalTokensHeldRaw.plus(value);
  toHolder.totalTokensHeld = toDecimal(toHolder.totalTokensHeldRaw);

  if (
    toHolder.tokenBalanceRaw == BIGINT_ZERO &&
    toHolderPreviousBalance > BIGINT_ZERO
  ) {
    governance.currentTokenHolders =
      governance.currentTokenHolders.minus(BIGINT_ONE);
    governance.save();
  } else if (
    toHolder.tokenBalanceRaw > BIGINT_ZERO &&
    toHolderPreviousBalance == BIGINT_ZERO
  ) {
    governance.currentTokenHolders =
      governance.currentTokenHolders.plus(BIGINT_ONE);
    governance.save();
  }
  toHolder.save();
}
