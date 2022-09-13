import { LastGoodPriceUpdated } from "../../generated/PriceFeed/PriceFeed";
import { setCurrentETHPrice } from "../entities/token";

/**
 * Emitted whenever latest ETH price is fetched from oracle
 *
 * @param event LastGoodPriceUpdated event
 */
export function handleLastGoodPriceUpdated(event: LastGoodPriceUpdated): void {
  setCurrentETHPrice(event.block.number, event.params._lastGoodPrice);
}
