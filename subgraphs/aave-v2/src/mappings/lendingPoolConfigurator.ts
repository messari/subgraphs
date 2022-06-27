import { AToken as ATokenTemplate } from "../../generated/templates";
import { BigDecimal, dataSource, log } from "@graphprotocol/graph-ts";
import { BIGDECIMAL_HUNDRED, BIGDECIMAL_ZERO } from "../common/constants";
import {
  ReserveActivated,
  ReserveInitialized,
  ReserveDeactivated,
  ReserveFactorChanged,
  BorrowingEnabledOnReserve,
  BorrowingDisabledOnReserve,
  CollateralConfigurationChanged,
} from "../../generated/templates/LendingPoolConfigurator/LendingPoolConfigurator";
import { getOrCreateMarket, getOrCreateToken } from "../common/initializers";


export function getLendingPoolFromCtx(): string {
  // Get the lending pool with context
  const context = dataSource.context();
  return context.getString("lendingPool");
}

export function handleReserveInitialized(event: ReserveInitialized): void {
  // This function handles market entity from reserve creation event
  // Attempt to load or create the market implementation

  ATokenTemplate.create(event.params.aToken);

  const marketAddress = event.params.asset.toHexString();
  const market = getOrCreateMarket(event, marketAddress);

  // Set the aToken contract from the param aToken
  getOrCreateToken(event.params.aToken);

  market.outputToken = event.params.aToken.toHexString();
  
  // Set the s/vToken addresses from params
  market._sToken = event.params.stableDebtToken.toHexString();
  market._vToken = event.params.variableDebtToken.toHexString();
  market.save();
}

export function handleCollateralConfigurationChanged(event: CollateralConfigurationChanged): void {
  // Adjust market LTV, liquidation, and collateral data when a reserve's collateral configuration has changed
  const marketAddress = event.params.asset.toHexString();
  const market = getOrCreateMarket(event, marketAddress);

  market.maximumLTV = event.params.ltv.toBigDecimal().div(BIGDECIMAL_HUNDRED);
  market.liquidationThreshold = event.params.liquidationThreshold.toBigDecimal().div(BIGDECIMAL_HUNDRED);
  
  // The liquidation bonus value is equal to the liquidation penalty, the naming is a matter of which side of the liquidation a user is on
  // The liquidationBonus parameter comes out as above 100%, represented by a 5 digit integer over 10000 (100%).
  // To extract the expected value in the liquidationPenalty field: convert to BigDecimal, subtract by 10000 and divide by 100
  market.liquidationPenalty = new BigDecimal(event.params.liquidationBonus);
  if (market.liquidationPenalty.gt(BIGDECIMAL_ZERO)) {
    market.liquidationPenalty = market.liquidationPenalty
      .minus(BigDecimal.fromString("10000"))
      .div(BigDecimal.fromString("100"));
  } else {
    market.liquidationPenalty = BIGDECIMAL_ZERO;
  }
  market.save();
}

export function handleBorrowingEnabledOnReserve(event: BorrowingEnabledOnReserve): void {
  const marketAddress = event.params.asset.toHexString();
  const market = getOrCreateMarket(event, marketAddress);
  market.canBorrowFrom = true;
  market.save();

  log.info(
    "[BorowEnabledOnReserve] MarketId: {}", 
    [marketAddress]
  );
}

export function handleBorrowingDisabledOnReserve(event: BorrowingDisabledOnReserve): void {
  const marketAddress = event.params.asset.toHexString();
  const market = getOrCreateMarket(event, marketAddress);
  market.canBorrowFrom = false;
  market.save();

  log.info(
    "[BorowDisabledOnReserve] MarketId: {}",
    [marketAddress]
  );
}

export function handleReserveActivated(event: ReserveActivated): void {
  const marketAddress = event.params.asset.toHexString();
  const market = getOrCreateMarket(event, marketAddress);
  market.isActive = true;
  market.save();

  log.info(
    "[ReserveActivated] MarketId: {}",
    [marketAddress]
  );
}

export function handleReserveDeactivated(event: ReserveDeactivated): void {
  const marketAddress = event.params.asset.toHexString();
  const market = getOrCreateMarket(event, marketAddress);
  market.isActive = false;
  market.save();

  log.info(
    "[ReserveDeactivated] MarketId: {}",
    [marketAddress]
  );
}

export function handleReserveFactorChanged(event: ReserveFactorChanged): void {
  const marketAddress = event.params.asset.toHexString();
  const market = getOrCreateMarket(event, marketAddress);

  // Set the reserve factor as an integer * 100 of a percent 
  // (ie 2500 represents 25% of the reserve)
  market.reserveFactor = event.params.factor;
  market.save();

  log.info(
    "[ReserveFactorChanged] MarketId: {}, reserveFactor: {}",
    [marketAddress, market.reserveFactor.toString()]
  );
}
