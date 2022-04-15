import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { createMockedFunction } from "matchstick-as";

export function mockStrategyFunctions(address: string, numerator: BigInt, denominator: BigInt): void {
  createMockedFunction(Address.fromString(address), "withdrawFeeNumer", "withdrawFeeNumer():(uint256)").returns([
    ethereum.Value.fromUnsignedBigInt(numerator),
  ]);

  createMockedFunction(Address.fromString(address), "withdrawFeeDenom", "withdrawFeeDenom():(uint256)").returns([
    ethereum.Value.fromUnsignedBigInt(denominator),
  ]);
}
