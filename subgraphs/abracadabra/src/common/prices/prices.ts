import {
  Address,
  BigDecimal,
  dataSource,
  ethereum,
} from "@graphprotocol/graph-ts";
import { AnswerUpdated } from "../../../generated/templates/priceOracle/PriceOracle";
import { BIGDECIMAL_ONE, CHAINLINK_ORACLE_DECIMALS } from "../constants";
import { getMIMAddress, getOrCreateToken } from "../getters";
import { bigIntToBigDecimal } from "../utils/numbers";

function updateTokenPrice(
  tokenAddress: string,
  priceUSD: BigDecimal,
  event: ethereum.Event
): void {
  const token = getOrCreateToken(Address.fromString(tokenAddress));
  token.lastPriceUSD = priceUSD;
  token.lastPriceBlockNumber = event.block.number;
  token.save();
}

///////////////////////////
///// MIM Price Oracle /////
///////////////////////////

export function handleAnswerUpdated(event: AnswerUpdated): void {
  const priceUSD = BIGDECIMAL_ONE.div(
    bigIntToBigDecimal(event.params.current, CHAINLINK_ORACLE_DECIMALS)
  );
  updateTokenPrice(getMIMAddress(dataSource.network()), priceUSD, event);
}
