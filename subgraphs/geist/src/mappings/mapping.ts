import { 
  BigInt, 
  BigDecimal, 
  Address, 
  log 
} from "@graphprotocol/graph-ts"

import { 
  Approval,
} from "../../generated/GeistToken/GeistToken"

import { 
  MultiFeeDistribution,
  Staked,
  Withdrawn
} from "../../generated/GeistToken/MultiFeeDistribution"

import { 
  AddressesProviderRegistered,
} from "../../generated/LendingPoolAddressesProviderRegistry/LendingPoolAddressesProviderRegistry"

import {
  LendingPool,
  LendingPoolAddressesProvider
} from '../../generated/templates'

import { 
  ProxyCreated,
} from "../../generated/templates/LendingPoolAddressesProvider/LendingPoolAddressesProvider"

import {
  Deposit,
  Borrow,
  Withdraw,
  Repay
} from '../../generated/templates/LendingPool/LendingPool'

import { 
  RewardPaid 
} from '../../generated/MultiFeeDistribution/MultiFeeDistribution'

import { 
  Token as TokenEntity,
  RewardToken as RewardTokenEntity,
  UsageMetricsDailySnapshot as UsageMetricsDailySnapshotEntity,
  FinancialsDailySnapshot as FinancialsDailySnapshotEntity,
  LendingProtocol as LendingProtocolEntity,
  Market as MarketEntity,
  Deposit as DepositEntity,
  Withdraw as WithdrawEntity,
  Borrow as BorrowEntity,
  Repay as RepayEntity
} from "../../generated/schema"

import * as constants from "../common/constants"

import {
  TOKEN_ADDRESS_GEIST,
  REWARD_TOKEN_CONTRACT,
} from "../common/addresses"

import { 
  initializeToken, 
  initializeRewardToken,
  getUsageMetrics,
  getFinancialSnapshot,
  initializeLendingProtocol,
  getTokenAmountUSD
} from './helpers';

import { 
  getTimestampInMillis 
} from "../common/utils"


// Definitions
// totalValueLockedUSD = staking + deposits
// totalVolumeUSD = deposit + staking + repay + withdraw
// supplySideRevenueUSD = rewards paid to depositors
// protocolSideRevenueUSD = fees

export function handleAddressesProviderRegistered(event: AddressesProviderRegistered): void {
  initializeLendingProtocol()

  let address = event.params.newAddress.toHexString()
  LendingPoolAddressesProvider.create(Address.fromString(address))
}

export function handleProxyCreated(event: ProxyCreated): void {
  log.warning('Proxy created', [])

  let newProxyAddress = event.params.newAddress
  let contactId = event.params.id.toString()

  if (contactId == 'LENDING_POOL') {
    LendingPool.create(newProxyAddress)
  }
}

export function handleApproval(event: Approval): void {
  // Add main token into Token store
  initializeToken(TOKEN_ADDRESS_GEIST);

  // Use the Reward Token contract to pull all the reward token addresses
  let rewardTokenContract = MultiFeeDistribution.bind(REWARD_TOKEN_CONTRACT);

  // The loop ends at 256 because we are presuming there will not be more tokens than that
  // Note that the full loop will never execute in practise as it breaks when it hits a revert
  for (let i = 0; i < 256; i++) {
    // Query the reward token from number 
    let result = rewardTokenContract.try_rewardTokens(BigInt.fromI32(i));

    if (result.reverted) {
      // Break loop when hitting an invalid value of `i`
      break;
    }
    // Add rewardToken into RewardToken store
    initializeRewardToken(result.value, "DEPOSIT");
  }
}

export function handleDeposit(event: Deposit): void {
  log.warning('Deposit event', [])

  let asset = initializeToken(event.params.reserve);
  let tokenAmountUSD = getTokenAmountUSD(event.params.reserve, event.params.amount);
  // This should use the gasUsed, not the gasLimit. But that is not available per transaction...
  let transactionFee = event.transaction.gasLimit.times(event.transaction.gasPrice)
  let tx = event.transaction
  let id = "deposit-" + tx.hash.toHexString() + "-" + tx.index.toI32().toString()
  
  let deposit = DepositEntity.load(id)
  if (deposit == null) {
    deposit = new DepositEntity(id)
    deposit.logIndex = tx.index.toI32()
    if (tx.to) {
      deposit.to = (tx.to as Address).toHexString()
    }
    deposit.from = tx.from.toHexString()
    deposit.hash = tx.hash.toHexString()
    deposit.timestamp = getTimestampInMillis(event.block);
    deposit.blockNumber = event.block.number;
    deposit.protocol = constants.PROTOCOL_ID
    deposit.asset = asset.id
    deposit.amount = event.params.amount
    deposit.amountUSD = tokenAmountUSD
    deposit.save()
  }

  // Generate data for the UsageMetricsDailySnapshot Entity
  let usageMetrics: UsageMetricsDailySnapshotEntity = 
        getUsageMetrics(event.block.number, event.block.timestamp, event.transaction.from);

  usageMetrics.save()

  // Depositing adds to TVL and volume
  let financialsDailySnapshot: FinancialsDailySnapshotEntity = getFinancialSnapshot(
    event.block.timestamp,
    tokenAmountUSD,
    transactionFee,
    BigInt.fromI32(0),
    constants.DEPOSIT_INTERACTION,
  ); 
  financialsDailySnapshot.protocol = constants.PROTOCOL_ID;
  financialsDailySnapshot.timestamp = event.block.timestamp;
  financialsDailySnapshot.blockNumber = event.block.number;

  financialsDailySnapshot.save()
}

export function handleBorrow(event: Borrow): void {
  log.warning('Borrow event', [])

  let asset = initializeToken(event.params.reserve);
  let tokenAmountUSD = getTokenAmountUSD(event.params.reserve, event.params.amount);
  let tx = event.transaction
  let id = "borrow-" + tx.hash.toHexString() + "-" + tx.index.toI32().toString()
  // This should use the gasUsed, not the gasLimit. But that is not available per transaction...
  let transactionFee = event.transaction.gasLimit.times(event.transaction.gasPrice)

  let borrow = BorrowEntity.load(id)
  if (!borrow) {
    borrow = new BorrowEntity(id)
    borrow.logIndex = tx.index.toI32()
    if (tx.to) {
      borrow.to = (tx.to as Address).toHexString()
    }
    borrow.from = tx.from.toHexString()
    borrow.hash = tx.hash.toHexString()
    borrow.timestamp = getTimestampInMillis(event.block);
    borrow.blockNumber = event.block.number;
    borrow.protocol = constants.PROTOCOL_ID
    borrow.asset = asset.id
    borrow.amount = event.params.amount
    borrow.amountUSD = tokenAmountUSD
    borrow.save()
  }

  // Generate data for the UsageMetricsDailySnapshot Entity
  let usageMetrics: UsageMetricsDailySnapshotEntity = 
        getUsageMetrics(event.block.number, event.block.timestamp, event.transaction.from);

  usageMetrics.save()

  // Depositing adds to TVL and volume
  let financialsDailySnapshot: FinancialsDailySnapshotEntity = getFinancialSnapshot(
    event.block.timestamp,
    tokenAmountUSD,
    transactionFee,
    event.params.borrowRateMode,
    constants.BORROW_INTERACTION,
  ); 
  financialsDailySnapshot.protocol = constants.PROTOCOL_ID;
  financialsDailySnapshot.timestamp = event.block.timestamp;
  financialsDailySnapshot.blockNumber = event.block.number;

  financialsDailySnapshot.save()
}

export function handleWithdraw(event: Withdraw): void{
  log.warning('Withdraw event', [])

  let asset = initializeToken(event.params.reserve);
  let tokenAmountUSD = getTokenAmountUSD(event.params.reserve, event.params.amount);

  let tx = event.transaction
  let id = "withdraw-" + tx.hash.toHexString() + "-" + tx.index.toI32().toString()
  let withdraw = WithdrawEntity.load(id)
  if (!withdraw) {
    withdraw = new WithdrawEntity(id)
    withdraw.logIndex = tx.index.toI32()
    if (tx.to) {
      withdraw.to = (tx.to as Address).toHexString()
    }
    withdraw.from = tx.from.toHexString()
    withdraw.hash = tx.hash.toHexString()
    withdraw.timestamp = getTimestampInMillis(event.block);
    withdraw.blockNumber = event.block.number;
    withdraw.protocol = constants.PROTOCOL_ID
    withdraw.asset = asset.id
    withdraw.amount = event.params.amount
    withdraw.amountUSD = tokenAmountUSD
    withdraw.save()
  }

  // Generate data for the UsageMetricsDailySnapshot Entity
  let usageMetrics: UsageMetricsDailySnapshotEntity = 
        getUsageMetrics(event.block.number, event.block.timestamp, event.transaction.from);

  usageMetrics.save()

  // This should use the gasUsed, not the gasLimit. But that is not available per transaction...
  let transactionFee = event.transaction.gasLimit.times(event.transaction.gasPrice)

  // Depositing adds to TVL and volume
  let financialsDailySnapshot: FinancialsDailySnapshotEntity = getFinancialSnapshot(
    event.block.timestamp,
    tokenAmountUSD,
    transactionFee,
    BigInt.fromI32(0),
    constants.WITHDRAW_INTERACTION,
  );
  financialsDailySnapshot.protocol = constants.PROTOCOL_ID;
  financialsDailySnapshot.timestamp = event.block.timestamp;
  financialsDailySnapshot.blockNumber = event.block.number;

  financialsDailySnapshot.save()
}

export function handleRepay(event: Repay): void {
  log.warning('Repay event', [])

  let asset = initializeToken(event.params.reserve);
  let tokenAmountUSD = getTokenAmountUSD(event.params.reserve, event.params.amount);

  let tx = event.transaction
  let id = "repay-" + tx.hash.toHexString() + "-" + tx.index.toI32().toString()
  let repay = RepayEntity.load(id)
  if (!repay) {
    repay = new RepayEntity(id)
    repay.logIndex = tx.index.toI32()
    if (tx.to) {
      repay.to = (tx.to as Address).toHexString()
    }
    repay.from = tx.from.toHexString()
    repay.hash = tx.hash.toHexString()
    repay.timestamp = getTimestampInMillis(event.block);
    repay.blockNumber = event.block.number;
    repay.protocol = constants.PROTOCOL_ID
    repay.asset = asset.id
    repay.amount = event.params.amount
    repay.amountUSD = tokenAmountUSD
    repay.save()
  }

  // Generate data for the UsageMetricsDailySnapshot Entity
  let usageMetrics: UsageMetricsDailySnapshotEntity = 
        getUsageMetrics(event.block.number, event.block.timestamp, event.transaction.from);

  usageMetrics.save()

  // This should use the gasUsed, not the gasLimit. But that is not available per transaction...
  let transactionFee = event.transaction.gasLimit.times(event.transaction.gasPrice)

  // Depositing adds to TVL and volume
  let financialsDailySnapshot: FinancialsDailySnapshotEntity = getFinancialSnapshot(
    event.block.timestamp,
    tokenAmountUSD,
    transactionFee,
    BigInt.fromI32(0),
    constants.REPAY_INTERACTION,
  );
  financialsDailySnapshot.protocol = constants.PROTOCOL_ID;
  financialsDailySnapshot.timestamp = event.block.timestamp;
  financialsDailySnapshot.blockNumber = event.block.number;

  financialsDailySnapshot.save()
}

export function handleRewardPaid(event: RewardPaid): void {
  // Rewards do not to TVL, but adds to volume and supply side revenue
  let tokenAmountUSD = getTokenAmountUSD(event.params.rewardsToken, event.params.reward);

  // This should use the gasUsed, not the gasLimit. But that is not available per transaction...
  let transactionFee = event.transaction.gasLimit.times(event.transaction.gasPrice)

  let financialsDailySnapshot: FinancialsDailySnapshotEntity = getFinancialSnapshot(
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

  let financialsDailySnapshot: FinancialsDailySnapshotEntity = getFinancialSnapshot(
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

  let financialsDailySnapshot: FinancialsDailySnapshotEntity = getFinancialSnapshot(
    event.block.timestamp,
    tokenAmountUSD,
    transactionFee,
    BigInt.fromI32(0),
    constants.UNSTAKE_INTERACTION
  );

  financialsDailySnapshot.blockNumber = event.block.number;
  financialsDailySnapshot.save();
}


