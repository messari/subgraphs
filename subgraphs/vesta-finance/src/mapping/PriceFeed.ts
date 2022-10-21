import { LastGoodPriceUpdated } from "../../generated/templates/PriceFeedV1/PriceFeedV1";
import { TokenPriceUpdated } from "../../generated/templates/PriceFeed/PriceFeed";
import { setCurrentAssetPrice } from "../entities/token";

/**
 * Emitted whenever latest Asset price is fetched from oracle v1
 *
 * @param event LastGoodPriceUpdated event
 */
export function handleLastGoodPriceUpdated(event: LastGoodPriceUpdated): void {
  setCurrentAssetPrice(
    event.block.number,
    event.params.token,
    event.params._lastGoodPrice
  );
}

/**
 * Emitted whenever latest Asset price is fetched from oracle v2
 *
 * @param event TokenPriceUpdated event
 */
export function handleTokenPriceUpdated(event: TokenPriceUpdated): void {
  setCurrentAssetPrice(
    event.block.number,
    event.params._token,
    event.params._price
  );
}
