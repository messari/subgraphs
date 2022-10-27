import * as constants from "./constants";
import { ERC20 } from "../../../generated/Standard/ERC20";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function getTokenDecimals(tokenAddr: Address): BigInt {
  const token = ERC20.bind(tokenAddr);

  const decimals = token.try_decimals();
  if (decimals.reverted) {
    return constants.DEFAULT_DECIMALS;
  }
  return BigInt.fromI32(decimals.value);
}
