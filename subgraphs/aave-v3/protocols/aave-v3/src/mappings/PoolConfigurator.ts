import { dataSource } from "@graphprotocol/graph-ts";
import {
  AToken,
  StableDebtToken,
  VariableDebtToken,
} from "../../../../generated/templates";
import {
  CollateralConfigurationChanged,
  ReserveActive,
  ReserveBorrowing,
  ReserveFrozen,
  ReserveInitialized,
  ReservePaused,
} from "../../../../generated/templates/PoolConfigurator/PoolConfigurator";
import { createMarket, getMarket } from "../entities/market";
import { createReserve } from "../entities/reserve";
import { getOrCreateToken } from "../entities/token";
import { BIGDECIMAL_HUNDRED, BIGINT_ZERO, INT_TWO } from "../../../../src/utils/constants";
import { bigIntToBigDecimal } from "../../../../src/utils/numbers";

export function handleReserveInitialized(event: ReserveInitialized): void {
  const asset = event.params.asset;
  createMarket(event, asset, event.params.aToken);
  getOrCreateToken(event.params.stableDebtToken, asset.toHexString());
  getOrCreateToken(event.params.variableDebtToken, asset.toHexString());
  createReserve(event);
  AToken.createWithContext(event.params.aToken, dataSource.context());
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

export function handleReserveActive(event: ReserveActive): void {
  const market = getMarket(event.params.asset);
  market.isActive = event.params.active;
  market.save();
}

export function handleReserveBorrowing(event: ReserveBorrowing): void {
  const market = getMarket(event.params.asset);
  market.canBorrowFrom = event.params.enabled;
  market.save();
}

export function handleReserveFrozen(event: ReserveFrozen): void {
  const market = getMarket(event.params.asset);
  market.isActive = !event.params.frozen;
  market.save();
}

export function handleReservePaused(event: ReservePaused): void {
  const market = getMarket(event.params.asset);
  market.isActive = !event.params.paused;
  market.save();
}
