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
import { createMarket, initToken, loadMarket, zeroAddr } from "./utilFunctions";
import { LendingPool } from "../../generated/templates/LendingPool/LendingPool";

export function getLendingPoolFromCtx(): string {
  // Get the lending pool/market address with context
  // Need to verify that context is available here, not just the lendingPoolConfigurator.ts script
  let context = dataSource.context();
  return context.getString("lendingPool");
}

export function handleReserveInitialized(event: ReserveInitialized): void {
  // This function handles market/lending pool/reserve creation
  // Attempt to load the market implementation using the loadMarket() function
  const lendingPool = getLendingPoolFromCtx();
  log.info('lendingPool From Context in lendingPoolConfigurator.ts handleReserveInitialized: ' + lendingPool , [lendingPool])
  let LP = LendingPool.bind(Address.fromString(lendingPool));
  let tryReserve = LP.try_getReserveData(event.params.asset)
  let reserveId = -1
  let reserveStableRate = new BigDecimal(BigInt.fromI32(0));
  let reserveVariableRate = new BigDecimal(BigInt.fromI32(0));
  if (!tryReserve.reverted) {
    reserveId = tryReserve.value.id;
    reserveStableRate = new BigDecimal(tryReserve.value.currentStableBorrowRate);
    reserveVariableRate = new BigDecimal(tryReserve.value.currentVariableBorrowRate);
    log.info('reserve? ' + reserveId.toString() + '   -    ' + event.params.asset.toHexString(), [])
  } else {
    log.error('FAILED TO GET RESERVE', [''])
  }

  let market = Market.load(event.params.asset.toHexString());
  if (market === null) {

    // If the market entity has not been created yet, send the following data to the createMarket function to initialize a new implementation of a Market entity
    // The lending pool asset and corresponding aToken asset are loaded or created as an implementation of a Token entity
    const token = initToken(event.params.asset);
    const aToken = initToken(event.params.aToken);
    // The input token, which would be the event token implemented above
    const inputTokens: Token[] = [token];
    // rewardTokens array initiated as empty
    // The reward token address is pulled from the contract in the handleATokenInitialized event handler in the aToken.ts mapping script
    market = createMarket(
        event,
        event.params.asset.toHexString(),
        inputTokens,
        aToken,
        reserveStableRate,
        reserveVariableRate
    );
    log.info('CREATED? ' + market.id + 'on block# ' + market.createdBlockNumber.toString(), [])
  }
}

export function handleCollateralConfigurationChanged(event: CollateralConfigurationChanged): void {
  // Adjust market LTV, liquidation, and collateral data when the lending pool's collateral configuration has changed 
  const marketAddr = event.params.asset;
  log.info('MarketAddr From Context in lendingPoolConfigurator.ts handleCollateralConfigurationChanged' + marketAddr.toHexString() , [])
  const market = loadMarket(marketAddr.toHexString()) as Market;
  market.maximumLTV = new BigDecimal(event.params.ltv);
  market.liquidationThreshold = new BigDecimal(event.params.liquidationThreshold);
  market.save();
}

export function handleBorrowingEnabledOnReserve(event: BorrowingEnabledOnReserve): void {
  // Upon enabling borrowing on this lending pool, set market.canBorrowFrom to true
  const marketAddr = event.params.asset.toHexString();
  log.info('MarketAddr From Context in lendingPoolConfigurator.ts handleBorrowingEnabledReserve' + marketAddr , [marketAddr])
  const market = loadMarket(marketAddr) as Market;
  market.canBorrowFrom = true;
  market.save();
}

export function handleBorrowingDisabledOnReserve(event: BorrowingDisabledOnReserve): void {
  // Upon disabling borrowing on this lending pool, set market.canBorrowFrom to false
  const marketAddr = event.params.asset.toHexString();
  log.info('MarketAddr From Context in lendingPoolConfigurator.ts handleBorrowingDisabledOnReserve' + marketAddr , [marketAddr])
  const market = loadMarket(marketAddr) as Market;
  market.canBorrowFrom = false;
  market.save();
}

export function handleReserveActivated(event: ReserveActivated): void {
  // Upon activating this lending pool, set market.isActive to true
  const marketAddr = event.params.asset.toHexString();
  log.info('MarketAddr From Context in lendingPoolConfigurator.ts handleReserveActivated' + marketAddr , [marketAddr])
  const market = loadMarket(marketAddr) as Market;
  market.isActive = true;
  market.save();
}

export function handleReserveDeactivated(event: ReserveDeactivated): void {
  // Upon deactivating this lending pool, set market.isActive to false
  const marketAddr = event.params.asset.toHexString();
  log.info('MarketAddr From Context in lendingPoolConfigurator.ts handleReserveDeactivated' + marketAddr , [marketAddr])
  const market = loadMarket(marketAddr) as Market;
  market.isActive = true;
  market.save();
}