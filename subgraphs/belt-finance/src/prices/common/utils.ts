import * as constants from "./constants";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { _ERC20 } from "../../../generated/templates/Strategy/_ERC20";

export function readValue<T>(callResult: ethereum.CallResult<T>, defaultValue: T): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function getTokenDecimals(tokenAddr: Address): BigInt {
  const token = _ERC20.bind(tokenAddr);

  let decimals = readValue<BigInt>(token.try_decimals(), constants.DEFAULT_DECIMALS);

  return decimals;
}
