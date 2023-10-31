import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";

import {
  BIGDECIMAL_ZERO,
  BIGINT_TEN,
  CHAINLINK_AGGREGATOR_ETH_USD,
  ETH_DECIMALS,
} from "./constants";
import { getOrCreateToken } from "./getters";

import { ChainLinkAggregator } from "../../generated/Shares/ChainLinkAggregator";

export function getUsdPricePerEth(): BigDecimal {
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

export function getUsdPriceForEthAmount(
  amount: BigInt,
  event: ethereum.Event
): BigDecimal {
  const eth = getOrCreateToken(event);

  return amount
    .toBigDecimal()
    .div(BIGINT_TEN.pow(ETH_DECIMALS as u8).toBigDecimal())
    .times(eth.lastPriceUSD!);
}
