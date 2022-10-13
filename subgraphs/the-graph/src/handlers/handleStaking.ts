import {
  DelegationParametersUpdated,
  RebateClaimed,
  StakeDelegated,
  StakeDelegatedLocked,
  StakeDelegatedWithdrawn,
  StakeDeposited,
  StakeLocked,
  StakeSlashed,
  StakeWithdrawn,
} from "../../generated/Staking/Staking";
import { BIGINT_NEG_ONE } from "../common/constants";
import { getOrCreateIndexer } from "../common/getters";
import {
  updateTVL,
  updateUsageMetrics,
  updateSupplySideRewards,
} from "../common/updateMetrics";

/*
 * Contracts
 * https://github.com/graphprotocol/contracts/blob/dev/contracts/staking/Staking.sol
 */

// Indexer staking events
/**
  * @dev Emitted when `indexer` stake `tokens` amount.
  
  event.params.indexer;
  event.params.tokens;
*/
export function handleStakeDeposited(event: StakeDeposited): void {
  updateTVL(event, event.params.tokens);
  updateUsageMetrics(event, event.params.indexer);
}

/**
  * @dev Emitted when `indexer` unstaked and locked `tokens` amount `until` block.
     
  event.params.indexer;
  event.params.tokens;
  event.params.until;
*/

// This is an intermediary process before the stake gets withdrawn.
// The stake is locked until the withdraw is able to be completed.
// Currently the locking period is 28 days.
export function handleStakeLocked(event: StakeLocked): void {
  updateUsageMetrics(event, event.params.indexer);
}

/**
  * @dev Emitted when `indexer` withdrew `tokens` staked.
  
  event.params.indexer;
  event.params.tokens;
*/
export function handleStakeWithdrawn(event: StakeWithdrawn): void {
  updateTVL(event, event.params.tokens.times(BIGINT_NEG_ONE));
  updateUsageMetrics(event, event.params.indexer);
}

/**
  * @dev Emitted when `indexer` was slashed for a total of `tokens` amount.
  * Tracks `reward` amount of tokens given to `beneficiary`.
  
  event.params.beneficiary;
  event.params.indexer;
  event.params.reward;
  event.params.tokens;
*/
export function handleStakeSlashed(event: StakeSlashed): void {
  // These tokens get burned. Its a 50/50 split to benefirciary and burn.

  updateTVL(event, event.params.tokens.times(BIGINT_NEG_ONE));
  updateSupplySideRewards(event, event.params.reward);
  updateUsageMetrics(event, event.params.beneficiary);
}

// Delegator staking events
/**
  * @dev Emitted when `delegator` delegated `tokens` to the `indexer`, the delegator
  * gets `shares` for the delegation pool proportionally to the tokens staked.
     
  event.params.delegator;
  event.params.indexer;
  event.params.shares;
  event.params.tokens;
*/
export function handleStakeDelegated(event: StakeDelegated): void {
  const indexer = getOrCreateIndexer(event, event.params.indexer);
  indexer.delegatedTokens = indexer.delegatedTokens.plus(event.params.tokens);
  indexer.save();

  updateTVL(event, event.params.tokens);
  updateUsageMetrics(event, event.params.delegator);
}

/**
  * @dev Emitted when `delegator` undelegated `tokens` from `indexer`.
  * Tokens get locked for withdrawal after a period of time.
  
  event.params.delegator;
  event.params.indexer;
  event.params.shares;
  event.params.tokens;
  event.params.until;
*/

// Process of undelegating.
export function handleStakeDelegatedLocked(event: StakeDelegatedLocked): void {
  const indexer = getOrCreateIndexer(event, event.params.indexer);
  indexer.delegatedTokens = indexer.delegatedTokens.minus(event.params.tokens);
  indexer.save();

  // updateTVL(event, event.params.tokens)
  updateUsageMetrics(event, event.params.delegator);
}

/**
  * @dev Emitted when `delegator` withdrew delegated `tokens` from `indexer`.
  
  event.params.delegator;
  event.params.indexer;
  event.params.tokens;
*/
export function handleStakeDelegatedWithdrawn(
  event: StakeDelegatedWithdrawn
): void {
  updateTVL(event, event.params.tokens.times(BIGINT_NEG_ONE));
  updateUsageMetrics(event, event.params.delegator);
}

/**
  * @dev Emitted when `indexer` update the delegation parameters for its delegation pool.

  event.params.cooldownBlocks
  event.params.indexer
  event.params.indexingRewardCut
  event.params.queryFeeCut
*/
export function handleDelegationParametersUpdated(
  event: DelegationParametersUpdated
): void {
  const indexer = getOrCreateIndexer(event, event.params.indexer);
  indexer.indexingRewardCut = event.params.indexingRewardCut;
  indexer.queryFeeCut = event.params.queryFeeCut;
  indexer.cooldownBlocks = event.params.cooldownBlocks;
  indexer.save();

  updateUsageMetrics(event, event.params.indexer);
}

/**
  * @dev Emitted when `indexer` claimed a rebate on `subgraphDeploymentID` during `epoch`
  * related to the `forEpoch` rebate pool.
  * The rebate is for `tokens` amount and `unclaimedAllocationsCount` are left for claim
  * in the rebate pool. `delegationFees` collected and sent to delegation pool.
  
  event.params.allocationID
  event.params.delegationFees
  event.params.epoch
  event.params.forEpoch
  event.params.indexer
  event.params.subgraphDeploymentID
  event.params.tokens
  event.params.unclaimedAllocationsCount
*/
export function handleRebateClaimed(event: RebateClaimed): void {
  updateTVL(event, event.params.delegationFees);
  updateSupplySideRewards(
    event,
    event.params.tokens.plus(event.params.delegationFees)
  );
  updateUsageMetrics(event, event.params.indexer);
}
