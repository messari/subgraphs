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
import { createMarket, initToken, getLendingPoolFromCtx, loadMarket } from "./utilFunctions";

export function handleReserveInitialized(event: ReserveInitialized): void {
  // This function handles market/lending pool/reserve creation
  // Attempt to load the market implementation using the loadMarket() function
  let market = loadMarket();
  if (market === null) {
    const marketAddr = getLendingPoolFromCtx();
    // If the market entity has not been created yet, send the following data to the createMarket function to initialize a new implementation of a Market entity
    // The lending pool asset and corresponding aToken asset are loaded or created as an implementation of a Token entity
    const token = initToken(event.params.asset);
    const aToken = initToken(event.params.aToken);
    // The input token, which would be the event token implemented above
    const inputTokens: Token[] = [token];
    // Output token is the corresponding aToken
    const outputToken = aToken;
    // rewardTokens array initiated as empty
    // The reward token address is pulled from the contract in the handleATokenInitialized event handler in the aToken.ts mapping script
    const rewardTokens: Token[] = [];
    market = createMarket(
        event,
        marketAddr,
        inputTokens,
        outputToken,
        rewardTokens
    );
  }
}

export function handleCollateralConfigurationChanged(event: CollateralConfigurationChanged): void {
  // Adjust market LTV, liquidation, and collateral data when the lending pool's collateral configuration has changed 
  const market = loadMarket() as Market;
  market.maximumLTV = new BigDecimal(event.params.ltv);
  market.liquidationThreshold = new BigDecimal(event.params.liquidationThreshold);
  market.save();
}

export function handleBorrowingEnabledOnReserve(event: BorrowingEnabledOnReserve): void {
  // Upon enabling borrowing on this lending pool, set market.canBorrowFrom to true
  const market = loadMarket() as Market;
  market.canBorrowFrom = true;
  market.save();
}

export function handleBorrowingDisabledOnReserve(event: BorrowingDisabledOnReserve): void {
  // Upon disabling borrowing on this lending pool, set market.canBorrowFrom to false
  const market = loadMarket() as Market;
  market.canBorrowFrom = false;
  market.save();
}

export function handleReserveActivated(event: ReserveActivated): void {
  // Upon activating this lending pool, set market.isActive to true
  const market = loadMarket() as Market;
  market.isActive = true;
  market.save();
}

export function handleReserveDeactivated(event: ReserveDeactivated): void {
  // Upon deactivating this lending pool, set market.isActive to false
  const market = loadMarket() as Market;
  market.isActive = true;
  market.save();
}