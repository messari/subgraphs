import {
  Burn,
  Mint,
  AToken
} from '../../generated/templates/AToken/AToken';

import {
  initMarket,
  getMarketDailyId
} from './utilFunctions';

import { log } from '@graphprotocol/graph-ts';

import { MarketDailySnapshot } from '../../generated/schema';

// Code written to pull a Token entity by its aToken. Leaving code commented here for now in case needed

// THE MINT/BURN HANDLERS ARE WHAT MANAGE THE OUTPUT TOKEN SUPPLY
// These events update the market daily snapshot output token values
// The mint/burn handlers are essentially extensions of deposit/withdraw events to manage the aToken/outputToken

export function handleATokenMint (event: Mint): void {
  // Event handler for AToken mints. This gets triggered upon deposits
  log.info('MINTING ATOKEN: ' + event.address.toHexString(), []);
  const aTokenAddr = event.address;
  const aToken = AToken.bind(aTokenAddr);
  const tryInputToken = aToken.try_UNDERLYING_ASSET_ADDRESS();
  let marketAddr = '';
  if (!tryInputToken.reverted) {
    marketAddr = tryInputToken.value.toHexString();
    const market = initMarket(event.block.number, event.block.timestamp, marketAddr);
    market.outputTokenSupply = aToken.totalSupply();
    log.info('MINT getting incentive controller ' + market.outputTokenSupply.toString(), []);
    const snapId = getMarketDailyId(event, market);
    const snap = MarketDailySnapshot.load(snapId);
    if (snap) {
      snap.outputTokenSupply = market.outputTokenSupply;
      snap.save();
    }
    market.save();
  } else {
    log.info('ATOKEN MINT REVERTED!' + marketAddr, [])
  }
}

export function handleATokenBurn (event: Burn): void {
  // Event handler for AToken burns. This gets triggered upon withdraws
  log.info('BURNING ATOKEN: ' + event.address.toHexString(), []);
  const aTokenAddr = event.address;
  const aToken = AToken.bind(aTokenAddr);
  const tryInputToken = aToken.try_UNDERLYING_ASSET_ADDRESS();
  let marketAddr = '';
  if (!tryInputToken.reverted) {
    // If able to pull the aToken's underlying asset address/market id, initialize the incentives controller and update output token supply
    marketAddr = tryInputToken.value.toHexString();
    const market = initMarket(event.block.number, event.block.timestamp, marketAddr);
    market.outputTokenSupply = aToken.totalSupply();
    const snapId = getMarketDailyId(event, market);
    const snap = MarketDailySnapshot.load(snapId);
    if (snap) {
      snap.outputTokenSupply = market.outputTokenSupply;
      snap.save();
    }
    market.save();
  } else {
    log.info('ATOKEN BURN REVERTED ' + marketAddr, []);
  }
}
