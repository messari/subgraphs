import { LastGoodPriceUpdated } from "../../generated/PriceFeed/PriceFeed";
import { setCurrentBtcPrice, setCurrentCollPrice } from "../entities/token";

/**
 * Emitted whenever latest stETH/BTC price is fetched from oracle
 *
 * @param event LastGoodPriceUpdated event
 */
export function handleLastGoodPriceUpdated(event: LastGoodPriceUpdated): void {
  setCurrentBtcPrice(event.block);
  setCurrentCollPrice(event.block, event.params._lastGoodPrice);
}
