import { Address, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { getOrCreateToken } from "../getters";

export function updateTokenPrice(tokenAddress: string, priceUSD: BigDecimal, event: ethereum.Event): void {
  let token = getOrCreateToken(Address.fromString(tokenAddress));
  token.lastPriceUSD = priceUSD;
  token.lastPriceBlockNumber = event.block.number;
  token.save();
}
