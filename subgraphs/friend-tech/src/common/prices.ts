import { Address, BigDecimal } from "@graphprotocol/graph-ts";

import {
  BIGDECIMAL_ZERO,
  BIGINT_TEN,
  CHAINLINK_AGGREGATOR_ETH_USD,
} from "./constants";

import { ChainLinkAggregator } from "../../generated/Shares/ChainLinkAggregator";

export function getEthPriceUSD(): BigDecimal {
  const chainLinkAggregator = ChainLinkAggregator.bind(
    Address.fromString(CHAINLINK_AGGREGATOR_ETH_USD)
  );

  const latestAnswerCall = chainLinkAggregator.try_latestAnswer();
  if (latestAnswerCall.reverted) {
    return BIGDECIMAL_ZERO;
  }
  const decimalsCall = chainLinkAggregator.try_decimals();
  if (decimalsCall.reverted) {
    return BIGDECIMAL_ZERO;
  }

  return latestAnswerCall.value
    .toBigDecimal()
    .div(BIGINT_TEN.pow(decimalsCall.value as u8).toBigDecimal());
}
