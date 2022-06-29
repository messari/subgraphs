import { log } from "@graphprotocol/graph-ts";
import {
  DelegateChanged as DelegateChangedEvent,
  DelegateVotesChanged as DelegateVotesChangedEvent,
  Transfer as TransferEvent,
} from "../generated/Tribe/Tribe";
import {
  getOrCreateTokenHolder,
  getOrCreateDelegate,
  BIGINT_ONE,
  BIGINT_ZERO,
  getGovernance,
  toDecimal,
  ZERO_ADDRESS,
} from "./helper";

// DelegateChanged(indexed address,indexed address,indexed address)
export function handleDelegateChanged(event: DelegateChangedEvent): void {
  let tokenHolder = getOrCreateTokenHolder(
    event.params.delegator.toHexString()
  );
  let previousDelegate = getOrCreateDelegate(
    event.params.fromDelegate.toHexString()
  );
  let newDelegate = getOrCreateDelegate(event.params.toDelegate.toHexString());

  tokenHolder.delegate = newDelegate.id;
  tokenHolder.save();

  previousDelegate.tokenHoldersRepresentedAmount =
    previousDelegate.tokenHoldersRepresentedAmount - 1;
  previousDelegate.save();

  newDelegate.tokenHoldersRepresentedAmount =
    newDelegate.tokenHoldersRepresentedAmount + 1;
  newDelegate.save();
}

// DelegateVotesChanged(indexed address,uint256,uint256)
// Called in succession to the above DelegateChanged event
export function handleDelegateVotesChanged(
  event: DelegateVotesChangedEvent
): void {
  const delegateAddress = event.params.delegate;
  const previousBalance = event.params.previousBalance;
  const newBalance = event.params.newBalance;

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
  governance.delegatedVotesRaw = governance.delegatedVotesRaw.plus(
    votesDifference
  );
  governance.delegatedVotes = toDecimal(governance.delegatedVotesRaw);
  governance.save();
}

// Transfer(indexed address,indexed address,uint256)
export function handleTransfer(event: TransferEvent): void {
  const from = event.params.from.toHexString();
  const to = event.params.to.toHexString();
  const value = event.params.amount; // NOTE: OZ -- This is different than the OZ contract (event.params.value in OZ)

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
      governance.currentTokenHolders = governance.currentTokenHolders.minus(
        BIGINT_ONE
      );
      governance.save();
    } else if (
      fromHolder.tokenBalanceRaw > BIGINT_ZERO &&
      fromHolderPreviousBalance == BIGINT_ZERO
    ) {
      governance.currentTokenHolders = governance.currentTokenHolders.plus(
        BIGINT_ONE
      );
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
    governance.currentTokenHolders = governance.currentTokenHolders.minus(
      BIGINT_ONE
    );
    governance.save();
  } else if (
    toHolder.tokenBalanceRaw > BIGINT_ZERO &&
    toHolderPreviousBalance == BIGINT_ZERO
  ) {
    governance.currentTokenHolders = governance.currentTokenHolders.plus(
      BIGINT_ONE
    );
    governance.save();
  }
  toHolder.save();
}
