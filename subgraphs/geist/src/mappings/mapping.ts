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

import { 
  PROTOCOL_ID,
  NETWORK_FANTOM,
  PROTOCOL_TYPE_LENDING,
  DEPOSIT_INTERACTION,
  BORROW_INTERACTION,
  WITHDRAW_INTERACTION,
  REWARD_INTERACTION,
  REPAY_INTERACTION,
  STAKE_INTERACTION,
  UNSTAKE_INTERACTION
} from "../common/constants";

import {
  TOKEN_ADDRESS_GEIST,
  REWARD_TOKEN_CONTRACT,
} from "../common/addresses"

import { 
  initializeToken, 
  initializeRewardToken,
  getUsageMetrics,
  getFinancialSnapshot
} from './helpers';

import { 
  getTimestampInMillis 
} from "../common/utils"


// Definitions
// totalValueLockedUSD = staking + deposits
// totalVolumeUSD = deposit + staking + repay + withdraw
// supplySideRevenueUSD = rewards paid to depositors
// protocolSideRevenueUSD = fees

function createProtocol(): void {
  let protocol = LendingProtocolEntity.load(PROTOCOL_ID)
  if (!protocol) {
    protocol = new LendingProtocolEntity(PROTOCOL_ID)
    protocol.name = "Geist Finance"
    protocol.slug = "geist-finance"
    protocol.network = NETWORK_FANTOM
    protocol.type = PROTOCOL_TYPE_LENDING
    protocol.save()
  }
}

export function handleAddressesProviderRegistered(event: AddressesProviderRegistered): void {
  createProtocol()

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
    deposit.protocol = PROTOCOL_ID
    deposit.save()
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
    event.params.amount,
    event.params.reserve,
    transactionFee,
    BigInt.fromI32(0),
    DEPOSIT_INTERACTION,
  ); 
  financialsDailySnapshot.protocol = PROTOCOL_ID;
  financialsDailySnapshot.timestamp = event.block.timestamp;
  financialsDailySnapshot.blockNumber = event.block.number;

  financialsDailySnapshot.save()
}

export function handleBorrow(event: Borrow): void {
  log.warning('Borrow event', [])

  let tx = event.transaction
  let id = "borrow-" + tx.hash.toHexString() + "-" + tx.index.toI32().toString()
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
    borrow.protocol = PROTOCOL_ID
    borrow.save()
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
    event.params.amount,
    event.params.reserve,
    transactionFee,
    event.params.borrowRateMode,
    BORROW_INTERACTION,
  ); 
  financialsDailySnapshot.protocol = PROTOCOL_ID;
  financialsDailySnapshot.timestamp = event.block.timestamp;
  financialsDailySnapshot.blockNumber = event.block.number;


  financialsDailySnapshot.save()
}

export function handleWithdraw(event: Withdraw): void{
  log.warning('Withdraw event', [])

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
    withdraw.protocol = PROTOCOL_ID
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
    event.params.amount,
    event.params.reserve,
    transactionFee,
    BigInt.fromI32(0),
    WITHDRAW_INTERACTION,
  );
  financialsDailySnapshot.protocol = PROTOCOL_ID;
  financialsDailySnapshot.timestamp = event.block.timestamp;
  financialsDailySnapshot.blockNumber = event.block.number;

  financialsDailySnapshot.save()
}

export function handleRepay(event: Repay): void {
  log.warning('Repay event', [])

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
    repay.protocol = PROTOCOL_ID
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
    event.params.amount,
    event.params.reserve,
    transactionFee,
    BigInt.fromI32(0),
    REPAY_INTERACTION,
  );
  financialsDailySnapshot.protocol = PROTOCOL_ID;
  financialsDailySnapshot.timestamp = event.block.timestamp;
  financialsDailySnapshot.blockNumber = event.block.number;

  financialsDailySnapshot.save()
}

export function handleRewardPaid(event: RewardPaid): void {
  // Rewards do not to TVL, but adds to volume and supply side revenue
  
  // This should use the gasUsed, not the gasLimit. But that is not available per transaction...
  let transactionFee = event.transaction.gasLimit.times(event.transaction.gasPrice)

  let financialsDailySnapshot: FinancialsDailySnapshotEntity = getFinancialSnapshot(
    event.block.timestamp,
    event.params.reward,
    event.params.rewardsToken,
    transactionFee,
    BigInt.fromI32(0),
    REWARD_INTERACTION
  );

  financialsDailySnapshot.blockNumber = event.block.number;
  financialsDailySnapshot.save();
}

export function handleStakeAdded(event: Staked): void {
  /* Staking is treated equivalent to depositing for the purposes of the snapshots */
  let transactionFee = event.transaction.gasLimit.times(event.transaction.gasPrice)

  let financialsDailySnapshot: FinancialsDailySnapshotEntity = getFinancialSnapshot(
    event.block.timestamp,
    event.params.amount,
    TOKEN_ADDRESS_GEIST,
    transactionFee,
    BigInt.fromI32(0),
    STAKE_INTERACTION
  );

  financialsDailySnapshot.blockNumber = event.block.number;
  financialsDailySnapshot.save();
}


export function handleStakeWithdrawn(event: Withdrawn): void {
  /* Unstaking is treated equivalent to withdrawing for the purposes of the snapshots */
  let transactionFee = event.transaction.gasLimit.times(event.transaction.gasPrice)

  let financialsDailySnapshot: FinancialsDailySnapshotEntity = getFinancialSnapshot(
    event.block.timestamp,
    event.params.amount,
    TOKEN_ADDRESS_GEIST,
    transactionFee,
    BigInt.fromI32(0),
    UNSTAKE_INTERACTION
  );

  financialsDailySnapshot.blockNumber = event.block.number;
  financialsDailySnapshot.save();
}


