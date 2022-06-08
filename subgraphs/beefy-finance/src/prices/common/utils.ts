import * as constants from "./constants";
import { ERC20 } from "../../../generated/aave-aave-eol/ERC20";
import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function getTokenDecimals(tokenAddr: Address): BigInt {
  const token = ERC20.bind(tokenAddr);

  let decimals = token.decimals();
  return BigInt.fromI32(decimals);
}
