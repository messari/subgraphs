import { LastGoodPriceUpdated } from "../../generated/PriceFeed/PriceFeed";
import { _Price } from "../../generated/schema";
import { setCurrentETHPrice } from "../entities/price";

/**
 * Emitted whenever latest ETH price is fetched from oracle
 *
 * @param event LastGoodPriceUpdated event
 */
export function handleLastGoodPriceUpdated(event: LastGoodPriceUpdated): void {
  setCurrentETHPrice(event.params._lastGoodPrice);
}
