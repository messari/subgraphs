import { PriceFeedChanged } from "../../generated/VestaParameters/VestaParameters";
import { PriceFeed } from "../../generated/templates";
import { updateProtocolPriceOracle } from "../entities/protocol";

export function handlePriceFeedChanged(event: PriceFeedChanged): void {
  const newPriceOracle = event.params.addr;
  updateProtocolPriceOracle(newPriceOracle.toHexString());
  PriceFeed.create(newPriceOracle);
}
