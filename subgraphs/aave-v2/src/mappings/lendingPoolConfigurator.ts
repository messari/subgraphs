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
  ReserveDeactivated,
  ReserveFactorChanged
} from "../../generated/templates/LendingPoolConfigurator/LendingPoolConfigurator";

import { Token, Market } from "../../generated/schema";
import {
  initToken,
  initMarket,
  getOutputTokenSupply,
  getRewardTokenFromIncController,
  loadRewardToken,
  getAssetPriceInUSDC,
  rayToWad
} from "./utilFunctions";

import { AToken } from "../../generated/templates/AToken/AToken";
import {
  IncentivesController,
  AToken as ATokenTemplate
} from "../../generated/templates";

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
  const aToken = initToken(event.params.aToken);
  market.outputToken = event.params.aToken.toHexString();
  market.outputTokenSupply = getOutputTokenSupply(event.params.aToken);
  market.outputTokenPriceUSD = getAssetPriceInUSDC(aToken);

  // Set the s/vToken addresses from params
  market.sToken = event.params.stableDebtToken.toHexString();
  market.vToken = event.params.variableDebtToken.toHexString();
  
  // !!! IS THIS NEEDED? MOST RESERVES INIT BEFORE INCENTIVE CONTROLLERS EXISTED
  // Attempt to get the incentive controller
  const currentOutputToken = AToken.bind(Address.fromString(market.outputToken));
  if (!currentOutputToken.try_getIncentivesController().reverted) {
    const incContAddr = currentOutputToken.try_getIncentivesController().value;
    log.info('NEW RESERVE INCENTIVE CONTROLLER ' + incContAddr.toHexString(), [])
    IncentivesController.create(currentOutputToken.try_getIncentivesController().value);
    const rewardToken = getRewardTokenFromIncController(incContAddr, market);
    loadRewardToken(Address.fromString(rewardToken.id), market);
  } else {
    log.info('FAILED TO GET INCENTIVE CONTROLLER ' + currentOutputToken._address.toHexString() + ' ' + market.id, [])
  }
  market.save();
}

export function handleCollateralConfigurationChanged(event: CollateralConfigurationChanged): void {
  // Adjust market LTV, liquidation, and collateral data when a reserve's collateral configuration has changed 
  const marketAddr = event.params.asset.toHexString();
  log.info('MarketAddr in lendingPoolConfigurator.ts handleCollateralConfigurationChanged' + marketAddr, [])
  const market = initMarket(event.block.number, event.block.timestamp, marketAddr) as Market;
  const token = initToken(Address.fromString(market.id));
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
  
  // !!! THIS SHOULD PROBABLY ALLOW FOR FRACTIONS OF A PERCENT, CURRENTLY ROUNDS TO TWO DIGIT PERCENTAGES
  // Set the reserve factor as a percentage (ie saved as 20 for 20%)
  market.reserveFactor = (event.params.factor).div(BigInt.fromI32(100));
  market.save();
}