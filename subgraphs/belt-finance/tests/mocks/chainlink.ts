import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { createMockedFunction } from "matchstick-as";

export function mockChainlinkPriceFunction(address: string, tokenAddress: string, price: BigInt): void {
  createMockedFunction(Address.fromString(address), "getChainLinkPrice", "getChainLinkPrice(address):(uint256,bool)")
    .withArgs([ethereum.Value.fromAddress(Address.fromString(tokenAddress))])
    .returns([ethereum.Value.fromUnsignedBigInt(price), ethereum.Value.fromBoolean(true)]);
}
