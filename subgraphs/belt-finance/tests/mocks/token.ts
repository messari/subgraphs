import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { createMockedFunction } from "matchstick-as";

export function mockERC20Functions(address: string, name: string, decimals: string): void {
  createMockedFunction(Address.fromString(address), "name", "name():(string)").returns([
    ethereum.Value.fromString(name),
  ]);
  createMockedFunction(Address.fromString(address), "symbol", "symbol():(string)").returns([
    ethereum.Value.fromString(name),
  ]);
  createMockedFunction(Address.fromString(address), "decimals", "decimals():(uint8)").returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(decimals)),
  ]);
}
