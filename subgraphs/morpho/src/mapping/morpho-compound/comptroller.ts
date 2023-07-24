import {
  BIGDECIMAL_ONE,
  DEFAULT_DECIMALS,
  exponentToBigDecimal,
  MORPHO_COMPOUND_ADDRESS,
} from "../../constants";
import {
  NewBorrowCap,
  NewCloseFactor,
  NewCollateralFactor,
  NewPriceOracle,
} from "../../../generated/templates/Comptroller/Comptroller";
import { getCompoundProtocol } from "./fetchers";
import { Address } from "@graphprotocol/graph-ts";
import { Market } from "../../../generated/schema";
import { CompoundOracle } from "../../../generated/templates";
import { getMarket, getOrInitMarketList } from "../../utils/initializers";

export function handleNewBorrowCap(event: NewBorrowCap): void {
  const market = Market.load(event.params.cToken);
  if (market === null) return; // Market not created on Morpho Compound
  market.borrowCap = event.params.newBorrowCap;
  market.save();
}

export function handleNewCloseFactor(event: NewCloseFactor): void {
  const protocol = getOrInitMarketList(MORPHO_COMPOUND_ADDRESS);
  const closeFactor = event.params.newCloseFactorMantissa
    .toBigDecimal()
    .div(exponentToBigDecimal(DEFAULT_DECIMALS))
    .minus(BIGDECIMAL_ONE);

  for (let i = 0; i < protocol.markets.length; i++) {
    const market = getMarket(protocol.markets[i]);
    market.liquidationPenalty = closeFactor;
    market.save();
  }
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  const market = Market.load(event.params.cToken);
  if (market === null) return; // Market not created on Morpho Compound
  market.liquidationThreshold = event.params.newCollateralFactorMantissa
    .toBigDecimal()
    .div(exponentToBigDecimal(DEFAULT_DECIMALS));
  market.save();
}

export function handleNewPriceOracle(event: NewPriceOracle): void {
  if (
    event.params.newPriceOracle.equals(
      Address.fromHexString("0xad47d5a59b6d1ca4dc3ebd53693fda7d7449f165")
    ) // Blacklist broken oracle
  )
    return;
  const protocol = getCompoundProtocol(MORPHO_COMPOUND_ADDRESS);
  protocol._oracle = event.params.newPriceOracle;
  protocol.save();
  CompoundOracle.create(event.params.newPriceOracle);
}
