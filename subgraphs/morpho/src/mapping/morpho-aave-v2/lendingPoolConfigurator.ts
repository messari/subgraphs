import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { UnderlyingTokenMapping } from "../../../generated/schema";
import { CollateralConfigurationChanged } from "../../../generated/templates/LendingPoolConfigurator/LendingPoolConfigurator";
import {
  BASE_UNITS,
  BIGDECIMAL_HUNDRED,
  exponentToBigDecimal,
  INT_FOUR,
} from "../../constants";
import { getMarket } from "../../utils/initializers";

export function handleCollateralConfigurationChanged(
  event: CollateralConfigurationChanged
): void {
  const tokenMapping = UnderlyingTokenMapping.load(event.params.asset);
  if (!tokenMapping) return; // Not a Morpho market
  // Morpho has the same parameters as Aave
  const market = getMarket(Address.fromBytes(tokenMapping.aToken));

  market.maximumLTV = event.params.ltv.toBigDecimal().div(BASE_UNITS);
  market.liquidationThreshold = event.params.liquidationThreshold
    .toBigDecimal()
    .div(BASE_UNITS);
  market.liquidationPenalty = event.params.liquidationBonus
    .toBigDecimal()
    .div(BASE_UNITS);
  market.save();
  // The liquidation bonus value is equal to the liquidation penalty, the naming is a matter of which side of the liquidation a user is on
  // The liquidationBonus parameter comes out as above 100%, represented by a 5 digit integer over 10000 (100%).
  // To extract the expected value in the liquidationPenalty field: convert to BigDecimal, subtract by 10000 and divide by 100
  if (market.liquidationPenalty.gt(BigDecimal.zero())) {
    market.liquidationPenalty = market.liquidationPenalty
      .minus(exponentToBigDecimal(INT_FOUR))
      .div(BIGDECIMAL_HUNDRED);
  }
}
