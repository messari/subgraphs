import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
  log
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
import { createMarket, initToken, loadMarket } from "./utilFunctions";

export function getLendingPoolFromCtx(): string {
  // Get the lending pool/market address with context
  // Need to verify that context is available here, not just the lendingPoolConfigurator.ts script
  let context = dataSource.context();
  return context.getString("lendingPool");
}

export function handleReserveInitialized(event: ReserveInitialized): void {
  // This function handles market/lending pool/reserve creation
  // Attempt to load the market implementation using the loadMarket() function
  const marketAddr = getLendingPoolFromCtx();
  log.info('MarketAddr From Context in lendingPoolConfigurator.ts handleReserveInitialized: ' + marketAddr , [marketAddr])
  let market = loadMarket(marketAddr);
  if (market === null) {

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
  const marketAddr = getLendingPoolFromCtx();
  log.info('MarketAddr From Context in lendingPoolConfigurator.ts handleCollateralConfigurationChanged' + marketAddr , [marketAddr])
  const market = loadMarket(marketAddr) as Market;
  market.maximumLTV = new BigDecimal(event.params.ltv);
  market.liquidationThreshold = new BigDecimal(event.params.liquidationThreshold);
  market.save();
}

export function handleBorrowingEnabledOnReserve(event: BorrowingEnabledOnReserve): void {
  // Upon enabling borrowing on this lending pool, set market.canBorrowFrom to true
  const marketAddr = getLendingPoolFromCtx();
  log.info('MarketAddr From Context in lendingPoolConfigurator.ts handleBorrowingEnabledReserve' + marketAddr , [marketAddr])
  const market = loadMarket(marketAddr) as Market;
  market.canBorrowFrom = true;
  market.save();
}

export function handleBorrowingDisabledOnReserve(event: BorrowingDisabledOnReserve): void {
  // Upon disabling borrowing on this lending pool, set market.canBorrowFrom to false
  const marketAddr = getLendingPoolFromCtx();
  log.info('MarketAddr From Context in lendingPoolConfigurator.ts handleBorrowingDisabledOnReserve' + marketAddr , [marketAddr])
  const market = loadMarket(marketAddr) as Market;
  market.canBorrowFrom = false;
  market.save();
}

export function handleReserveActivated(event: ReserveActivated): void {
  // Upon activating this lending pool, set market.isActive to true
  const marketAddr = getLendingPoolFromCtx();
  log.info('MarketAddr From Context in lendingPoolConfigurator.ts handleReserveActivated' + marketAddr , [marketAddr])
  const market = loadMarket(marketAddr) as Market;
  market.isActive = true;
  market.save();
}

export function handleReserveDeactivated(event: ReserveDeactivated): void {
  // Upon deactivating this lending pool, set market.isActive to false
  const marketAddr = getLendingPoolFromCtx();
  log.info('MarketAddr From Context in lendingPoolConfigurator.ts handleReserveDeactivated' + marketAddr , [marketAddr])
  const market = loadMarket(marketAddr) as Market;
  market.isActive = true;
  market.save();
}