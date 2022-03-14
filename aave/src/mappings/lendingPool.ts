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
  Deposit as DepositEntity,
  Withdraw as WithdrawEntity,
  Borrow as BorrowEntity,
  Repay as RepayEntity,
  Liquidation as LiquidationEntity,
  Market
} from '../../generated/schema';

import { getLendingPoolFromCtx, initToken } from "./utilFunctions";

// Updates to which pieces of data on the reserve/market trigger this event?
export function handleReserveDataUpdated(event: ReserveDataUpdated): void {
  // This event handler updates the deposit/borrow rates on a market
  let marketAddr = getLendingPoolFromCtx();
  let market = Market.load(marketAddr) as Market;
  // DOUBLE CHECK THAT DEPOSIT RATE/LIQUIDITY RATE ARE ONE-IN-THE-SAME
  market.depositRate = new BigDecimal(event.params.liquidityRate);
  market.variableBorrowRate = new BigDecimal(event.params.variableBorrowRate);
  market.stableBorrowRate = new BigDecimal(event.params.stableBorrowRate);
  market.save()
}

// BELOW EVENT HANDLERS EXECUTE ON USER ACTIONS UPON A LENDING POOL

// Need to work through the 'from' and 'to' fields for ALL events
// The params for each of these events do not seem to contain data regarding 'to', 'from', nor 'asset' fields
// While some params or event.transaction properties share these names, I need to confirm what exactly they hold
// ie. Does event.transaction.from hold the address of the user who called the withdraw method? Or the pool that the tokens were withdrawn from

// Is 'AAVE_POOL' the correct value for 'protocol' field?

// Aside from liquidation, params/transaction does not seem to contain anything directly related to the token/asset at hand
// My solution was to fetch the Market entity first and then get the asset from the inputToken's field
// Is there an easier, more accesible value to pull?

export function handleDeposit(event: Deposit): void {
  // Deposit event to a lending pool triggers this handler
  const hash = event.transaction.hash.toHexString();
  const logIdx = event.logIndex;
  // Instantiate the deposit entity with the specified string construction as id
  let deposit = new DepositEntity(hash + "-" + logIdx.toHexString());
  deposit.hash = hash;
  deposit.logIndex = logIdx.toI32();
  deposit.protocol = 'AAVE_POOL'
  deposit.from = event.transaction.from.toHexString();
  deposit.amount = new BigDecimal(event.params.amount);
  deposit.timestamp = event.block.timestamp;
  deposit.blockNumber = event.block.number;

  // The reserve address is the market address
  const marketAddr = event.params.reserve.toHexString();
  // event.transaction.to could possibly be null, error unusable for deposit.to
  // deposit.to is set to the market address as the user is depositing tokens into the lending pool/market
  deposit.to = marketAddr;
  deposit.market = marketAddr;
  let market = Market.load(marketAddr) as Market;
  let token = initToken(Address.fromString(market.inputTokens[0]));
  deposit.asset = token.id;
  deposit.save();

  market.deposits.push(deposit.id);
  market.save();
}

export function handleWithdraw(event: Withdraw): void {
  // Withdraw event from a lending pool to a user triggers this handler
  const hash = event.transaction.hash.toHexString();
  const logIdx = event.logIndex;
  let withdraw = new WithdrawEntity(hash + "-" + logIdx.toHexString());
  withdraw.hash = hash;
  withdraw.logIndex = logIdx.toI32();
  withdraw.protocol = 'AAVE_POOL'
  withdraw.from = event.transaction.from.toHexString();
  withdraw.to = event.params.to.toHexString();
  withdraw.amount = new BigDecimal(event.params.amount);
  withdraw.timestamp = event.block.timestamp;
  withdraw.blockNumber = event.block.number;
  
  let marketAddr = getLendingPoolFromCtx();
  withdraw.market = marketAddr;
  const market = Market.load(marketAddr) as Market;
  const token = initToken(Address.fromString(market.inputTokens[0]));
  withdraw.asset = token.id;
  withdraw.save();
  market.withdraws.push(withdraw.id);
  market.save();
}

export function handleBorrow(event: Borrow): void {
  // Borrow event from a lending pool to a user triggers this handler

  const hash = event.transaction.hash.toHexString();
  const logIdx = event.logIndex;
  let borrow = new BorrowEntity(hash + "-" + logIdx.toHexString());

  borrow.hash = hash;
  borrow.logIndex = logIdx.toI32();
  borrow.protocol = 'AAVE_POOL'
  borrow.from = event.transaction.from.toHexString();
  // VERIFY THAT USER IS APPROPRIATE TO USE FOR borrow.to
  borrow.to = event.params.user.toHexString();
  borrow.amount = new BigDecimal(event.params.amount);
  borrow.timestamp = event.block.timestamp;
  borrow.blockNumber = event.block.number;
  
  const marketAddr = event.params.reserve.toHexString();
  borrow.market = marketAddr;
  let market = Market.load(marketAddr) as Market;
  const token = initToken(Address.fromString(market.inputTokens[0]));
  borrow.asset = token.id;
  borrow.save();

  market.borrows.push(borrow.id);
  market.save();
}

export function handleRepay(event: Repay): void {
  // Repay event from a user who is paying back into a pool that they borrowed from

  const hash = event.transaction.hash.toHexString();
  const logIdx = event.logIndex;
  let repay = new RepayEntity(hash + "-" + logIdx.toHexString());
  repay.hash = hash;
  repay.logIndex = logIdx.toI32();
  repay.protocol = 'AAVE_POOL'
  repay.from = event.transaction.from.toHexString();
  repay.amount = new BigDecimal(event.params.amount);
  repay.timestamp = event.block.timestamp;
  repay.blockNumber = event.block.number;
  
  const marketAddr = getLendingPoolFromCtx();
  // Repayment is made to the market, therefore repay.to is set to the market address
  repay.to = marketAddr;
  repay.market = marketAddr;
  let market = Market.load(marketAddr) as Market;
  const token = initToken(Address.fromString(market.inputTokens[0]));
  repay.asset = token.id;
  repay.save();

  market.repays.push(repay.id);
  market.save();
}


export function handleLiquidationCall(event: LiquidationCall): void {
  // Liquidation event where a users collateral assets are sold to reduce the ratio to borrowed assets

  const hash = event.transaction.hash.toHexString();
  const logIdx = event.logIndex;
  let liquidation = new LiquidationEntity(hash + "-" + logIdx.toHexString());
  liquidation.hash = hash;
  liquidation.logIndex = logIdx.toI32();
  liquidation.protocol = 'AAVE_POOL;'
  liquidation.from = event.params.liquidator.toHexString();
  liquidation.amount = new BigDecimal(event.params.liquidatedCollateralAmount);
  liquidation.timestamp = event.block.timestamp;
  liquidation.blockNumber = event.block.number;
  liquidation.asset = event.params.collateralAsset.toHexString();

  let marketAddr = getLendingPoolFromCtx();
  // Liquidation.to is set to the market address, as the liquidated position gets sent to the pool/market
  liquidation.to = marketAddr;
  liquidation.market = marketAddr;
  let market = Market.load(marketAddr) as Market;
  market.deposits.push(liquidation.id);
  
  liquidation.save();
  market.save();
}