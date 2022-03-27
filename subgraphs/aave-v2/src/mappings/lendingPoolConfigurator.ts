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
import { initToken, initMarket, getOutputTokenSupply } from "./utilFunctions";
import { AToken } from "../../generated/templates/AToken/AToken";
import { IERC20 } from "../../generated/templates/LendingPool/IERC20";

export function getLendingPoolFromCtx(): string {
  // Get the lending pool with context
  let context = dataSource.context();
  return context.getString("lendingPool");
}

export function handleReserveInitialized(event: ReserveInitialized): void {
  // This function handles market entity from reserve creation event
  // Attempt to load or create the market implementation
  const market = initMarket(
    event,
    event.params.asset.toHexString(),
  );

  // If the initMarket could not successfully set the reserve aToken, check these methods for valid data returned/failure.
  const currentOutputToken = AToken.bind(Address.fromString(market.outputToken));
  const tryUnderlyingAsset = currentOutputToken.try_UNDERLYING_ASSET_ADDRESS();
  const tryGetIncCont = currentOutputToken.try_getIncentivesController();
  const tryGetTotalSupply = currentOutputToken.try_totalSupply();

  if (tryUnderlyingAsset.reverted || tryGetIncCont.reverted || tryGetTotalSupply.reverted) {
    // If any of the methods revert, pull the aToken contract from the param aToken
    market.outputToken = event.params.aToken.toHexString();
    market.outputTokenSupply = getOutputTokenSupply(event.params.aToken);
    initToken(Address.fromString(market.outputToken))
    log.info('CHANGED MARKET OUTPUT FROM ' + currentOutputToken._address.toHexString() + " to " + market.outputToken, [])
    market.save()
  }
  log.info('CREATED? ' + market.id + 'on block# ' + market.createdBlockNumber.toString(), [])
}

export function handleCollateralConfigurationChanged(event: CollateralConfigurationChanged): void {
  // Adjust market LTV, liquidation, and collateral data when a reserve's collateral configuration has changed 
  const marketAddr = event.params.asset.toHexString();
  log.info('MarketAddr in lendingPoolConfigurator.ts handleCollateralConfigurationChanged' + marketAddr , [])
  const market = initMarket(event, marketAddr) as Market;
  market.maximumLTV = new BigDecimal(event.params.ltv);
  market.liquidationThreshold = new BigDecimal(event.params.liquidationThreshold);
  market.save();
}

export function handleBorrowingEnabledOnReserve(event: BorrowingEnabledOnReserve): void {
  // Upon enabling borrowing on this market, set market.canBorrowFrom to true
  const marketAddr = event.params.asset.toHexString();
  log.info('MarketAddr in lendingPoolConfigurator.ts handleBorrowingEnabledReserve' + marketAddr , []);
  const market = initMarket(event, marketAddr) as Market;
  market.canBorrowFrom = true;
  market.save();
}

export function handleBorrowingDisabledOnReserve(event: BorrowingDisabledOnReserve): void {
  // Upon disabling borrowing on this market, set market.canBorrowFrom to false
  const marketAddr = event.params.asset.toHexString();
  log.info('MarketAddr in lendingPoolConfigurator.ts handleBorrowingDisabledOnReserve' + marketAddr , []);
  const market = initMarket(event, marketAddr) as Market;
  market.canBorrowFrom = false;
  market.save();
}

export function handleReserveActivated(event: ReserveActivated): void {
  // Upon activating this lending pool, set market.isActive to true
  const marketAddr = event.params.asset.toHexString();
  log.info('MarketAddr in lendingPoolConfigurator.ts handleReserveActivated' + marketAddr , []);
  const market = initMarket(event, marketAddr) as Market;
  market.isActive = true;
  market.save();
}

export function handleReserveDeactivated(event: ReserveDeactivated): void {
  // Upon deactivating this lending pool, set market.isActive to false
  const marketAddr = event.params.asset.toHexString();
  log.info('MarketAddr in lendingPoolConfigurator.ts handleReserveDeactivated' + marketAddr , []);
  const market = initMarket(event, marketAddr) as Market;
  market.isActive = false;
  market.save();
}