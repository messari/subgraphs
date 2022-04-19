import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../../generated/bveCVX/ERC20";
import * as constants from "./constants";

export function readValue<T>(callResult: ethereum.CallResult<T>, defaultValue: T): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function getTokenDecimals(tokenAddr: Address): BigInt {
  const token = ERC20.bind(tokenAddr);

  let decimals = readValue<i32>(token.try_decimals(), constants.DEFAULT_DECIMALS.toI32());

  return BigInt.fromI32(decimals);
}
