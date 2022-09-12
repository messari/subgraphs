import { BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { BIGINT_ONE, BIGINT_ZERO, ZERO_ADDRESS } from "./constants";
import {
  getGovernance,
  getOrCreateDelegate,
  getOrCreateTokenDailySnapshot,
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
  newBalance: BigInt,
  isStakedToken: boolean
): void {
  if (delegationType == DelegationType.VOTING_POWER) {
    let governance = getGovernance();
    let delegate = getOrCreateDelegate(delegateAddress);

    // Update delegate and vote counts based on token / staked token
    if (!isStakedToken) {
      let previousBalance = delegate.delegatedVotesRaw;
      let votesDifference = newBalance.minus(previousBalance);
      delegate.delegatedVotesRaw = newBalance;
      delegate.delegatedVotes = toDecimal(newBalance);

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
    } else {
      let previousBalance = delegate.delegatedStakedTokenVotesRaw;
      let votesDifference = newBalance.minus(previousBalance);
      delegate.delegatedStakedTokenVotesRaw = newBalance;
      delegate.delegatedStakedTokenVotes = toDecimal(newBalance);

      if (previousBalance == BIGINT_ZERO && newBalance > BIGINT_ZERO) {
        governance.currentStakedTokenDelegates =
          governance.currentStakedTokenDelegates.plus(BIGINT_ONE);
      }
      if (newBalance == BIGINT_ZERO) {
        governance.currentStakedTokenDelegates =
          governance.currentStakedTokenDelegates.minus(BIGINT_ONE);
      }
      governance.delegatedStakedTokenVotesRaw =
        governance.delegatedStakedTokenVotesRaw.plus(votesDifference);
      governance.delegatedStakedTokenVotes = toDecimal(
        governance.delegatedStakedTokenVotesRaw
      );
    }

    delegate.save();
    governance.save();
  }
}

export function _handleTransfer(
  from: string,
  to: string,
  value: BigInt,
  event: ethereum.Event
): void {
  let fromHolder = getOrCreateTokenHolder(from);
  let toHolder = getOrCreateTokenHolder(to);
  let governance = getGovernance();

  let isBurn = to == ZERO_ADDRESS;
  let isMint = from == ZERO_ADDRESS;

  if (!isMint) {
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
      fromHolderPreviousBalance > BIGINT_ZERO &&
      fromHolder.tokenBalanceRaw == BIGINT_ZERO
    ) {
      governance.currentTokenHolders =
        governance.currentTokenHolders.minus(BIGINT_ONE);
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
    toHolderPreviousBalance == BIGINT_ZERO &&
    toHolder.tokenBalanceRaw > BIGINT_ZERO
  ) {
    governance.currentTokenHolders =
      governance.currentTokenHolders.plus(BIGINT_ONE);
    governance.save();
  }
  toHolder.save();

  // Adjust token total supply if it changes
  if (isMint) {
    governance.totalTokenSupply = governance.totalTokenSupply.plus(value);
    governance.save();
  } else if (isBurn) {
    governance.totalTokenSupply = governance.totalTokenSupply.minus(value);
    governance.save();
  }

  // Take snapshot
  let dailySnapshot = getOrCreateTokenDailySnapshot(event.block);
  dailySnapshot.totalSupply = governance.totalTokenSupply;
  dailySnapshot.tokenHolders = governance.currentTokenHolders;
  dailySnapshot.stakedTokenHolders = governance.currentStakedTokenHolders;
  dailySnapshot.delegates = governance.currentDelegates;
  dailySnapshot.stakedTokenDelegates = governance.currentStakedTokenDelegates;
  dailySnapshot.blockNumber = event.block.number;
  dailySnapshot.timestamp = event.block.timestamp;
  dailySnapshot.save();
}

export function _handleStakedTokenTransfer(
  from: string,
  to: string,
  value: BigInt,
  event: ethereum.Event
): void {
  let fromHolder = getOrCreateTokenHolder(from);
  let toHolder = getOrCreateTokenHolder(to);
  let governance = getGovernance();

  let isBurn = to == ZERO_ADDRESS;
  let isMint = from == ZERO_ADDRESS;

  if (!isMint) {
    let fromHolderPreviousBalance = fromHolder.stakedTokenBalanceRaw;
    fromHolder.stakedTokenBalanceRaw =
      fromHolder.stakedTokenBalanceRaw.minus(value);
    fromHolder.stakedTokenBalance = toDecimal(fromHolder.stakedTokenBalanceRaw);

    if (fromHolder.stakedTokenBalanceRaw < BIGINT_ZERO) {
      log.error("Negative balance on holder {} with balance {}", [
        fromHolder.id,
        fromHolder.stakedTokenBalanceRaw.toString(),
      ]);
    }

    if (
      fromHolderPreviousBalance > BIGINT_ZERO &&
      fromHolder.stakedTokenBalanceRaw == BIGINT_ZERO
    ) {
      governance.currentStakedTokenHolders =
        governance.currentStakedTokenHolders.minus(BIGINT_ONE);
      governance.save();
    }
    fromHolder.save();
  }

  // Increment to holder balance and total tokens ever held
  let toHolderPreviousBalance = toHolder.stakedTokenBalanceRaw;
  toHolder.stakedTokenBalanceRaw = toHolder.stakedTokenBalanceRaw.plus(value);
  toHolder.stakedTokenBalance = toDecimal(toHolder.stakedTokenBalanceRaw);
  toHolder.totalStakedTokensHeldRaw =
    toHolder.totalStakedTokensHeldRaw.plus(value);
  toHolder.totalStakedTokensHeld = toDecimal(toHolder.totalStakedTokensHeldRaw);

  if (
    toHolderPreviousBalance == BIGINT_ZERO &&
    toHolder.stakedTokenBalanceRaw > BIGINT_ZERO
  ) {
    governance.currentStakedTokenHolders =
      governance.currentStakedTokenHolders.plus(BIGINT_ONE);
    governance.save();
  }
  toHolder.save();

  // Adjust token total supply if it changes
  if (isMint) {
    governance.totalStakedTokenSupply =
      governance.totalStakedTokenSupply.plus(value);
    governance.save();
  } else if (isBurn) {
    governance.totalStakedTokenSupply =
      governance.totalStakedTokenSupply.minus(value);
    governance.save();
  }

  // Take snapshot
  let dailySnapshot = getOrCreateTokenDailySnapshot(event.block);
  dailySnapshot.totalSupply = governance.totalTokenSupply;
  dailySnapshot.tokenHolders = governance.currentTokenHolders;
  dailySnapshot.stakedTokenHolders = governance.currentStakedTokenHolders;
  dailySnapshot.delegates = governance.currentDelegates;
  dailySnapshot.stakedTokenDelegates = governance.currentStakedTokenDelegates;
  dailySnapshot.blockNumber = event.block.number;
  dailySnapshot.timestamp = event.block.timestamp;
  dailySnapshot.save();
}
