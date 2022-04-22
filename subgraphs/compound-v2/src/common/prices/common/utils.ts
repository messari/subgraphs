import * as constants from "./constants";
import { ERC20 } from "../../../../generated/Comptroller/ERC20";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

export function readValue<T>(callResult: ethereum.CallResult<T>, defaultValue: T): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function getTokenDecimals(tokenAddr: Address): BigInt {
  const token = ERC20.bind(tokenAddr);

  let decimals = readValue<i32>(token.try_decimals(), constants.DEFAULT_DECIMALS.toI32());

  return BigInt.fromI32(decimals);
}
