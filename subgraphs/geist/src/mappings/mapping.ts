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
  MultiFeeDistribution 
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
  DEPOSIT,
  BORROW,
  WITHDRAW,
  REWARD
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
  let id = tx.hash.toHexString()
  let transaction = DepositEntity.load(id)
  if (transaction == null) {
    transaction = new DepositEntity(id)
    transaction.logIndex = tx.index.toI32()
    if (tx.to) {
      transaction.to = (tx.to as Address).toHexString()
    }
    transaction.from = tx.from.toHexString()
    transaction.hash = tx.hash.toHexString()
    transaction.timestamp = getTimestampInMillis(event.block);
    transaction.blockNumber = event.block.number;
    transaction.protocol = PROTOCOL_ID
    transaction.save()
  }

  // Generate data for the UsageMetricsDailySnapshot Entity
  let usageMetrics: UsageMetricsDailySnapshotEntity = 
        getUsageMetrics(event.block.number, event.block.timestamp, event.transaction.from);

  usageMetrics.save()

  // Depositing adds to TVL and volume
  let financialsDailySnapshot: FinancialsDailySnapshotEntity = getFinancialSnapshot(
    event.block.timestamp,
    event.params.amount,
    event.params.reserve,
    DEPOSIT,
  ); 
  financialsDailySnapshot.protocol = PROTOCOL_ID;
  financialsDailySnapshot.timestamp = event.block.timestamp;
  financialsDailySnapshot.blockNumber = event.block.number;

  financialsDailySnapshot.save()
}

export function handleBorrow(event: Borrow): void {
  log.warning('Borrow event', [])

  let tx = event.transaction
  let id = tx.hash.toHexString()
  let transaction = BorrowEntity.load(id)
  if (transaction == null) {
    transaction = new BorrowEntity(id)
    transaction.logIndex = tx.index.toI32()
    if (tx.to) {
      transaction.to = (tx.to as Address).toHexString()
    }
    transaction.from = tx.from.toHexString()
    transaction.hash = tx.hash.toHexString()
    transaction.timestamp = getTimestampInMillis(event.block);
    transaction.blockNumber = event.block.number;
    transaction.protocol = PROTOCOL_ID
    transaction.save()
  }

  // Generate data for the UsageMetricsDailySnapshot Entity
  let usageMetrics: UsageMetricsDailySnapshotEntity = 
        getUsageMetrics(event.block.number, event.block.timestamp, event.transaction.from);

  usageMetrics.save()

  // Depositing adds to TVL and volume
  let financialsDailySnapshot: FinancialsDailySnapshotEntity = getFinancialSnapshot(
    event.block.timestamp,
    event.params.amount,
    event.params.reserve,
    BORROW,
  ); 
  financialsDailySnapshot.protocol = PROTOCOL_ID;
  financialsDailySnapshot.timestamp = event.block.timestamp;
  financialsDailySnapshot.blockNumber = event.block.number;

  financialsDailySnapshot.save()
}

// export function handleDepositETH(call: DepositETHCall): void {
//   // Extract user metrics from depositing ETH, ignores non-unique addresses
//   // createProtocol();

//   // // Generate data for the Deposit and Market Entities
//   // const hash = call.transaction.hash.toHexString();
//   // // This is the transaction index, not the log index
//   // const logIndex = call.transaction.index;

//   // let deposit = new DepositEntity(hash + "-" + logIndex.toHexString());
//   // deposit.hash = hash;
//   // deposit.logIndex = logIndex.toI32();
//   // deposit.protocol = PROTOCOL_ID;
//   // deposit.from = call.from.toHexString();
//   // deposit.amount = new BigDecimal(call.transaction.value);
//   // deposit.timestamp = call.block.timestamp;
//   // deposit.blockNumber = call.block.number;

//   // const marketAddress = call.inputs.lendingPool.toHexString();

//   // deposit.to = marketAddress;
//   // deposit.market = marketAddress;

//   // let market = MarketEntity.load(marketAddress) as MarketEntity;
//   // const token = initializeToken(Address.fromString(market.inputTokens[0]));

//   // deposit.asset = token.id;
//   // market.deposits.push(deposit.id)

//   // deposit.save()
//   // market.save()

//   // // Generate data for the UsageMetricsDailySnapshot Entity
//   // let usageMetrics: UsageMetricsDailySnapshotEntity = 
//   //       getUsageMetrics(call.block.number, call.block.timestamp, call.from);
//   // usageMetrics.save()

//   // // Depositing ETH adds to TVL and volume
//   // let financialsDailySnapshot: FinancialsDailySnapshotEntity = getFinancialSnapshot(
//   //   call.block.timestamp,
//   //   call.transaction.value,
//   //   TOKEN_ADDRESS_gETH,
//   //   true,
//   //   true,
//   //   false,
//   //   false
//   // );

//   // financialsDailySnapshot.protocol = PROTOCOL_ID;
//   // financialsDailySnapshot.timestamp = call.block.timestamp;
//   // financialsDailySnapshot.blockNumber = call.block.number;
//   // financialsDailySnapshot.save()
// }

// export function handleBorrowETH(call: BorrowETHCall): void {
//   // createProtocol();

//   // // Generate data for the Borrow and Market Entities
//   // const hash = call.transaction.hash.toHexString();
//   // const logIndex = call.transaction.index;

//   // let borrow = new BorrowEntity(hash + "-" + logIndex.toHexString());
//   // borrow.hash = hash;
//   // borrow.logIndex = logIndex.toI32();
//   // borrow.protocol = PROTOCOL_ID;
//   // borrow.from = call.from.toHexString();
//   // borrow.to = call.to.toHexString();
//   // borrow.amount = new BigDecimal(call.inputs.amount);
//   // borrow.timestamp = call.block.timestamp;
//   // borrow.blockNumber = call.block.number;

//   // const marketAddress = call.inputs.lendingPool.toHexString();
//   // borrow.market = marketAddress;

//   // let market = MarketEntity.load(marketAddress) as MarketEntity;
//   // const token = initializeToken(Address.fromString(market.inputTokens[0]));

//   // borrow.asset = token.id;
//   // market.deposits.push(borrow.id)

//   // borrow.save()
//   // market.save()

//   // // Extract user metrics from borrowing ETH, ignores non-unique addresses
//   // let usageMetrics: UsageMetricsDailySnapshotEntity = 
//   //       getUsageMetrics(call.block.number, call.block.timestamp, call.from);
//   // usageMetrics.save()

//   // // Borrowing ETH does not to TVL, but adds to volume
//   // let financialsDailySnapshot: FinancialsDailySnapshotEntity = getFinancialSnapshot(
//   //   call.block.timestamp,
//   //   call.inputs.amount,
//   //   TOKEN_ADDRESS_gETH,
//   //   false,
//   //   false,
//   //   false,
//   //   false
//   // );

//   // financialsDailySnapshot.blockNumber = call.block.number;
//   // financialsDailySnapshot.save()
// }

// export function handleRepayETH(call: RepayETHCall): void {
//   // createProtocol();

//   // // Generate data for the Borrow and Market Entities
//   // const hash = call.transaction.hash.toHexString();
//   // const logIndex = call.transaction.index;

//   // let repay = new RepayEntity(hash + "-" + logIndex.toHexString());
//   // repay.hash = hash;
//   // repay.logIndex = logIndex.toI32();
//   // repay.protocol = PROTOCOL_ID;
//   // repay.from = call.from.toHexString();
//   // repay.amount = new BigDecimal(call.inputs.amount);
//   // repay.timestamp = call.block.timestamp;
//   // repay.blockNumber = call.block.number;

//   // const marketAddress = call.inputs.lendingPool.toHexString();
//   // repay.market = marketAddress;
//   // repay.to = marketAddress;

//   // let market = MarketEntity.load(marketAddress) as MarketEntity;
//   // const token = initializeToken(Address.fromString(market.inputTokens[0]));

//   // repay.asset = token.id;
//   // market.deposits.push(repay.id)

//   // repay.save()
//   // market.save()

//   // // Extract user metrics from replaying ETH, ignores non-unique addresses
//   // let usageMetrics: UsageMetricsDailySnapshotEntity = 
//   //       getUsageMetrics(call.block.number, call.block.timestamp, call.from);
//   // usageMetrics.save()

//   // // Repaying ETH does not to TVL, but adds to volume
//   // let financialsDailySnapshot: FinancialsDailySnapshotEntity = getFinancialSnapshot(
//   //   call.block.timestamp,
//   //   call.inputs.amount,
//   //   TOKEN_ADDRESS_gETH,
//   //   false,
//   //   false,
//   //   false,
//   //   false
//   // );

//   // financialsDailySnapshot.blockNumber = call.block.number;
//   // financialsDailySnapshot.save()
// }

// export function handleWithdrawETH(call: WithdrawETHCall): void {
//   // createProtocol();

//   // // Generate data for the Borrow and Market Entities
//   // const hash = call.transaction.hash.toHexString();
//   // const logIndex = call.transaction.index;

//   // let withdraw = new WithdrawEntity(hash + "-" + logIndex.toHexString());
//   // withdraw.hash = hash;
//   // withdraw.logIndex = logIndex.toI32();
//   // withdraw.protocol = PROTOCOL_ID;
//   // withdraw.from = call.from.toHexString();
//   // withdraw.to = call.to.toHexString();
//   // withdraw.amount = new BigDecimal(call.inputs.amount);
//   // withdraw.timestamp = call.block.timestamp;
//   // withdraw.blockNumber = call.block.number;

//   // const marketAddress = call.inputs.lendingPool.toHexString();
//   // withdraw.market = marketAddress;

//   // let market = MarketEntity.load(marketAddress) as MarketEntity;
//   // const token = initializeToken(Address.fromString(market.inputTokens[0]));

//   // withdraw.asset = token.id;
//   // market.deposits.push(withdraw.id)

//   // withdraw.save()
//   // market.save()

//   // // Extract user metrics from withdrawing ETH, ignores non-unique addresses
//   // let usageMetrics: UsageMetricsDailySnapshotEntity = 
//   //       getUsageMetrics(call.block.number, call.block.timestamp, call.from);
//   // usageMetrics.save()

//   // // Borrowing ETH reduces TVL, but adds to volume
//   // let financialsDailySnapshot: FinancialsDailySnapshotEntity = getFinancialSnapshot(
//   //   call.block.timestamp,
//   //   call.inputs.amount,
//   //   TOKEN_ADDRESS_gETH,
//   //   true,
//   //   false,
//   //   false,
//   //   false
//   // );

//   // financialsDailySnapshot.blockNumber = call.block.number;
//   // financialsDailySnapshot.save()
// }

export function handleRewardPaid(event: RewardPaid): void {
  // Rewards do not to TVL, but adds to volume and supply side revenue
  let financialsDailySnapshot: FinancialsDailySnapshotEntity = getFinancialSnapshot(
    event.block.timestamp,
    event.params.reward,
    event.params.rewardsToken,
    REWARD
  );

  financialsDailySnapshot.blockNumber = event.block.number;
  financialsDailySnapshot.save();
}
