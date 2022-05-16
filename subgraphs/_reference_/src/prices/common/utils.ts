import * as constants from "./constants";
import { _ERC20 } from "../../../generated/UniswapV2Factory/_ERC20";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

export function readValue<T>(callResult: ethereum.CallResult<T>, defaultValue: T): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function getTokenDecimals(tokenAddr: Address): BigInt {
  const token = _ERC20.bind(tokenAddr);

  let decimals = readValue<BigInt>(token.try_decimals(), constants.DEFAULT_DECIMALS);

  return decimals;
}
