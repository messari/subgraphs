import { BigInt, log } from "@graphprotocol/graph-ts";
import { BIGINT_ONE, BIGINT_ZERO, ZERO_ADDRESS } from "./constants";
import {
  getGovernance,
  getOrCreateDelegate,
  getOrCreateTokenHolder,
  toDecimal,
} from "./handlers";
import { DelegationType } from "./constants";

export function _handleDelegateChanged(
  delegationType: i32,
  delegator: string,
  toDelegate: string
): void {
  if (delegationType == DelegationType.VOTING_POWER) {
    let tokenHolder = getOrCreateTokenHolder(delegator);
    let newDelegate = getOrCreateDelegate(toDelegate);

    // Get previous delegate from the tokenholder
    if (tokenHolder.delegate !== null) {
      let previousDelegate = getOrCreateDelegate(tokenHolder.delegate!); // ! needed for asm even though its typed as non-null
      previousDelegate.tokenHoldersRepresentedAmount =
        previousDelegate.tokenHoldersRepresentedAmount - 1;
      previousDelegate.save();
    }

    newDelegate.tokenHoldersRepresentedAmount =
      newDelegate.tokenHoldersRepresentedAmount + 1;
    newDelegate.save();

    // Update to new delegate
    tokenHolder.delegate = newDelegate.id;
    tokenHolder.save();
  }
}

export function _handleDelegatedPowerChanged(
  delegationType: i32,
  delegateAddress: string,
  newBalance: BigInt
): void {
  if (delegationType == DelegationType.VOTING_POWER) {
    let delegate = getOrCreateDelegate(delegateAddress);
    let previousBalance = delegate.delegatedVotesRaw;
    let votesDifference = newBalance.minus(previousBalance);

    delegate.delegatedVotesRaw = newBalance;
    delegate.delegatedVotes = toDecimal(newBalance);
    delegate.save();

    // Update governance delegate count
    let governance = getGovernance();
    if (previousBalance == BIGINT_ZERO && newBalance > BIGINT_ZERO) {
      governance.currentDelegates =
        governance.currentDelegates.plus(BIGINT_ONE);
    }
    if (newBalance == BIGINT_ZERO) {
      governance.currentDelegates =
        governance.currentDelegates.minus(BIGINT_ONE);
    }
    governance.delegatedVotesRaw =
      governance.delegatedVotesRaw.plus(votesDifference);
    governance.delegatedVotes = toDecimal(governance.delegatedVotesRaw);
    governance.save();
  }
}

export function _handleTransfer(from: string, to: string, value: BigInt): void {
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
