import { BigDecimal, dataSource, log } from "@graphprotocol/graph-ts";

import {
  CollateralConfigurationChanged,
  ReserveInitialized,
  BorrowingEnabledOnReserve,
  BorrowingDisabledOnReserve,
  ReserveActivated,
  ReserveDeactivated,
  ReserveFactorChanged,
  ReserveFrozen,
  ReserveUnfrozen,
} from "../../generated/templates/LendingPoolConfigurator/LendingPoolConfigurator";

import { createMarket, getMarket } from "../common/market";
import { createReserve } from "../common/reserve";

import { bigIntToBigDecimal, rayToWad } from "../common/utils/numbers";

import { Market } from "../../generated/schema";

import {
  GToken,
  StableDebtToken,
  VariableDebtToken,
} from "../../generated/templates";

import { getOrCreateToken } from "../common/token";

import {
  BIGDECIMAL_ZERO,
  BIGDECIMAL_HUNDRED,
  BIGINT_ZERO,
  INT_ONE,
  INT_TWO,
  INT_ZERO,
} from "../common/utils/constants";

export function getLendingPoolFromCtx(): string {
  // Get the lending pool with context
  const context = dataSource.context();
  return context.getString("lendingPool");
}

export function handleReserveInitialized(event: ReserveInitialized): void {
  const asset = event.params.asset;
  createMarket(event, asset, event.params.aToken);
  getOrCreateToken(event.params.stableDebtToken, asset.toHexString());
  getOrCreateToken(event.params.variableDebtToken, asset.toHexString());
  createReserve(event);
  GToken.createWithContext(event.params.aToken, dataSource.context());
  StableDebtToken.createWithContext(
    event.params.stableDebtToken,
    dataSource.context()
  );
  VariableDebtToken.createWithContext(
    event.params.variableDebtToken,
    dataSource.context()
  );
}

export function handleCollateralConfigurationChanged(
  event: CollateralConfigurationChanged
): void {
  const market = getMarket(event.params.asset);
  market.canUseAsCollateral = false;
  if (event.params.liquidationThreshold.gt(BIGINT_ZERO)) {
    market.canUseAsCollateral = true;
  }
  market.maximumLTV = bigIntToBigDecimal(event.params.ltv, INT_TWO);
  market.liquidationPenalty = bigIntToBigDecimal(
    event.params.liquidationBonus,
    INT_TWO
  ).minus(BIGDECIMAL_HUNDRED);
  market.liquidationThreshold = bigIntToBigDecimal(
    event.params.liquidationThreshold,
    INT_TWO
  );
  market.save();
}

export function handleReserveActived(event: ReserveActivated): void {
  const market = getMarket(event.params.asset);
  market.isActive = true;
  market.save();
}

export function handleReserveDeactivated(event: ReserveDeactivated): void {
  const market = getMarket(event.params.asset);
  market.isActive = false;
  market.save();
}

export function handleReserveBorrowingEnabled(
  event: BorrowingEnabledOnReserve
): void {
  const market = getMarket(event.params.asset);
  market.canBorrowFrom = true;
  market.save();
}

export function handleReserveBorrowingDisabled(
  event: BorrowingDisabledOnReserve
): void {
  const market = getMarket(event.params.asset);
  market.canBorrowFrom = false;
  market.save();
}

export function handleReserveFrozen(event: ReserveFrozen): void {
  const market = getMarket(event.params.asset);
  market.isActive = false;
  market.save();
}

export function handleReserveUnfrozen(event: ReserveUnfrozen): void {
  const market = getMarket(event.params.asset);
  market.isActive = true;
  market.save();
}
