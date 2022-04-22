// map blockchain data to entities outlined in schema.graphql
import {
  ActionPaused1,
  MarketListed,
  NewCollateralFactor,
  NewLiquidationIncentive,
  NewPriceOracle,
} from "../../../generated/Comptroller/Comptroller";
import { createBorrow, createDeposit, createLiquidation, createRepay, createWithdraw } from "../helpers";
import { Mint, Redeem, Borrow, RepayBorrow, LiquidateBorrow } from "../../../generated/templates/cToken/CToken";
import { CToken } from "../../../generated/templates";
import { NewReserveFactor } from "../../../generated/Comptroller/cToken";
import { updateFinancials, updateMarketMetrics, updateUsageMetrics } from "../../common/metrics";
import { getOrCreateLendingProtcol, getOrCreateMarket } from "../../common/getters";
import { exponentToBigDecimal } from "../../common/utils/utils";
import { Address, DataSourceContext } from "@graphprotocol/graph-ts";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  COLLATERAL_FACTOR_OFFSET,
  COMPTROLLER_ADDRESS,
  DEFAULT_DECIMALS,
} from "../../common/utils/constants";

export function handleActionPaused(event: ActionPaused1): void {
  let market = getOrCreateMarket(event, event.params.cToken, COMPTROLLER_ADDRESS);
  if (event.params.action == "Mint") {
    market.isActive = event.params.pauseState;
  } else if (event.params.action == "Borrow") {
    market.canBorrowFrom = event.params.pauseState;
  }
  market.save();
}

export function handleMarketListed(event: MarketListed): void {
  // create new market now that the data source is instantiated
  let context = new DataSourceContext();
  context.setString("protocolAddress", COMPTROLLER_ADDRESS);
  CToken.createWithContext(event.params.cToken, context);
  getOrCreateMarket(event, event.params.cToken, COMPTROLLER_ADDRESS);
}

export function handleNewPriceOracle(event: NewPriceOracle): void {
  // create LendingProtocol - first function to be called in Comptroller
  let lendingProtocol = getOrCreateLendingProtcol(COMPTROLLER_ADDRESS);

  lendingProtocol._priceOracle = event.params.newPriceOracle;
  lendingProtocol.save();
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  let market = getOrCreateMarket(event, event.params.cToken, COMPTROLLER_ADDRESS);
  let newLTV = event.params.newCollateralFactorMantissa
    .toBigDecimal()
    .div(exponentToBigDecimal(COLLATERAL_FACTOR_OFFSET));
  market.maximumLTV = newLTV;
  // collateral factor is the borrowing capacity. The liquidity a borrower has is the collateral factor
  // ex: if collateral factor = 75% and the user has 100 USD (normalized) they can borrow $75
  //     if that ratio rises above 75% they are at risk of liquidation
  market.liquidationThreshold = newLTV;
  if (market.maximumLTV == BIGDECIMAL_ZERO) {
    // when collateral factor is 0 the asset CANNOT be used as collateral
    market.canUseAsCollateral = false;
  }
  market.save();
}

export function handleNewLiquidationIncentive(event: NewLiquidationIncentive): void {
  let protocol = getOrCreateLendingProtcol(COMPTROLLER_ADDRESS);
  let liquidationPenalty = event.params.newLiquidationIncentiveMantissa
    .toBigDecimal()
    .div(exponentToBigDecimal(DEFAULT_DECIMALS))
    .minus(BIGDECIMAL_ONE);
  protocol._liquidationPenalty = liquidationPenalty;

  // set liquidation penalty for each market
  for (let i = 0; i < protocol._marketIds.length; i++) {
    let market = getOrCreateMarket(event, Address.fromString(protocol._marketIds[i]), COMPTROLLER_ADDRESS);
    market.liquidationPenalty = liquidationPenalty;
    market.save();
  }
}
