import { 
  BigInt, 
  BigDecimal, 
  Address, 
  log 
} from "@graphprotocol/graph-ts"

import { 
  Approval,
} from "../../generated/templates/LendingPool/GeistToken"

import { 
  MultiFeeDistribution,
} from "../../generated/templates/MultiFeeDistribution/MultiFeeDistribution"

import {
  Deposit,
  Borrow,
  Withdraw,
  Repay,
  LiquidationCall,
  ReserveDataUpdated,
  ReserveUsedAsCollateralEnabled,
  ReserveUsedAsCollateralDisabled
} from '../../generated/templates/LendingPool/LendingPool'


import { 
  UsageMetricsDailySnapshot as UsageMetricsDailySnapshotEntity,
  FinancialsDailySnapshot as FinancialsDailySnapshotEntity,
  LendingProtocol as LendingProtocolEntity,
  Market as MarketEntity,
  Deposit as DepositEntity,
  Withdraw as WithdrawEntity,
  Borrow as BorrowEntity,
  Repay as RepayEntity,
  Liquidation as LiquidationEntity
} from "../../generated/schema"

import * as constants from "../common/constants"

import {
  TOKEN_ADDRESS_GEIST,
  REWARD_TOKEN_CONTRACT,
} from "../common/addresses"

import { 
  getOrInitializeToken, 
  getOrInitializeRewardToken,
  updateOrInitializeUsageMetrics,
  updateOrInitializeFinancialSnapshot,
  getTokenAmountUSD,
  getOrInitializeMarket,
  getLendingProtocol
} from './helpers';

import { 
  getTimestampInMillis,
  convertBigIntToBigDecimal,
  convertRayToWad
} from "../common/utils"


export function handleApproval(event: Approval): void {
  // Add main token into Token store
  getOrInitializeToken(TOKEN_ADDRESS_GEIST);

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
    getOrInitializeRewardToken(result.value, constants.REWARD_TYPE_DEPOSIT);
  }
}

export function handleDeposit(event: Deposit): void {
  log.warning('Deposit event', [])

  let asset = getOrInitializeToken(event.params.reserve);
  let tokenAmountUSD = getTokenAmountUSD(event.params.reserve, event.params.amount);
  // This should use the gasUsed, not the gasLimit. But that is not available per transaction...
  let transactionFee = event.transaction.gasLimit.times(event.transaction.gasPrice)
  let tx = event.transaction
  let id = "deposit-" + tx.hash.toHexString() + "-" + tx.index.toI32().toString()
  
  let deposit = DepositEntity.load(id)
  if (!deposit) {
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
        updateOrInitializeUsageMetrics(event.block.number, event.block.timestamp, event.transaction.from);
  usageMetrics.save()

  // Depositing adds to TVL and volume
  let financialsDailySnapshot: FinancialsDailySnapshotEntity = updateOrInitializeFinancialSnapshot(
    event.block.timestamp,
    tokenAmountUSD,
    transactionFee,
    BigInt.fromI32(0),
    constants.DEPOSIT_INTERACTION,
  );
  financialsDailySnapshot.protocol = constants.PROTOCOL_ID;
  financialsDailySnapshot.timestamp = event.block.timestamp;
  financialsDailySnapshot.blockNumber = event.block.number;
  financialsDailySnapshot.save();

  // Get the protocol data into scope
  let protocol = getLendingProtocol(constants.PROTOCOL_ID);

  // Create a market and add deposited token value to it
  let market = getOrInitializeMarket(asset.id, protocol.name, event.block.number, event.block.timestamp);
  let inputTokenIndex = market.inputTokens.indexOf(asset.id);
  market.inputTokenBalances[inputTokenIndex] = market.inputTokenBalances[inputTokenIndex].plus(deposit.amount);
  market.totalValueLockedUSD = market.totalValueLockedUSD.plus(tokenAmountUSD);
  market.deposits.push(deposit.id);
  market.save();

  // Update protocol metrics
  protocol.financialMetrics.push(financialsDailySnapshot.id);
  protocol.usageMetrics.push(usageMetrics.id);
  protocol.save()
}

export function handleBorrow(event: Borrow): void {
  log.warning('Borrow event', [])

  let asset = getOrInitializeToken(event.params.reserve);
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
        updateOrInitializeUsageMetrics(event.block.number, event.block.timestamp, event.transaction.from);

  usageMetrics.save()

  // Depositing adds to TVL and volume
  let financialsDailySnapshot: FinancialsDailySnapshotEntity = updateOrInitializeFinancialSnapshot(
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

  let asset = getOrInitializeToken(event.params.reserve);
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
        updateOrInitializeUsageMetrics(event.block.number, event.block.timestamp, event.transaction.from);

  usageMetrics.save()

  // This should use the gasUsed, not the gasLimit. But that is not available per transaction...
  let transactionFee = event.transaction.gasLimit.times(event.transaction.gasPrice)

  // Depositing adds to TVL and volume
  let financialsDailySnapshot: FinancialsDailySnapshotEntity = updateOrInitializeFinancialSnapshot(
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

  let asset = getOrInitializeToken(event.params.reserve);
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
        updateOrInitializeUsageMetrics(event.block.number, event.block.timestamp, event.transaction.from);

  usageMetrics.save()

  // This should use the gasUsed, not the gasLimit. But that is not available per transaction...
  let transactionFee = event.transaction.gasLimit.times(event.transaction.gasPrice)

  // Depositing adds to TVL and volume
  let financialsDailySnapshot: FinancialsDailySnapshotEntity = updateOrInitializeFinancialSnapshot(
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

export function handleLiquidationCall(event: LiquidationCall): void {
  let tx = event.transaction;
  let id = "liquidation-" + tx.hash.toHexString() + "-" + tx.index.toI32().toString();
  let marketAddress = event.params.collateralAsset.toHexString();

  let asset = getOrInitializeToken(event.params.collateralAsset);
  let tokenAmountUSD = getTokenAmountUSD(event.params.collateralAsset, event.params.liquidatedCollateralAmount);
  let transactionFee = event.transaction.gasLimit.times(event.transaction.gasPrice)

  let liquidation = LiquidationEntity.load(id);
  if (!liquidation) {
    liquidation = new LiquidationEntity(id)
    liquidation.logIndex = tx.index.toI32()
    liquidation.to = marketAddress;
    liquidation.from = event.params.liquidator.toHexString();
    liquidation.hash = tx.hash.toHexString();
    liquidation.logIndex = tx.index.toI32();
    liquidation.asset = asset.id;
    liquidation.protocol = constants.PROTOCOL_ID;
    liquidation.timestamp = getTimestampInMillis(event.block);
    liquidation.blockNumber = event.block.number;
    liquidation.amount = event.params.liquidatedCollateralAmount;
    liquidation.amountUSD = tokenAmountUSD;
    liquidation.save();
  };

  // Generate data for the UsageMetricsDailySnapshot Entity
  let usageMetrics: UsageMetricsDailySnapshotEntity = 
        updateOrInitializeUsageMetrics(event.block.number, event.block.timestamp, event.transaction.from);
  usageMetrics.save();

  // Liqudidation removes TVL and adds to volume
  let financialsDailySnapshot: FinancialsDailySnapshotEntity = updateOrInitializeFinancialSnapshot(
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

export function handleReserveDataUpdated(event: ReserveDataUpdated): void {
  let id = event.params.reserve.toHexString();
  let protocol = getLendingProtocol(constants.PROTOCOL_ID);


  let market: MarketEntity = getOrInitializeMarket(id, protocol.name, event.block.number, event.block.timestamp);

  market.depositRate = convertBigIntToBigDecimal(convertRayToWad(event.params.liquidityRate));
  market.variableBorrowRate = convertBigIntToBigDecimal(convertRayToWad(event.params.variableBorrowRate));
  market.stableBorrowRate = convertBigIntToBigDecimal(convertRayToWad(event.params.stableBorrowRate));

  market.save();

  log.warning(
    "Reserve data updated for Market ID={}, depositRate={}, variableBorrowRate={}, stableBorrowRate={}", 
    [
      id,
      market.depositRate.toString(),
      market.variableBorrowRate.toString(),
      market.stableBorrowRate.toString() 
    ]
  );
}

export function handleReserveUsedAsCollateralEnabled(event: ReserveUsedAsCollateralEnabled): void {
  let id = event.params.reserve.toHexString();
  let protocol = getLendingProtocol(constants.PROTOCOL_ID);

  let market: MarketEntity = getOrInitializeMarket(id, protocol.name, event.block.number, event.block.timestamp);

  market.canUseAsCollateral = true;
  market.save();

  log.warning(
    "Reserve used as collateral updated for Market ID={}, canUseAsCollateral={}", 
    [
      id,
      market.canUseAsCollateral.toString()
    ]
  )
}

export function handleReserveUsedAsCollateralDisabled(event: ReserveUsedAsCollateralDisabled): void {
  let id = event.params.reserve.toHexString();
  let protocol = getLendingProtocol(constants.PROTOCOL_ID);

  let market: MarketEntity = getOrInitializeMarket(id, protocol.name, event.block.number, event.block.timestamp);
  
  market.canUseAsCollateral = false;
  market.save();

  log.warning(
    "Reserve used as collateral updated for Market ID={}, canUseAsCollateral={}", 
    [
      id,
      market.canUseAsCollateral.toString()
    ]
  )
}
