import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { Chainlink } from "../../generated/beltBTC/Chainlink";
import { Token } from "../../generated/schema";
import { BIGDECIMAL_ZERO, BSC_CHAINLINK_PRICE_ADDRESS } from "../constant";

export function getUSDPriceOfToken(token: Token): BigDecimal {
  let tokenAddress = Address.fromString(token.id);
  let chainlinkAddress = Address.fromString(BSC_CHAINLINK_PRICE_ADDRESS);

  const chainlink = Chainlink.bind(chainlinkAddress);
  let result = chainlink.try_getChainLinkPrice(tokenAddress);

  if (result.reverted) {
    return BIGDECIMAL_ZERO;
  }

  let value = result.value.value0;
  return value.toBigDecimal().div(BigDecimal.fromString(token.decimals.toString()));
}
