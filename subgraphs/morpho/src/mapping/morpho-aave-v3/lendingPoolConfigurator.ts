import { getMarket } from "../../utils/initializers";
import { BASE_UNITS, BIGDECIMAL_ONE } from "../../constants";
import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { UnderlyingTokenMapping } from "../../../generated/schema";
import { CollateralConfigurationChanged } from "../../../generated/templates/LendingPoolConfigurator/LendingPoolConfigurator";

export function handleCollateralConfigurationChanged(
  event: CollateralConfigurationChanged
): void {
  const tokenMapping = UnderlyingTokenMapping.load(event.params.asset);
  if (!tokenMapping) return;

  // Morpho has the same parameters as Aave
  const market = getMarket(Address.fromBytes(tokenMapping.aToken));

  market.maximumLTV = event.params.ltv.toBigDecimal().div(BASE_UNITS);
  market.liquidationThreshold = event.params.liquidationThreshold
    .toBigDecimal()
    .div(BASE_UNITS);
  market.liquidationPenalty = event.params.liquidationBonus
    .toBigDecimal()
    .div(BASE_UNITS);

  // The liquidation bonus value is equal to the liquidation penalty, the naming is a matter of which side of the liquidation a user is on
  // The liquidationBonus parameter comes out as above 1
  // The LiquidationPenalty is thus the liquidationBonus minus 1
  if (market.liquidationPenalty.gt(BigDecimal.zero())) {
    market.liquidationPenalty = market.liquidationPenalty.minus(BIGDECIMAL_ONE);
  }

  market.save();
}
