import { LastGoodPriceUpdated } from "../../generated/PriceFeed/PriceFeed";
import { _Price } from "../../generated/schema";
import { setCurrentETHPrice } from "../entities/price";

export function handleLastGoodPriceUpdated(event: LastGoodPriceUpdated): void {
  setCurrentETHPrice(event.params._lastGoodPrice);
}
