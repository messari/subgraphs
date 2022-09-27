import { Address } from "@graphprotocol/graph-ts";
import {
  MCRChanged,
  PriceFeedChanged,
  VestaParameters,
} from "../../generated/VestaParameters/VestaParameters";
import { Market } from "../../generated/schema";
import { PriceFeed } from "../../generated/templates";
import {
  getOrCreateLendingProtocol,
  updateProtocolPriceOracle,
} from "../entities/protocol";
import { bigIntToBigDecimal } from "../utils/numbers";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ONE,
  BIGINT_ZERO,
} from "../utils/constants";

export function handlePriceFeedChanged(event: PriceFeedChanged): void {
  const newPriceOracle = event.params.addr;
  updateProtocolPriceOracle(newPriceOracle.toHexString());
  PriceFeed.create(newPriceOracle);
}

export function handleMCRChanged(event: MCRChanged): void {
  const protocol = getOrCreateLendingProtocol();
  const assets = protocol._marketAssets;
  const contract = VestaParameters.bind(event.address);

  // As the asset address is not included in the event's paramters, we have to iterate over all markets to update their MCR.
  for (let i = 0; i < assets.length; i++) {
    const market = Market.load(assets[i]);
    if (market != null) {
      const tryMCR = contract.try_MCR(Address.fromString(assets[i]));
      if (!tryMCR.reverted && tryMCR.value != BIGINT_ZERO) {
        const adjustedMCR = bigIntToBigDecimal(tryMCR.value);
        const MaxLTV =
          BIGDECIMAL_ONE.div(adjustedMCR).times(BIGDECIMAL_HUNDRED);
        market.maximumLTV = MaxLTV;
        market.liquidationThreshold = MaxLTV;

        market.save();
      }
    }
  }
}
