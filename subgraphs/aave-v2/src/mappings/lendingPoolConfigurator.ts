import {
  Address,
  BigDecimal,
  dataSource,
  log
} from "@graphprotocol/graph-ts";

import {
  CollateralConfigurationChanged,
  ReserveInitialized,
  BorrowingEnabledOnReserve,
  BorrowingDisabledOnReserve,
  ReserveActivated,
  ReserveDeactivated,
  ReserveFactorChanged
} from "../../generated/templates/LendingPoolConfigurator/LendingPoolConfigurator";

import { Token, Market } from "../../generated/schema";
import {
  initToken,
  initMarket,
  getOutputTokenSupply,
  getAssetPriceInUSDC,
  rayToWad,
  initIncentivesController
} from "./utilFunctions";

import { AToken } from "../../generated/templates/AToken/AToken";
import { AToken as ATokenTemplate } from "../../generated/templates";

export function getLendingPoolFromCtx(): string {
  // Get the lending pool with context
  let context = dataSource.context();
  return context.getString("lendingPool");
}

export function handleReserveInitialized(event: ReserveInitialized): void {
  // This function handles market entity from reserve creation event
  // Attempt to load or create the market implementation

  ATokenTemplate.create(event.params.aToken);
  const market = initMarket(
    event.block.number,
    event.block.timestamp,
    event.params.asset.toHexString(),
  );

  // Set the aToken contract from the param aToken
  initToken(event.params.aToken);
  market.outputToken = event.params.aToken.toHexString();
  market.outputTokenSupply = getOutputTokenSupply(event.params.aToken);
  market.outputTokenPriceUSD = getAssetPriceInUSDC(event.params.aToken);
  log.info('RES INIT OUTPUT TOKEN PRICE ' + market.outputTokenPriceUSD.toString(), [])
  // Set the s/vToken addresses from params
  market.sToken = event.params.stableDebtToken.toHexString();
  market.vToken = event.params.variableDebtToken.toHexString();
  
  // Attempt to get the incentive controller
  const currentOutputToken = AToken.bind(Address.fromString(market.outputToken));
  initIncentivesController(currentOutputToken, market);
  market.save();
}

export function handleCollateralConfigurationChanged(event: CollateralConfigurationChanged): void {
  // Adjust market LTV, liquidation, and collateral data when a reserve's collateral configuration has changed 
  const marketAddr = event.params.asset.toHexString();
  log.info('MarketAddr in lendingPoolConfigurator.ts handleCollateralConfigurationChanged' + marketAddr, [])
  const market = initMarket(event.block.number, event.block.timestamp, marketAddr) as Market;
  market.maximumLTV = new BigDecimal(event.params.ltv);
  market.liquidationThreshold = new BigDecimal(event.params.liquidationThreshold);
  // The liquidation bonus value is equal to the liquidation penalty, the naming is a matter of which side of the liquidation a user is on
  market.liquidationPenalty = new BigDecimal(event.params.liquidationBonus);
  market.save();
}

export function handleBorrowingEnabledOnReserve(event: BorrowingEnabledOnReserve): void {
  // Upon enabling borrowing on this market, set market.canBorrowFrom to true
  const marketAddr = event.params.asset.toHexString();
  log.info('MarketAddr in lendingPoolConfigurator.ts handleBorrowingEnabledReserve' + marketAddr, []);
  const market = initMarket(event.block.number, event.block.timestamp, marketAddr) as Market;
  market.canBorrowFrom = true;
  market.save();
}

export function handleBorrowingDisabledOnReserve(event: BorrowingDisabledOnReserve): void {
  // Upon disabling borrowing on this market, set market.canBorrowFrom to false
  const marketAddr = event.params.asset.toHexString();
  log.info('MarketAddr in lendingPoolConfigurator.ts handleBorrowingDisabledOnReserve' + marketAddr, []);
  const market = initMarket(event.block.number, event.block.timestamp, marketAddr) as Market;
  market.canBorrowFrom = false;
  market.save();
}

export function handleReserveActivated(event: ReserveActivated): void {
  // Upon activating this lending pool, set market.isActive to true
  const marketAddr = event.params.asset.toHexString();
  log.info('MarketAddr in lendingPoolConfigurator.ts handleReserveActivated' + marketAddr, []);
  const market = initMarket(event.block.number, event.block.timestamp, marketAddr) as Market;
  market.isActive = true;
  market.save();
}

export function handleReserveDeactivated(event: ReserveDeactivated): void {
  // Upon deactivating this lending pool, set market.isActive to false
  const marketAddr = event.params.asset.toHexString();
  log.info('MarketAddr in lendingPoolConfigurator.ts handleReserveDeactivated' + marketAddr, []);
  const market = initMarket(event.block.number, event.block.timestamp, marketAddr) as Market;
  market.isActive = false;
  market.save();
}

export function handleReserveFactorChanged(event: ReserveFactorChanged): void {
  // Handle the reserve factor change event
  const marketAddr = event.params.asset.toHexString();
  log.info('RESERVE FACTOR MarketAddr in lendingPoolConfigurator.ts handleReserveFactorChanged ' + marketAddr + ' ' + event.params.factor.toString(), []);
  const market = initMarket(event.block.number, event.block.timestamp, marketAddr) as Market;
  // Set the reserve factor as an integer * 100 of a percent (ie 2500 represents 25% of the reserve)
  market.reserveFactor = event.params.factor;
  market.save();
}