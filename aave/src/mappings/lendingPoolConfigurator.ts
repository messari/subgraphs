import {
  Address,
  BigDecimal,
  BigInt
} from "@graphprotocol/graph-ts";

import {
  CollateralConfigurationChanged,
  ReserveInitialized,
  BorrowingEnabledOnReserve,
  BorrowingDisabledOnReserve,
  ReserveActivated,
  ReserveDeactivated
} from "../../generated/templates/LendingPoolConfigurator/LendingPoolConfigurator";

import { Token, Market } from "../../generated/schema";
import { createMarket, initToken, getLendingPoolFromCtx } from "./utilFunctions";

export function handleReserveInitialized(event: ReserveInitialized): void {
  // This function handles market/lending pool/reserve creation

  // Market address is pulled from context, which contains data about the current lendingPoolConfigurator template instance
  // getLendingPoolFromCtx() is imported from utilFunctions.ts
  let marketAddr = getLendingPoolFromCtx();
  // Attempt to load a market entity with this address as id
  let market = Market.load(marketAddr);
  if (market === null) {
    // If the market entity has not been created yet, send the following data to the createMarket function to initialize a new implementation of a Market entity
      
    // The lending pool asset is loaded or created as an implementation of a Token entity
    let token = initToken(event.params.asset);
    // The corresponding lending pool AToken is loaded or created as an implementation of a Token entity
    let aToken = initToken(event.params.aToken);
    // Is this protocol name correct?
    let protocolName = 'AAVE_POOL';
    // From my understanding, in a lending pool market there is only one input token, which would be the event token implemented above
    let inputTokens: Token[] = [token];
    // Output token is the corresponding aToken
    let outputToken = aToken;
    // rewardTokens array is initiated as empty
    // The reward token address is pulled direct from the contract in the handleATokenInitialized event handler in the aToken.ts mapping script
    let rewardTokens: Token[] = [];

    market = createMarket(
        event,
        marketAddr,
        protocolName,
        inputTokens,
        outputToken,
        rewardTokens
    );
  }
}

export function handleCollateralConfigurationChanged(event: CollateralConfigurationChanged): void {
  // Adjust market LTV, liquidation, and collateral data when the lending pool's collateral configuration has changed 
  let marketAddr = getLendingPoolFromCtx();
  let market = Market.load(marketAddr) as Market;
  market.maximumLTV = new BigDecimal(event.params.ltv);
  market.liquidationThreshold = new BigDecimal(event.params.liquidationThreshold);
  
  // If the liquidation threshold is not 0, market canUseAsCollateral is true
  // Where else/how else to get the canUseAsCollateral value? Likely this event is when this value would change
  if (market.liquidationThreshold !== new BigDecimal(new BigInt(0))) {
    market.canUseAsCollateral = true;
  } else {
    market.canUseAsCollateral = false;
  }
  market.save();
}

export function handleBorrowingEnabledOnReserve(event: BorrowingEnabledOnReserve): void {
  // Upon enabling borrowing on this lending pool, set market.canBorrowFrom to true
  let marketAddr = getLendingPoolFromCtx();
  let market = Market.load(marketAddr) as Market;
  market.canBorrowFrom = true;
  market.save();
}

export function handleBorrowingDisabledOnReserve(event: BorrowingDisabledOnReserve): void {
  // Upon disabling borrowing on this lending pool, set market.canBorrowFrom to false
  let marketAddr = getLendingPoolFromCtx();
  let market = Market.load(marketAddr) as Market;
  market.canBorrowFrom = false;
  market.save();
}

export function handleReserveActivated(event: ReserveActivated): void {
  // Upon activating this lending pool, set market.isActive to true
  let marketAddr = getLendingPoolFromCtx();
  let market = Market.load(marketAddr) as Market;
  market.isActive = true;
  market.save();
}

export function handleReserveDeactivated(event: ReserveDeactivated): void {
  // Upon deactivating this lending pool, set market.isActive to false
  let marketAddr = getLendingPoolFromCtx();
  let market = Market.load(marketAddr) as Market;
  market.isActive = true;
  market.save();
}