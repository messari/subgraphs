import {
  Burn,
  Mint,
  Initialized,
  AToken
} from "../../generated/templates/AToken/AToken";

import {

  log
} from "@graphprotocol/graph-ts";

import { AaveIncentivesController as IncentivesControllerContract } from "../../generated/templates/IncentivesController/AaveIncentivesController";

import {
  initToken,
  initRewardToken,
  zeroAddr,
  rayDivision,
  initMarket
} from "./utilFunctions";

// Code written to pull a Token entity by its aToken. Leaving code commented here for now in case needed 

// ALL BELOW EVENT HANDLERS WILL TRIGGER A MARKET SNAPSHOT. VERIFY IF OTHER EVENTS FOR THIS TEMPLATE WILL NEED TO AS WELL

// THE MINT/BURN HANDLERS ARE WHAT MANAGE THE OUTPUT TOKEN SUPPLY
// Need to do more research about the scaling, liquidity index etc in order to properly update the balances after burn/mint.
// The current supply/balance updating is more of a placeholder. These have to be revised and verified

export function handleATokenMint(event: Mint): void {
  // Event handler for AToken mints. This gets triggered upon deposits
  const aTokenAddr = event.address;
  const aToken = AToken.bind(aTokenAddr);
  const tryInputToken = aToken.try_UNDERLYING_ASSET_ADDRESS();
  let marketAddr = '';
  if (!tryInputToken.reverted) {
    marketAddr = tryInputToken.value.toHexString();
  }
  const market = initMarket(event.block.number, event.block.timestamp, marketAddr, event.address);
  market.outputTokenSupply = aToken.totalSupply();
  market.save();
}

export function handleATokenBurn(event: Burn): void {
  // Event handler for AToken burns. This gets triggered upon withdraws
  const aTokenAddr = event.address;
  const aToken = AToken.bind(aTokenAddr);
  const marketAddr = aToken.POOL();
  const market = initMarket(event.block.number, event.block.timestamp, marketAddr.toHexString(), event.address);
  market.outputTokenSupply = aToken.totalSupply();
  market.save();
}

export function handleATokenInitialized(event: Initialized): void {
  // This function handles when an AToken is initialized in a new lending pool.
  // This function serves to get the reward token for a given market, as the incentives controller is received in the parametes
  const aTokenAddr = event.address;
  const aToken = AToken.bind(aTokenAddr);
  log.info('aToken POOL | underlying asset ' + aToken.POOL().toHexString() + ' ... ' + aToken.UNDERLYING_ASSET_ADDRESS().toHexString(), [])
  const marketAddr = aToken.UNDERLYING_ASSET_ADDRESS();
  const market = initMarket(event.block.number, event.block.timestamp, marketAddr.toHexString(), event.address);
  const incentivesControllerAddr = event.params.incentivesController;
  if (incentivesControllerAddr.toHexString() != zeroAddr) {
    // Instantiate IncentivesController to get access to contract read methods
    const contract = IncentivesControllerContract.bind(incentivesControllerAddr);
    // Get the contract Reward Token's address
    let rewardTokenAddr = contract.REWARD_TOKEN();
    // Load/Create the Reward Token as an entity
    // SHOULD THE REWARD TOKEN BE CREATED AS A 'Token' ENTITY AS WELL?
    // HOW TO PULL THE REWARD TOKEN 'type'?
    initRewardToken(rewardTokenAddr, market);
  }
}