import {
  Burn,
  Mint,
  Initialized,
  AToken
} from "../../generated/templates/AToken/AToken";

import {

  Address,
  log
} from "@graphprotocol/graph-ts";

import { AaveIncentivesController as IncentivesControllerContract } from "../../generated/templates/IncentivesController/AaveIncentivesController";

import {
  initToken,
  loadRewardToken,
  initMarket,
  getRewardTokenFromIncController,
  initIncentivesController
} from "./utilFunctions";

// Code written to pull a Token entity by its aToken. Leaving code commented here for now in case needed 

// ALL BELOW EVENT HANDLERS WILL TRIGGER A MARKET SNAPSHOT. VERIFY IF OTHER EVENTS FOR THIS TEMPLATE WILL NEED TO AS WELL

// THE MINT/BURN HANDLERS ARE WHAT MANAGE THE OUTPUT TOKEN SUPPLY
// Need to do more research about the scaling, liquidity index etc in order to properly update the balances after burn/mint.
// The current supply/balance updating is more of a placeholder. These have to be revised and verified

export function handleATokenMint(event: Mint): void {
  // Event handler for AToken mints. This gets triggered upon deposits
  log.info('MINTING ATOKEN: ' + event.address.toHexString(), [])
  const aTokenAddr = event.address;
  const aToken = AToken.bind(aTokenAddr);
  const tryInputToken = aToken.try_UNDERLYING_ASSET_ADDRESS();
  let marketAddr = '';
  if (!tryInputToken.reverted) {
    marketAddr = tryInputToken.value.toHexString();
    const market = initMarket(event.block.number, event.block.timestamp, marketAddr);
    market.outputTokenSupply = aToken.totalSupply();
    log.info('MINT getting incentive controller', [])
    initIncentivesController(aToken, market);
    market.save();
  } else {
    log.info('ATOKEN MINT REVERTED!' + marketAddr, [])
  }
}

export function handleATokenBurn(event: Burn): void {
  // Event handler for AToken burns. This gets triggered upon withdraws
  log.info('BURNING ATOKEN: ' + event.address.toHexString(), [])

  const aTokenAddr = event.address;
  const aToken = AToken.bind(aTokenAddr);
  const tryInputToken = aToken.try_UNDERLYING_ASSET_ADDRESS();
  let marketAddr = '';
  if (!tryInputToken.reverted) {
    marketAddr = tryInputToken.value.toHexString();
    const market = initMarket(event.block.number, event.block.timestamp, marketAddr);
    initIncentivesController(aToken, market);
    market.outputTokenSupply = aToken.totalSupply();
    market.save();
  } else {
    log.info('ATOKEN BURN REVERTED ' + marketAddr, [])
  }
}

export function handleATokenInitialized(event: Initialized): void {
  // This function handles when an AToken is initialized in a new lending pool.
  // This function serves to get the reward token for a given market, as the incentives controller is received in the parametes
  log.info('INITIALIZE ATOKEN: ' + event.address.toHexString(), [])
  const aTokenAddr = event.address;
  const aToken = AToken.bind(aTokenAddr);
  const marketAddr = aToken.UNDERLYING_ASSET_ADDRESS(); 
  const market = initMarket(event.block.number, event.block.timestamp, marketAddr.toHexString());
  const incentivesControllerAddr = event.params.incentivesController;
  getRewardTokenFromIncController(incentivesControllerAddr, market);
}