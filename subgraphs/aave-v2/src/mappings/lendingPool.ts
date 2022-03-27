import {
  BigInt,
  BigDecimal,
  Address,
  ethereum,
  dataSource,
  log
} from "@graphprotocol/graph-ts";

import {
  Deposit,
  Withdraw,
  Borrow,
  Repay,
  ReserveDataUpdated,
  LiquidationCall,
  ReserveUsedAsCollateralEnabled,
  ReserveUsedAsCollateralDisabled
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
  UsageMetricsDailySnapshot
} from '../../generated/schema';

import {
  fetchProtocolEntity,
  getAssetPriceInUSDC,
  getProtocolIdFromCtx,
  initToken,
  initMarket,
  amountInUSD,
  updateFinancials,
  loadMarketDailySnapshot,
  updateMetricsDailySnapshot,
  exponentToBigDecimal,
  getDaysSinceEpoch
} from "./utilFunctions";

export function getLendingPoolFromCtx(): string {
  // Get the lending pool/market address with context
  let context = dataSource.context();
  return context.getString("lendingPool");
}

export function getTokenBalanceIndex(market: Market, asset: string): number {
  // The index of the inputToken and the inputTokenBalance are the same, as these arrays push the corresponding values to the same index when added
  let tokenBalanceIndex = market.inputTokens.indexOf(asset);
  if (tokenBalanceIndex < 0) {
    log.error('Transaction event asset/reserve not in market.inputTokens - ' + asset + 'index: ' + tokenBalanceIndex.toString() + ' eq ' + (tokenBalanceIndex < 0).toString(), []);
    tokenBalanceIndex = market.inputTokens.length;
    initToken(Address.fromString(asset));
    market.inputTokens.push(asset);
    market.inputTokenBalances.push(new BigInt(0));
  }
  log.info('returning token index' + tokenBalanceIndex.toString(), []);
  return <i32>tokenBalanceIndex;
}

export function setTokenBalanceArray(newBal: BigInt, tokenBalanceIndex: number, tokenBalances: BigInt[]): BigInt[] {
  // Create a new token balance array to update the changed value
  const newInputTokenBalanceArr: BigInt[] = [];
  for (let x = 0; x < tokenBalances.length; x++) {
    if (x !== <i32>tokenBalanceIndex) {
      newInputTokenBalanceArr.push(tokenBalances[x]);
    } else {
      newInputTokenBalanceArr.push(newBal);
    }
  }
  return newInputTokenBalanceArr;
}

export function handleReserveDataUpdated(event: ReserveDataUpdated): void {
  // This event handler updates the deposit/borrow rates on a market when the state of a reserve is updated
  const market = initMarket(event, event.params.reserve.toHexString()) as Market;
  market.depositRate = new BigDecimal(event.params.liquidityRate);
  market.variableBorrowRate = new BigDecimal(event.params.variableBorrowRate);
  market.stableBorrowRate = new BigDecimal(event.params.stableBorrowRate);
  market.save()
}

// BELOW EVENT HANDLERS EXECUTE ON USER ACTIONS UPON A LENDING POOL
// The transaction is sent to the market address, but event.transaction.to can be null, so this cannot be set for the "to" field of the below entities
// Market address is set to value returned from getLendingPoolFromCtx(), which pulls the current marketAddr from context

export function handleDeposit(event: Deposit): void {
  log.info('DEPO' + event.transaction.hash.toHexString(), []);
  // Deposit event to a lending pool triggers this handler
  const hash = event.transaction.hash.toHexString();
  const logIdx = event.logIndex;
  const marketAddr = event.params.reserve.toHexString();
  const protocolId = getProtocolIdFromCtx();
  const protocol = fetchProtocolEntity(protocolId);
  // Instantiate the deposit entity with the specified string construction as id
  log.info('DEPOSIT AMT: ' + event.params.amount.toString(), [])
  let deposit = new DepositEntity(hash + "-" + logIdx.toHexString());
  deposit.to = marketAddr;
  deposit.market = marketAddr;
  deposit.from = event.transaction.from.toHexString();
  deposit.hash = hash;
  deposit.logIndex = logIdx.toI32();
  deposit.protocol = protocol.id;
  deposit.timestamp = event.block.timestamp;
  deposit.blockNumber = event.block.number;
  // The reserve param is the asset contract address
  deposit.asset = event.params.reserve.toHexString();
  deposit.amount = event.params.amount;
  
  // Initialize the reserve token
  const token = initToken(event.params.reserve);
  const amountUSD = amountInUSD(token, deposit.amount);
  deposit.amountUSD = amountUSD;
  // Update the total value locked on the protocol level
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(amountUSD);
  protocol.save();

  let market = initMarket(event, marketAddr) as Market;
  // Get the index of the balance to be changed
  const tokenBalanceIndex = getTokenBalanceIndex(market, deposit.asset);
  if (tokenBalanceIndex >= market.inputTokens.length) {
    // if the getTokenBalanceIndex function added the event asset to the inputTokens array, reinitialize the market
    market = initMarket(event, marketAddr) as Market;
  }
  const balanceAtIdx = market.inputTokenBalances[<i32>tokenBalanceIndex];
  const newBal = balanceAtIdx.plus(deposit.amount);
  market.inputTokenBalances = setTokenBalanceArray(newBal, tokenBalanceIndex, market.inputTokenBalances);
  // Update total volume/value locked on the market level
  market.totalVolumeUSD = market.totalVolumeUSD.plus(amountUSD);
  market.totalValueLockedUSD = market.totalValueLockedUSD.plus(amountUSD);
  market.save();

  // Update snapshots
  loadMarketDailySnapshot(event, market);
  updateMetricsDailySnapshot(event);
  updateFinancials(event, amountUSD, amountUSD, amountUSD );
  // Add the snapshot id (the number of days since unix epoch) for easier indexing for events within a specific snapshot
  deposit.snapshotId = getDaysSinceEpoch(event.block.timestamp.toI32());
  deposit.save();
}

export function handleWithdraw(event: Withdraw): void {
  // Withdraw event from a lending pool to a user triggers this handler
  const hash = event.transaction.hash.toHexString();
  const logIdx = event.logIndex;
  const marketAddr = event.params.reserve.toHexString();
  const protocolId = getProtocolIdFromCtx();
  const protocol = fetchProtocolEntity(protocolId);
  let withdraw = new WithdrawEntity(hash + "-" + logIdx.toHexString());
  // The tokens are sent to the address listed as the "to" param field of the event
  // NOT "to" property of event.transaction which marketAddr is set to
  log.info('WITHDRAW AMT: ' + event.params.amount.toString(), [])
  
  withdraw.to = event.transaction.from.toHexString();
  withdraw.market = marketAddr;
  withdraw.from = marketAddr;
  withdraw.hash = hash;
  withdraw.logIndex = logIdx.toI32();
  withdraw.asset = event.params.reserve.toHexString();
  withdraw.protocol = protocol.id || protocolId;
  withdraw.timestamp = event.block.timestamp;
  withdraw.blockNumber = event.block.number;
  withdraw.amount =  event.params.amount;
  
  const token = initToken(event.params.reserve);
  const amountUSD = amountInUSD(token, withdraw.amount);
  withdraw.amountUSD = amountUSD;
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(amountUSD);
  protocol.save();

  let market = initMarket(event, marketAddr) as Market;
  market.totalVolumeUSD = market.totalVolumeUSD.plus(amountUSD);
  market.totalValueLockedUSD = market.totalValueLockedUSD.minus(amountUSD);
  // The index of the inputToken and the inputTokenBalance are the same, as these arrays push the crresponding values to the same index when added
  const tokenBalanceIndex = getTokenBalanceIndex(market, withdraw.asset);
  if (tokenBalanceIndex >= market.inputTokens.length) {
    // if the getTokenBalanceIndex function added the event asset to the inputTokens array, reinitialize the market
    market = initMarket(event, marketAddr) as Market;
  }
  const balanceAtIdx = market.inputTokenBalances[<i32>tokenBalanceIndex];
  const newBal = balanceAtIdx.minus(withdraw.amount);
  market.inputTokenBalances = setTokenBalanceArray(newBal, tokenBalanceIndex, market.inputTokenBalances);
  market.save();
  // Update snapshots
  loadMarketDailySnapshot(event, market);
  updateMetricsDailySnapshot(event);
  updateFinancials(event, amountUSD, amountUSD, amountUSD );
  // Add the snapshot id (the number of days since unix epoch) for easier indexing for events within a specific snapshot
  withdraw.snapshotId = getDaysSinceEpoch(event.block.timestamp.toI32());
  withdraw.save();
}

export function handleBorrow(event: Borrow): void {
  // Borrow event from a lending pool to a user triggers this handler
  const hash = event.transaction.hash.toHexString();
  const logIdx = event.logIndex;
  const marketAddr = event.params.reserve.toHexString();
  const protocolId = getProtocolIdFromCtx();
  const protocol = fetchProtocolEntity(protocolId);

  let borrow = new BorrowEntity(hash + "-" + logIdx.toHexString());
  borrow.to = event.transaction.from.toHexString();
  borrow.market = marketAddr;
  borrow.from = marketAddr;
  borrow.hash = hash;
  borrow.logIndex = logIdx.toI32();
  borrow.asset = event.params.reserve.toHexString();
  borrow.protocol = protocol.id || protocolId;
  borrow.timestamp = event.block.timestamp;
  borrow.blockNumber = event.block.number;
  borrow.amount =  event.params.amount;
  
  const token = initToken(event.params.reserve);
  const amountUSD = amountInUSD(token, borrow.amount);
  borrow.amountUSD = amountUSD;
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(amountUSD);
  protocol.save();

  let market = initMarket(event, marketAddr) as Market;
  market.totalVolumeUSD = market.totalVolumeUSD.plus(amountUSD);
  market.totalValueLockedUSD = market.totalValueLockedUSD.minus(amountUSD);
  // The index of the inputToken and the inputTokenBalance are the same, as these arrays push the crresponding values to the same index when added
  const tokenBalanceIndex = getTokenBalanceIndex(market, borrow.asset);
  if (tokenBalanceIndex >= market.inputTokens.length) {
    // if the getTokenBalanceIndex function added the event asset to the inputTokens array, reinitialize the market
    market = initMarket(event, marketAddr) as Market;
  }
  const balanceAtIdx = market.inputTokenBalances[<i32>tokenBalanceIndex];
  const newBal = balanceAtIdx.minus(borrow.amount);
  market.inputTokenBalances = setTokenBalanceArray(newBal, tokenBalanceIndex, market.inputTokenBalances);
  market.save();

  // Update snapshots
  loadMarketDailySnapshot(event, market);
  updateMetricsDailySnapshot(event);
  updateFinancials(event, amountUSD, amountUSD, amountUSD );
  // Add the snapshot id (the number of days since unix epoch) for easier indexing for events within a specific snapshot
  borrow.snapshotId = getDaysSinceEpoch(event.block.timestamp.toI32());
  borrow.save();
}

export function handleRepay(event: Repay): void {
  // Repay event from a user who is paying back into a pool that they borrowed from
  const hash = event.transaction.hash.toHexString();
  const logIdx = event.logIndex;
  const marketAddr = event.params.reserve.toHexString();
  const protocolId = getProtocolIdFromCtx();
  const protocol = fetchProtocolEntity(protocolId);
  let repay = new RepayEntity(hash + "-" + logIdx.toHexString());
  repay.to = marketAddr;
  repay.market = marketAddr;
  // The user parameter holds the address of the user sending the repayment/transaction into the pool
  repay.from = event.transaction.from.toHexString();
  repay.hash = hash;
  repay.logIndex = logIdx.toI32();
  repay.asset = event.params.reserve.toHexString();
  repay.protocol = protocol.id || protocolId;
  repay.timestamp = event.block.timestamp;
  repay.blockNumber = event.block.number;
  repay.amount =  event.params.amount;
  
  const token = initToken(event.params.reserve);
  const amountUSD = amountInUSD(token, repay.amount);
  repay.amountUSD = amountUSD;
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(amountUSD);
  protocol.save();

  let market = initMarket(event, marketAddr) as Market;
  // The index of the inputToken and the inputTokenBalance are the same, as these arrays push the crresponding values to the same index when added
  const tokenBalanceIndex = getTokenBalanceIndex(market, repay.asset);
  if (tokenBalanceIndex >= market.inputTokens.length) {
    // if the getTokenBalanceIndex function added the event asset to the inputTokens array, reinitialize the market
    market = initMarket(event, marketAddr) as Market;
  }
  const balanceAtIdx = market.inputTokenBalances[<i32>tokenBalanceIndex];
  const newBal = balanceAtIdx.plus(repay.amount);
  market.inputTokenBalances = setTokenBalanceArray(newBal, tokenBalanceIndex, market.inputTokenBalances);
  market.totalVolumeUSD = market.totalVolumeUSD.plus(amountUSD);
  market.totalValueLockedUSD = market.totalValueLockedUSD.plus(amountUSD);
  market.save();

  // Update snapshots
  loadMarketDailySnapshot(event, market);
  updateMetricsDailySnapshot(event);
  updateFinancials(event, amountUSD, amountUSD, amountUSD );
  // Add the snapshot id (the number of days since unix epoch) for easier indexing for events within a specific snapshot
  repay.snapshotId = getDaysSinceEpoch(event.block.timestamp.toI32());
  repay.save();
}

export function handleLiquidationCall(event: LiquidationCall): void {
  // Liquidation event where a users collateral assets are sold to reduce the ratio to borrowed assets
  const hash = event.transaction.hash.toHexString();
  const logIdx = event.logIndex;
  const marketAddr = event.params.collateralAsset.toHexString();

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
  liquidation.timestamp = event.block.timestamp;
  liquidation.blockNumber = event.block.number;
  liquidation.amount =  event.params.liquidatedCollateralAmount;
  
  const token = initToken(event.params.collateralAsset);
  const amountUSD = amountInUSD(token, liquidation.amount);
  liquidation.amountUSD = amountUSD;
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(amountUSD);
  protocol.save();

  let market = initMarket(event, marketAddr) as Market;
  // The index of the inputToken and the inputTokenBalance are the same, as these arrays push the crresponding values to the same index when added
  const tokenBalanceIndex = getTokenBalanceIndex(market, liquidation.asset);
  if (tokenBalanceIndex >= market.inputTokens.length) {
    // if the getTokenBalanceIndex function added the event asset to the inputTokens array, reinitialize the market
    market = initMarket(event, marketAddr) as Market;
  }
  const balanceAtIdx = market.inputTokenBalances[<i32>tokenBalanceIndex];
  const newBal = balanceAtIdx.plus(liquidation.amount);
  market.inputTokenBalances = setTokenBalanceArray(newBal, tokenBalanceIndex, market.inputTokenBalances);
  market.totalVolumeUSD = market.totalVolumeUSD.plus(amountUSD);
  market.totalValueLockedUSD = market.totalValueLockedUSD.plus(amountUSD);
  market.save();

  // Update snapshots
  loadMarketDailySnapshot(event, market);
  updateMetricsDailySnapshot(event);
  updateFinancials(event, amountUSD, amountUSD, amountUSD );
  // Add the snapshot id (the number of days since unix epoch) for easier indexing for events within a specific snapshot
  liquidation.snapshotId = getDaysSinceEpoch(event.block.timestamp.toI32());
  liquidation.save();
}

export function handleReserveUsedAsCollateralEnabled(event: ReserveUsedAsCollateralEnabled): void {
  // This Event handler enables a reserve/market to be used as collateral
  const marketAddr = event.params.reserve.toHexString();
  const market = initMarket(event, marketAddr) as Market;
  market.canUseAsCollateral = true;
  market.save();
}

export function handleReserveUsedAsCollateralDisabled(event: ReserveUsedAsCollateralDisabled): void {
  // This Event handler disables a reserve/market being used as collateral
  const marketAddr = event.params.reserve.toHexString();
  const market = initMarket(event, marketAddr) as Market;
  market.canUseAsCollateral = false;
  market.save();
}