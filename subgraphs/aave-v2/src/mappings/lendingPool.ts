import {
  BigInt,
  BigDecimal,
  Address,
  ethereum
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
  Market,
  LendingProtocol
} from '../../generated/schema';

import { fetchProtocolEntity, getLendingPoolFromCtx, getProtocolIdFromCtx, updateFinancialsDailySnapshot, updateMetricsDailySnapshot } from "./utilFunctions";

// This section needs to be updated once I can figure out what defines these metrics and how to check if they should be incremented
function updateMetrics(event: ethereum.Event) {
  // Update the current date's UsageMetricsDailySnapshot instance
  const metricsDailySnapshot = updateMetricsDailySnapshot(event);
  // Needs conditionals for incrementing
  metricsDailySnapshot.dailyTransactionCount += 1;
  metricsDailySnapshot.activeUsers += 1;
  metricsDailySnapshot.totalUniqueUsers += 1;
  metricsDailySnapshot.save();
}

// This function needs to be updated once pulling financial data from oracles
// Function will be revised later to either calculate data to update within this function, or have it passed in as arguments from call location
function updateFinancials(event: ethereum.Event) {
  // Update the current date's FinancialDailySnapshot instance
  const financialsDailySnapshot = updateFinancialsDailySnapshot(event);
  financialsDailySnapshot.totalValueLockedUSD = new BigDecimal(new BigInt(0));
  financialsDailySnapshot.totalVolumeUSD = new BigDecimal(new BigInt(0));
  financialsDailySnapshot.supplySideRevenueUSD = new BigDecimal(new BigInt(0));
  financialsDailySnapshot.protocolSideRevenueUSD = new BigDecimal(new BigInt(0));
  financialsDailySnapshot.feesUSD = new BigDecimal(new BigInt(0));
  financialsDailySnapshot.save();
}

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
// The transaction is sent to the market address, but event.transaction.to can be null, so this cannot be set for the "to" field of the below entities
// Market address is set to value returned from getLendingPoolFromCtx(), which pulls the current marketAddr from context

export function handleDeposit(event: Deposit): void {
  // Deposit event to a lending pool triggers this handler
  const hash = event.transaction.hash.toHexString();
  const logIdx = event.logIndex;
  const marketAddr = getLendingPoolFromCtx();
  const protocolId = getProtocolIdFromCtx();
  const protocol = fetchProtocolEntity(protocolId);
  // Instantiate the deposit entity with the specified string construction as id
  let deposit = new DepositEntity(hash + "-" + logIdx.toHexString());
  deposit.to = marketAddr;
  deposit.market = marketAddr;
  deposit.from = event.transaction.from.toHexString();
  deposit.hash = hash;
  deposit.logIndex = logIdx.toI32();
  deposit.protocol = protocol.id;
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
  updateMetrics(event);
  updateFinancials(event);
}

export function handleWithdraw(event: Withdraw): void {
  // Withdraw event from a lending pool to a user triggers this handler
  const hash = event.transaction.hash.toHexString();
  const logIdx = event.logIndex;
  const marketAddr = getLendingPoolFromCtx();
  const protocolId = getProtocolIdFromCtx();
  const protocol = fetchProtocolEntity(protocolId);
  let withdraw = new WithdrawEntity(hash + "-" + logIdx.toHexString());
  // The tokens are sent to the address listed as the "to" param field of the event
  // NOT "to" property of event.transaction which marketAddr is set to
  withdraw.to = event.params.to.toHexString();
  withdraw.market = marketAddr;
  withdraw.from = marketAddr;
  withdraw.hash = hash;
  withdraw.logIndex = logIdx.toI32();
  withdraw.asset = event.params.reserve.toHexString();
  withdraw.protocol = protocol.id || protocolId;
  withdraw.amount = new BigDecimal(event.params.amount);
  withdraw.timestamp = event.block.timestamp;
  withdraw.blockNumber = event.block.number;
  withdraw.save();

  const market = Market.load(marketAddr) as Market;
  market.withdraws.push(withdraw.id);
  market.save();
  updateMetrics(event);
  updateFinancials(event);
}

export function handleBorrow(event: Borrow): void {
  // Borrow event from a lending pool to a user triggers this handler
  const hash = event.transaction.hash.toHexString();
  const logIdx = event.logIndex;
  const marketAddr = getLendingPoolFromCtx();
  const protocolId = getProtocolIdFromCtx();
  const protocol = fetchProtocolEntity(protocolId);
  let borrow = new BorrowEntity(hash + "-" + logIdx.toHexString());
  borrow.to = event.params.user.toHexString();
  borrow.market = marketAddr;
  borrow.from = marketAddr;
  borrow.hash = hash;
  borrow.logIndex = logIdx.toI32();
  borrow.asset = event.params.reserve.toHexString();
  borrow.protocol = protocol.id || protocolId;
  borrow.amount = new BigDecimal(event.params.amount);
  borrow.timestamp = event.block.timestamp;
  borrow.blockNumber = event.block.number;
  borrow.save();
  
  let market = Market.load(marketAddr) as Market;
  market.borrows.push(borrow.id);
  market.save();
  updateMetrics(event);
  updateFinancials(event);
}

export function handleRepay(event: Repay): void {
  // Repay event from a user who is paying back into a pool that they borrowed from
  const hash = event.transaction.hash.toHexString();
  const logIdx = event.logIndex;
  const marketAddr = getLendingPoolFromCtx();
  const protocolId = getProtocolIdFromCtx();
  const protocol = fetchProtocolEntity(protocolId);
  let repay = new RepayEntity(hash + "-" + logIdx.toHexString());
  repay.to = marketAddr;
  repay.market = marketAddr;
  // The user parameter holds the address of the user sending the repayment/transaction into the pool
  repay.from = event.params.user.toHexString();
  repay.hash = hash;
  repay.logIndex = logIdx.toI32();
  repay.asset = event.params.reserve.toHexString();
  repay.protocol = protocol.id || protocolId;
  repay.amount = new BigDecimal(event.params.amount);
  repay.timestamp = event.block.timestamp;
  repay.blockNumber = event.block.number;
  repay.save();
  
  let market = Market.load(marketAddr) as Market;
  market.repays.push(repay.id);
  market.save();
  updateMetrics(event);
  updateFinancials(event);
}

export function handleLiquidationCall(event: LiquidationCall): void {
  // Liquidation event where a users collateral assets are sold to reduce the ratio to borrowed assets
  const hash = event.transaction.hash.toHexString();
  const logIdx = event.logIndex;
  const marketAddr = getLendingPoolFromCtx();
  const protocolId = getProtocolIdFromCtx();
  const protocol = fetchProtocolEntity(protocolId);
  let liquidation = new LiquidationEntity(hash + "-" + logIdx.toHexString());
  // Liquidation.to is set to the market address
  liquidation.to = marketAddr;
  liquidation.market = marketAddr;
  liquidation.from = event.params.liquidator.toHexString();
  liquidation.hash = hash;
  liquidation.logIndex = logIdx.toI32();
  liquidation.asset = event.params.collateralAsset.toHexString();
  liquidation.protocol = protocol.id || protocolId;
  liquidation.amount = new BigDecimal(event.params.liquidatedCollateralAmount);
  liquidation.timestamp = event.block.timestamp;
  liquidation.blockNumber = event.block.number;
  liquidation.save();

  let market = Market.load(marketAddr) as Market;
  market.deposits.push(liquidation.id);
  market.save();
  updateMetrics(event);
  updateFinancials(event);
}