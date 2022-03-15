import {
  Burn,
  Mint,
  Initialized,
  AToken
} from "../../generated/templates/AToken/AToken";

import {
  Address,
  BigDecimal,
  BigInt
} from "@graphprotocol/graph-ts";

import {
  Market,
  RewardToken
} from "../../generated/schema";

import { AaveIncentivesController as IncentivesControllerContract } from "../../generated/templates/IncentivesController/AaveIncentivesController";

import {
  initToken,
  initRewardToken,
  zeroAddr,
  getLendingPoolFromCtx,
  rayDivision
} from "./utilFunctions";

// Code written to pull a Token entity by its aToken. Leaving code commented here for now in case needed 
// let aTokenInstance = AToken.bind(event.address);
// let tokenAddr = aTokenInstance.UNDERLYING_ASSET_ADDRESS();
// let token = initToken(tokenAddr);

function initMarket(): Market {
  //Function to load the lending pool by context
  let marketAddr = getLendingPoolFromCtx();
  return Market.load(marketAddr) as Market;
}

// ALL BELOW EVENT HANDLERS WILL TRIGGER A MARKET SNAPSHOT. VERIFY IF OTHER EVENTS FOR THIS TEMPLATE WILL NEED TO AS WELL

// THE MINT/BURN HANDLERS ARE WHAT MANAGE THE INPUT/OUTPUT TOKEN SUPPLY/BALANCE.
// Need to do more research about the scaling, liquidity index etc in order to properly update the balances after burn/mint.
// The current supply/balance updating is more of a placeholder. These have to be revised and verified

export function handleATokenMint(event: Mint): void {
  // Event handler for AToken mints. This gets triggered upon deposits, borrows etc

  const market = initMarket();
  const mintedAmount = event.params.value;
  const liquidityIndex = event.params.index;
  const scaledMintedAmount = new BigDecimal(rayDivision(mintedAmount, liquidityIndex));
  const beforeScaledSupply = market.outputTokenSupply;
  const afterScaledSupply = beforeScaledSupply.plus(scaledMintedAmount);

  const inputTokenBals: BigDecimal[] = market.inputTokenBalances;
  inputTokenBals[0] = afterScaledSupply;
  market.inputTokenBalances = inputTokenBals;
  market.outputTokenSupply = scaledMintedAmount;
  market.save();
}

export function handleATokenBurn(event: Burn): void {
  // Event handler for AToken burns. This gets triggered upon withdraws, repays etc

  const market = initMarket();
  const burnedAmount = event.params.value;
  const liquidityIndex = event.params.index;
  const scaledBurnedAmount = new BigDecimal(rayDivision(burnedAmount, liquidityIndex));
  const beforeScaledSupply = market.outputTokenSupply;
  const afterScaledSupply = beforeScaledSupply.minus(scaledBurnedAmount);

  const inputTokenBals: BigDecimal[] = market.inputTokenBalances;
  inputTokenBals[0] = afterScaledSupply;
  market.inputTokenBalances = inputTokenBals;
  market.outputTokenSupply = scaledBurnedAmount;
  market.save();
}

export function handleATokenInitialized(event: Initialized): void {
  // This function handles when an AToken is initialized in a new lending pool.
  // This function serves to get the reward token for a given market, as the incentives controller is received in the parametes

  // let token = initToken(event.params.underlyingAsset);
  const marketAddr = event.params.pool.toHexString();
  const market = Market.load(marketAddr) as Market;
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