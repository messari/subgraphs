import { 
    BigInt, 
    BigDecimal, 
    Address, 
    log 
} from "@graphprotocol/graph-ts"

import { 
    MultiFeeDistribution,
    Staked,
    Withdrawn
} from "../../generated/GeistToken/MultiFeeDistribution"

import { 
    RewardPaid 
} from '../../generated/MultiFeeDistribution/MultiFeeDistribution'

import { 
    Token as TokenEntity,
    RewardToken as RewardTokenEntity,
    UsageMetricsDailySnapshot as UsageMetricsDailySnapshotEntity,
    FinancialsDailySnapshot as FinancialsDailySnapshotEntity,
} from "../../generated/schema"

import { 
    getOrInitializeFinancialSnapshot,
    getTokenAmountUSD,
} from './helpers';

import * as constants from "../common/constants"

import {
    TOKEN_ADDRESS_GEIST,
    REWARD_TOKEN_CONTRACT,
} from "../common/addresses"


export function handleRewardPaid(event: RewardPaid): void {
    // Rewards do not to TVL, but adds to volume and supply side revenue
    let tokenAmountUSD = getTokenAmountUSD(event.params.rewardsToken, event.params.reward);
  
    // This should use the gasUsed, not the gasLimit. But that is not available per transaction...
    let transactionFee = event.transaction.gasLimit.times(event.transaction.gasPrice)
  
    let financialsDailySnapshot: FinancialsDailySnapshotEntity = getOrInitializeFinancialSnapshot(
      event.block.timestamp,
      tokenAmountUSD,
      transactionFee,
      BigInt.fromI32(0),
      constants.REWARD_INTERACTION
    );
  
    financialsDailySnapshot.blockNumber = event.block.number;
    financialsDailySnapshot.save();
  }
  
export function handleStakeAdded(event: Staked): void {
    /* Staking is treated equivalent to depositing for the purposes of the snapshots */
    let tokenAmountUSD = getTokenAmountUSD(TOKEN_ADDRESS_GEIST, event.params.amount);
    let transactionFee = event.transaction.gasLimit.times(event.transaction.gasPrice)

    let financialsDailySnapshot: FinancialsDailySnapshotEntity = getOrInitializeFinancialSnapshot(
        event.block.timestamp,
        tokenAmountUSD,
        transactionFee,
        BigInt.fromI32(0),
        constants.STAKE_INTERACTION
    );

    financialsDailySnapshot.blockNumber = event.block.number;
    financialsDailySnapshot.save();
}

export function handleStakeWithdrawn(event: Withdrawn): void {
    /* Unstaking is treated equivalent to withdrawing for the purposes of the snapshots */
    let tokenAmountUSD = getTokenAmountUSD(TOKEN_ADDRESS_GEIST, event.params.amount);
    let transactionFee = event.transaction.gasLimit.times(event.transaction.gasPrice)

    let financialsDailySnapshot: FinancialsDailySnapshotEntity = getOrInitializeFinancialSnapshot(
        event.block.timestamp,
        tokenAmountUSD,
        transactionFee,
        BigInt.fromI32(0),
        constants.UNSTAKE_INTERACTION
    );

    financialsDailySnapshot.blockNumber = event.block.number;
    financialsDailySnapshot.save();
}
