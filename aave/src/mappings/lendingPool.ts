import {
  BigInt,
  BigDecimal,
  Address
} from "@graphprotocol/graph-ts";

import {
  Deposit,
  Withdraw,
  Borrow,
  Repay,
  ReserveDataUpdated,
  LiquidationCall
} from "../../generated/templates/LendingPool/LendingPool";

import {
  IPriceOracleGetter
} from "../../generated/templates/LendingPool/IPriceOracleGetter";

import {
  Deposit as DepositEntity,
  Withdraw as WithdrawEntity,
  Borrow as BorrowEntity,
  Repay as RepayEntity,
  Liquidation as LiquidationEntity,
  Market
} from '../../generated/schema';

export function handleReserveDataUpdated(event: ReserveDataUpdated): void {
  // This event handler updates the deposit/borrow rates on a market when the state of a reserve is updated
  const marketAddr = event.params.reserve.toHexString();
  let market = Market.load(marketAddr) as Market;
  // DOUBLE CHECK THAT DEPOSIT RATE/LIQUIDITY RATE ARE ONE-IN-THE-SAME
  market.depositRate = new BigDecimal(event.params.liquidityRate);
  market.variableBorrowRate = new BigDecimal(event.params.variableBorrowRate);
  market.stableBorrowRate = new BigDecimal(event.params.stableBorrowRate);
  market.save()
}

// BELOW EVENT HANDLERS EXECUTE ON USER ACTIONS UPON A LENDING POOL
// The transaction is sent to the market address, therefore marketAddr is set to event.transaction.to in all functions

export function handleDeposit(event: Deposit): void {
  // Deposit event to a lending pool triggers this handler
  const hash = event.transaction.hash.toHexString();
  const logIdx = event.logIndex;
  const marketAddr = event.transaction.to.toHexString();
  // Instantiate the deposit entity with the specified string construction as id
  let deposit = new DepositEntity(hash + "-" + logIdx.toHexString());
  deposit.to = marketAddr;
  deposit.market = marketAddr;
  deposit.from = event.transaction.from.toHexString();
  deposit.hash = hash;
  deposit.logIndex = logIdx.toI32();
  deposit.protocol = 'AAVE_POOL'
  deposit.amount = new BigDecimal(event.params.amount);
  deposit.timestamp = event.block.timestamp;
  deposit.blockNumber = event.block.number;
  // The reserve param is the asset contract address
  deposit.asset = event.params.reserve.toHexString();
  deposit.save();
  
  let market = Market.load(marketAddr) as Market;
  market.deposits.push(deposit.id);
  // amountUSD = getAmountOfTokenInUSD(deposit.amount)
  // INCREMENT market.totalVolumeUSD by amountUSD
  // INCREMENT market.totalValueLockedUSD by amountUSD
  market.save();
}

export function handleWithdraw(event: Withdraw): void {
  // Withdraw event from a lending pool to a user triggers this handler
  const hash = event.transaction.hash.toHexString();
  const logIdx = event.logIndex;
  const marketAddr = event.transaction.to.toHexString();
  let withdraw = new WithdrawEntity(hash + "-" + logIdx.toHexString());
  // The tokens are sent to the address listed as the "to" param field of the event
  // NOT "to" property of event.transaction which marketAddr is set to
  withdraw.to = event.params.to.toHexString();
  withdraw.market = marketAddr;
  withdraw.from = marketAddr;
  withdraw.hash = hash;
  withdraw.logIndex = logIdx.toI32();
  withdraw.asset = event.params.reserve.toHexString();
  withdraw.protocol = 'AAVE_POOL';
  withdraw.amount = new BigDecimal(event.params.amount);
  withdraw.timestamp = event.block.timestamp;
  withdraw.blockNumber = event.block.number;
  withdraw.save();

  const market = Market.load(marketAddr) as Market;
  market.withdraws.push(withdraw.id);
  market.save();
}

export function handleBorrow(event: Borrow): void {
  // Borrow event from a lending pool to a user triggers this handler
  const hash = event.transaction.hash.toHexString();
  const logIdx = event.logIndex;
  const marketAddr = event.transaction.to.toHexString();
  let borrow = new BorrowEntity(hash + "-" + logIdx.toHexString());
  borrow.to = event.params.user.toHexString();
  borrow.market = marketAddr;
  borrow.from = marketAddr;
  borrow.hash = hash;
  borrow.logIndex = logIdx.toI32();
  borrow.asset = event.params.reserve.toHexString();
  borrow.protocol = 'AAVE_POOL'
  borrow.amount = new BigDecimal(event.params.amount);
  borrow.timestamp = event.block.timestamp;
  borrow.blockNumber = event.block.number;
  borrow.save();
  
  let market = Market.load(marketAddr) as Market;
  market.borrows.push(borrow.id);
  market.save();
}

export function handleRepay(event: Repay): void {
  // Repay event from a user who is paying back into a pool that they borrowed from
  const hash = event.transaction.hash.toHexString();
  const logIdx = event.logIndex;
  const marketAddr = event.transaction.to.toHexString();
  let repay = new RepayEntity(hash + "-" + logIdx.toHexString());
  repay.to = marketAddr;
  repay.market = marketAddr;
  // The user parameter holds the address of the user sending the repayment/transaction into the pool
  repay.from = event.params.user.toHexString();
  repay.hash = hash;
  repay.logIndex = logIdx.toI32();
  repay.asset = event.params.reserve.toHexString();
  repay.protocol = 'AAVE_POOL'
  repay.amount = new BigDecimal(event.params.amount);
  repay.timestamp = event.block.timestamp;
  repay.blockNumber = event.block.number;
  repay.save();
  
  let market = Market.load(marketAddr) as Market;
  market.repays.push(repay.id);
  market.save();
}


export function handleLiquidationCall(event: LiquidationCall): void {
  // Liquidation event where a users collateral assets are sold to reduce the ratio to borrowed assets
  const hash = event.transaction.hash.toHexString();
  const logIdx = event.logIndex;
  const marketAddr = event.transaction.to.toHexString();
  let liquidation = new LiquidationEntity(hash + "-" + logIdx.toHexString());
  // Liquidation.to is set to the market address
  liquidation.to = marketAddr;
  liquidation.market = marketAddr;
  liquidation.from = event.params.liquidator.toHexString();
  liquidation.hash = hash;
  liquidation.logIndex = logIdx.toI32();
  liquidation.asset = event.params.collateralAsset.toHexString();
  liquidation.protocol = 'AAVE_POOL;'
  liquidation.amount = new BigDecimal(event.params.liquidatedCollateralAmount);
  liquidation.timestamp = event.block.timestamp;
  liquidation.blockNumber = event.block.number;
  liquidation.save();

  let market = Market.load(marketAddr) as Market;
  market.deposits.push(liquidation.id);
  market.save();
}