import {
  BigInt,
  Address,
  dataSource,
  log
} from '@graphprotocol/graph-ts';

import {
  Deposit,
  Withdraw,
  Borrow,
  Repay,
  ReserveDataUpdated,
  LiquidationCall,
  ReserveUsedAsCollateralEnabled,
  ReserveUsedAsCollateralDisabled
} from '../../generated/templates/LendingPool/LendingPool';

import {
  Deposit as DepositEntity,
  Withdraw as WithdrawEntity,
  Borrow as BorrowEntity,
  Repay as RepayEntity,
  Liquidation as LiquidationEntity,
  Market
} from '../../generated/schema';

import {
  fetchProtocolEntity,
  getProtocolIdFromCtx,
  initToken,
  initMarket,
  amountInUSD,
  updateFinancials,
  getMarketDailySnapshot,
  updateMetricsDailySnapshot,
  getDaysSinceEpoch,
  updateTVL,
  calculateRevenues,
  rayToWad
} from './utilFunctions';

import { BIGINT_ZERO } from '../common/constants';

import { bigIntToBigDecimal } from '../common/utils/numbers';

export function getLendingPoolFromCtx (): string {
  // Get the lending pool/market address with context
  const context = dataSource.context();
  return context.getString('lendingPool');
}

export function getTokenBalanceIndex (market: Market, asset: string): number {
  // The index of the inputToken and the inputTokenBalance are the same, as these arrays push the corresponding values to the same index when added
  let tokenBalanceIndex = market.inputTokens.indexOf(asset);
  if (tokenBalanceIndex < 0) {
    log.error('Transaction event asset/reserve not in market.inputTokens - ' + asset + 'index: ' + tokenBalanceIndex.toString() + ' eq ' + (tokenBalanceIndex < 0).toString(), []);
    tokenBalanceIndex = market.inputTokens.length;
    initToken(Address.fromString(asset));
    market.inputTokens.push(asset);
    market.inputTokenBalances.push(BIGINT_ZERO);
    market.save();
  }
  log.info('returning token index' + tokenBalanceIndex.toString(), []);
  return <i32>tokenBalanceIndex;
}

export function setTokenBalanceArray (newBal: BigInt, tokenBalanceIndex: number, tokenBalances: BigInt[]): BigInt[] {
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

export function handleReserveDataUpdated (event: ReserveDataUpdated): void {
  // This event handler updates the deposit/borrow rates on a market when the state of a reserve is updated
  const market = initMarket(event.block.number, event.block.timestamp, event.params.reserve.toHexString()) as Market;
  const token = initToken(Address.fromString(market.id));
  // The rates provided in params are in ray format (27 dec). Convert to decimal format
  market.depositRate = bigIntToBigDecimal(rayToWad(event.params.liquidityRate));
  market.variableBorrowRate = bigIntToBigDecimal(rayToWad(event.params.variableBorrowRate));
  market.stableBorrowRate = bigIntToBigDecimal(rayToWad(event.params.stableBorrowRate));
  log.info('RESERVE DATA UPDATED DEC: ' + token.decimals.toString() + ' ' + market.depositRate.toString() + ' ' + market.variableBorrowRate.toString() + ' ' + event.params.variableBorrowRate.toString() + ' ' + market.stableBorrowRate.toString() + ' ' + event.params.stableBorrowRate.toString(), [])
  market.save()
}

// BELOW EVENT HANDLERS EXECUTE ON USER ACTIONS UPON A LENDING POOL
// The transaction is sent to the market address, but event.transaction.to can be null, so this cannot be set for the 'to' field of the below entities
// Market address is set to value returned from getLendingPoolFromCtx(), which pulls the current marketAddr from context

export function handleDeposit (event: Deposit): void {
  log.info('DEPO' + event.transaction.hash.toHexString(), []);
  // Deposit event to a lending pool triggers this handler
  const hash = event.transaction.hash.toHexString();
  const marketAddr = event.params.reserve.toHexString();
  const protocolId = getProtocolIdFromCtx();
  const protocol = fetchProtocolEntity(protocolId);
  // Initialize the reserve token
  const token = initToken(event.params.reserve);
  // Instantiate the deposit entity with the specified string construction as id
  log.info('DEPOSIT AMT: ' + event.params.amount.toString() + ' ' + event.transaction.hash.toHexString(), [])
  const deposit = new DepositEntity(hash + '-' + event.logIndex.toHexString());
  deposit.to = marketAddr;
  deposit.market = marketAddr;
  deposit.from = event.transaction.from.toHexString();
  deposit.hash = hash;
  deposit.logIndex = event.logIndex.toI32();
  deposit.protocol = protocol.id;
  deposit.timestamp = event.block.timestamp;
  deposit.blockNumber = event.block.number;
  // The reserve param is the asset contract address
  deposit.asset = event.params.reserve.toHexString();
  deposit.amount = event.params.amount;
  
  let market = initMarket(event.block.number, event.block.timestamp, marketAddr) as Market;
  const amountUSD = amountInUSD(token.id, token.decimals, event.params.amount, market);
  deposit.amountUSD = amountUSD;
  // Get the index of the balance to be changed
  const tokenBalanceIndex = getTokenBalanceIndex(market, deposit.asset);
  if (tokenBalanceIndex >= market.inputTokens.length) {
    // if the getTokenBalanceIndex function added the event asset to the inputTokens array, reinitialize the market
    market = initMarket(event.block.number, event.block.timestamp, marketAddr) as Market;
  }
  const balanceAtIdx = market.inputTokenBalances[<i32>tokenBalanceIndex];
  const newBal = balanceAtIdx.plus(deposit.amount);
  market.inputTokenBalances = setTokenBalanceArray(newBal, tokenBalanceIndex, market.inputTokenBalances);

  // Update total value locked on the market level
  updateTVL(token, market, protocol, deposit.amount, false);
  market.save();

  // Update snapshots
  getMarketDailySnapshot(event, market);
  updateMetricsDailySnapshot(event);
  updateFinancials(event);
  // Add the snapshot id (the number of days since unix epoch) for easier indexing for events within a specific snapshot
  deposit.snapshotId = getDaysSinceEpoch(event.block.timestamp.toI32());
  deposit.save();
}

export function handleWithdraw (event: Withdraw): void {
  // Withdraw event from a lending pool to a user triggers this handler
  log.info('WITH AMT ' + event.params.amount.toString() + ' ' + event.transaction.hash.toHexString(), [])
  const hash = event.transaction.hash.toHexString();
  const marketAddr = event.params.reserve.toHexString();
  const protocolId = getProtocolIdFromCtx();
  const protocol = fetchProtocolEntity(protocolId);
  const token = initToken(event.params.reserve);
  const withdraw = new WithdrawEntity(hash + '-' + event.logIndex.toHexString());
  // The tokens are sent to the address listed as the 'to' param field of the event
  // NOT 'to' property of event.transaction which marketAddr is set to
  
  withdraw.to = event.transaction.from.toHexString();
  withdraw.market = marketAddr;
  withdraw.from = marketAddr;
  withdraw.hash = hash;
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.asset = event.params.reserve.toHexString();
  withdraw.protocol = protocol.id || protocolId;
  withdraw.timestamp = event.block.timestamp;
  withdraw.blockNumber = event.block.number;
  withdraw.amount = event.params.amount;
  
  let market = initMarket(event.block.number, event.block.timestamp, marketAddr) as Market;
  const amountUSD = amountInUSD(token.id, token.decimals, event.params.amount, market);
  withdraw.amountUSD = amountUSD;
  // The index of the inputToken and the inputTokenBalance are the same, as these arrays push the crresponding values to the same index when added
  const tokenBalanceIndex = getTokenBalanceIndex(market, withdraw.asset);
  if (tokenBalanceIndex >= market.inputTokens.length) {
    // if the getTokenBalanceIndex function added the event asset to the inputTokens array, reinitialize the market
    market = initMarket(event.block.number, event.block.timestamp, marketAddr) as Market;
  }
  const balanceAtIdx = market.inputTokenBalances[<i32>tokenBalanceIndex];
  const newBal = balanceAtIdx.minus(withdraw.amount);
  market.inputTokenBalances = setTokenBalanceArray(newBal, tokenBalanceIndex, market.inputTokenBalances);

  // Update total value locked on the market level
  updateTVL(token, market, protocol, withdraw.amount, true);
  market.save();
  // Update snapshots
  getMarketDailySnapshot(event, market);
  updateMetricsDailySnapshot(event);
  updateFinancials(event);
  // Add the snapshot id (the number of days since unix epoch) for easier indexing for events within a specific snapshot
  withdraw.snapshotId = getDaysSinceEpoch(event.block.timestamp.toI32());
  withdraw.save();
}

export function handleBorrow (event: Borrow): void {
  // Borrow event from a lending pool to a user triggers this handler
  // Stable: 1, Variable: 2
  log.info('BORROW - MODE: ' + event.params.borrowRateMode.toString() + ' amt ' + event.params.amount.toString() + ' ' + event.transaction.hash.toHexString(), [])
  // Depending on borrow mode, add to stable/variable tvl and trigger total fee calculation
  const hash = event.transaction.hash.toHexString();
  const marketAddr = event.params.reserve.toHexString();
  const protocolId = getProtocolIdFromCtx();
  const protocol = fetchProtocolEntity(protocolId);
  const token = initToken(event.params.reserve);
  const borrow = new BorrowEntity(hash + '-' + event.logIndex.toHexString());
  borrow.to = event.transaction.from.toHexString();
  borrow.market = marketAddr;
  borrow.from = marketAddr;
  borrow.hash = hash;
  borrow.logIndex = event.logIndex.toI32();
  borrow.asset = event.params.reserve.toHexString();
  borrow.protocol = protocol.id || protocolId;
  borrow.timestamp = event.block.timestamp;
  borrow.blockNumber = event.block.number;
  borrow.amount = event.params.amount;
  
  let market = initMarket(event.block.number, event.block.timestamp, marketAddr) as Market;
  const amountUSD = amountInUSD(token.id, token.decimals, event.params.amount, market);
  borrow.amountUSD = amountUSD;
  // Add the borrow amount in USD to total volume on the market ('total loan origination')
  // The index of the inputToken and the inputTokenBalance are the same, as these arrays push the crresponding values to the same index when added
  const tokenBalanceIndex = getTokenBalanceIndex(market, borrow.asset);
  if (tokenBalanceIndex >= market.inputTokens.length) {
    // if the getTokenBalanceIndex function added the event asset to the inputTokens array, reinitialize the market
    market = initMarket(event.block.number, event.block.timestamp, marketAddr) as Market;
  }
  const balanceAtIdx = market.inputTokenBalances[<i32>tokenBalanceIndex];
  const newBal = balanceAtIdx.minus(borrow.amount);
  market.inputTokenBalances = setTokenBalanceArray(newBal, tokenBalanceIndex, market.inputTokenBalances);

  // Update total value locked on the market level
  updateTVL(token, market, protocol, borrow.amount, true);
  // Calculate the revenues and fees as a result of the borrow
  calculateRevenues(market, token);
  market.totalVolumeUSD = market.totalVolumeUSD.plus(amountUSD);
  market.save();

  // Update snapshots
  getMarketDailySnapshot(event, market);
  updateMetricsDailySnapshot(event);
  const financial = updateFinancials(event);
  // Add the borrow amount in USD to total volume on the daily financial snapshot ('total loan origination')
  financial.totalVolumeUSD = financial.totalVolumeUSD.plus(amountUSD);
  financial.save();
  // Add the snapshot id (the number of days since unix epoch) for easier indexing for events within a specific snapshot
  borrow.snapshotId = getDaysSinceEpoch(event.block.timestamp.toI32());
  borrow.save();
}

export function handleRepay (event: Repay): void {
  // Repay event from a user who is paying back into a pool that they borrowed from
  log.info('REPAY AMT ' + event.params.amount.toString() + ' ' + event.transaction.hash.toHexString(), [])
  const hash = event.transaction.hash.toHexString();
  const marketAddr = event.params.reserve.toHexString();
  const protocolId = getProtocolIdFromCtx();
  const protocol = fetchProtocolEntity(protocolId);
  const token = initToken(event.params.reserve);
  const repay = new RepayEntity(hash + '-' + event.logIndex.toHexString());
  repay.to = marketAddr;
  repay.market = marketAddr;
  repay.from = event.transaction.from.toHexString();
  repay.hash = hash;
  repay.logIndex = event.logIndex.toI32();
  repay.asset = event.params.reserve.toHexString();
  repay.protocol = protocol.id || protocolId;
  repay.timestamp = event.block.timestamp;
  repay.blockNumber = event.block.number;
  repay.amount = event.params.amount;
  
  let market = initMarket(event.block.number, event.block.timestamp, marketAddr) as Market;
  const amountUSD = amountInUSD(token.id, token.decimals, event.params.amount, market);
  repay.amountUSD = amountUSD;
  // The index of the inputToken and the inputTokenBalance are the same, as these arrays push the crresponding values to the same index when added
  const tokenBalanceIndex = getTokenBalanceIndex(market, repay.asset);
  if (tokenBalanceIndex >= market.inputTokens.length) {
    // if the getTokenBalanceIndex function added the event asset to the inputTokens array, reinitialize the market
    market = initMarket(event.block.number, event.block.timestamp, marketAddr) as Market;
  }
  const balanceAtIdx = market.inputTokenBalances[<i32>tokenBalanceIndex];
  const newBal = balanceAtIdx.plus(repay.amount);
  market.inputTokenBalances = setTokenBalanceArray(newBal, tokenBalanceIndex, market.inputTokenBalances);

  // Update total value locked on the market level
  updateTVL(token, market, protocol, repay.amount, false);
  calculateRevenues(market, token);
  market.save();

  // Update snapshots
  getMarketDailySnapshot(event, market);
  updateMetricsDailySnapshot(event);
  updateFinancials(event);
  // Add the snapshot id (the number of days since unix epoch) for easier indexing for events within a specific snapshot
  repay.snapshotId = getDaysSinceEpoch(event.block.timestamp.toI32());
  repay.save();
}

export function handleLiquidationCall (event: LiquidationCall): void {
  // Liquidation event where a users collateral assets are sold to reduce the ratio to borrowed assets
  const hash = event.transaction.hash.toHexString();
  const marketAddr = event.params.collateralAsset.toHexString();
  const protocolId = getProtocolIdFromCtx();
  const protocol = fetchProtocolEntity(protocolId);
  const token = initToken(event.params.collateralAsset);
  const liquidation = new LiquidationEntity(hash + '-' + event.logIndex.toHexString());
  // Liquidation.to is set to the market address
  liquidation.to = marketAddr;
  liquidation.market = marketAddr;
  liquidation.from = event.params.liquidator.toHexString();
  liquidation.hash = hash;
  liquidation.logIndex = event.logIndex.toI32();
  liquidation.asset = event.params.collateralAsset.toHexString();
  liquidation.protocol = protocol.id || protocolId;
  liquidation.timestamp = event.block.timestamp;
  liquidation.blockNumber = event.block.number;
  liquidation.amount = event.params.liquidatedCollateralAmount;
  
  let market = initMarket(event.block.number, event.block.timestamp, marketAddr) as Market;
  const amountUSD = amountInUSD(token.id, token.decimals, event.params.liquidatedCollateralAmount, market);
  liquidation.amountUSD = amountUSD;
  // The index of the inputToken and the inputTokenBalance are the same, as these arrays push the crresponding values to the same index when added
  const tokenBalanceIndex = getTokenBalanceIndex(market, liquidation.asset);
  if (tokenBalanceIndex >= market.inputTokens.length) {
    // if the getTokenBalanceIndex function added the event asset to the inputTokens array, reinitialize the market
    market = initMarket(event.block.number, event.block.timestamp, marketAddr) as Market;
  }
  const balanceAtIdx = market.inputTokenBalances[<i32>tokenBalanceIndex];
  const newBal = balanceAtIdx.plus(liquidation.amount);
  market.inputTokenBalances = setTokenBalanceArray(newBal, tokenBalanceIndex, market.inputTokenBalances);

  // Update total value locked on the market level
  updateTVL(token, market, protocol, liquidation.amount, false);
  calculateRevenues(market, token);
  // Update snapshots
  getMarketDailySnapshot(event, market);
  updateMetricsDailySnapshot(event);
  updateFinancials(event);
  // Add the snapshot id (the number of days since unix epoch) for easier indexing for events within a specific snapshot
  liquidation.snapshotId = getDaysSinceEpoch(event.block.timestamp.toI32());
  liquidation.save();
}

export function handleReserveUsedAsCollateralEnabled (event: ReserveUsedAsCollateralEnabled): void {
  // This Event handler enables a reserve/market to be used as collateral
  const marketAddr = event.params.reserve.toHexString();
  const market = initMarket(event.block.number, event.block.timestamp, marketAddr) as Market;
  market.canUseAsCollateral = true;
  market.save();
}

export function handleReserveUsedAsCollateralDisabled (event: ReserveUsedAsCollateralDisabled): void {
  // This Event handler disables a reserve/market being used as collateral
  const marketAddr = event.params.reserve.toHexString();
  const market = initMarket(event.block.number, event.block.timestamp, marketAddr) as Market;
  market.canUseAsCollateral = false;
  market.save();
}
