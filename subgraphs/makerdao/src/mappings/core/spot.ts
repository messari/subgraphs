import { Address, log } from "@graphprotocol/graph-ts";
import { LogNote, Poke } from "./../../../generated/Spot/Spot";
import { getMarketFromIlk } from "../../common/getters";
import { BIGDECIMAL_ZERO, BIGDECIMAL_ONE_HUNDRED, MCD_SPOT_ADDRESS, DEFAULT_DECIMALS } from "../../common/constants";
import { bigIntToBigDecimal, bytesToUnsignedBigInt } from "../../common/utils/numbers";
import { Spot } from "../../../generated/templates/Spot/Spot";
import { updateTokenPrice } from "../../common/prices/prices";
import { updateFinancialMetrics } from "../../common/metrics";

// update max LTV value, liquidation threshold for all markets

export function handleFile(event: LogNote): void {
  let what = event.params.arg2.toString();
  if (what == "mat") {
    log.info("spot handleFile", [event.transaction.hash.toHexString()]);
    let ilk = event.params.arg1;
    let market = getMarketFromIlk(ilk);
    if (!market) {
      return;
    }
    let spotContract = Spot.bind(Address.fromString(MCD_SPOT_ADDRESS));
    let maximumLTV = bigIntToBigDecimal(spotContract.ilks(ilk).value1, 27);
    if (maximumLTV.gt(BIGDECIMAL_ZERO)) {
      maximumLTV = BIGDECIMAL_ONE_HUNDRED.div(maximumLTV);
    }
    market.maximumLTV = maximumLTV;
    market.liquidationThreshold = maximumLTV;
    market.save();
  }
}

// update token price for all markets
export function handlePoke(event: Poke): void {
  let ilk = event.params.ilk;
  let market = getMarketFromIlk(ilk);
  if (!market) {
    return;
  }
  let tokenAddress = market.inputToken!;
  let priceUSD = bigIntToBigDecimal(bytesToUnsignedBigInt(event.params.val), DEFAULT_DECIMALS);
  market.inputTokenPriceUSD = priceUSD;
  market.save();
  updateTokenPrice(tokenAddress, priceUSD, event);
  updateFinancialMetrics(event);
}
