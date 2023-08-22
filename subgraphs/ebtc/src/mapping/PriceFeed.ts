import { Address } from "@graphprotocol/graph-ts";
import { LastGoodPriceUpdated } from "../../generated/PriceFeed/PriceFeed";
import { BTC_ADDRESS, STETH_ADDRESS } from "../constants";
import { TokenManager } from "../sdk/token";
import { getUsdPricePerToken } from "../prices";
import { bigIntToBigDecimal } from "../sdk/util/numbers";

/**
 * Emitted whenever latest stETH/BTC price is fetched from oracle
 * @param event LastGoodPriceUpdated event
 */
export function handleLastGoodPriceUpdated(event: LastGoodPriceUpdated): void {
  const BtcToken = new TokenManager(
    BTC_ADDRESS, // tokenAddress: Bytes,
    event, // event: ethereum.Event,
    null // tokenType: string | null = null
  );
  const btcPrice = getUsdPricePerToken(
    Address.fromBytes(BTC_ADDRESS), // tokenAddr: Address,
    event.block // block: ethereum.Block | null = null
  );
  BtcToken.updatePrice(
    btcPrice.usdPrice // newPriceUSD: BigDecimal
  );

  const stEthToken = new TokenManager(
    STETH_ADDRESS, // tokenAddress: Bytes,
    event, // event: ethereum.Event,
    null // tokenType: string | null = null
  );
  const stEthPrice = btcPrice.usdPrice.times(
    bigIntToBigDecimal(event.params._lastGoodPrice)
  );
  stEthToken.updatePrice(
    stEthPrice // newPriceUSD: BigDecimal
  );
}
