import { TokenPriceUpdated } from "../../generated/PriceFeed/PriceFeed";
import { setCurrentAssetPrice } from "../entities/token";

/**
 * Emitted whenever latest Asset price is fetched from oracle
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
