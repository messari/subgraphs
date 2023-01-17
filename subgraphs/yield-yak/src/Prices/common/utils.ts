import * as constants from "./constants";
import { _ERC20 } from "../../../generated/YakStrategyV2/_ERC20";
import { Address, BigInt, dataSource, ethereum } from "@graphprotocol/graph-ts";

export function isNullAddress(tokenAddr: Address): boolean {
  return tokenAddr.equals(constants.NULL.TYPE_ADDRESS);
}

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function getTokenName(tokenAddr: Address): string {
  const tokenContract = _ERC20.bind(tokenAddr);
  const name = readValue<string>(tokenContract.try_name(), "");

  return name;
}

export function getTokenDecimals(tokenAddr: Address): BigInt {
  const tokenContract = _ERC20.bind(tokenAddr);

  const decimals = readValue<BigInt>(
    tokenContract.try_decimals(),
    constants.DEFAULT_DECIMALS
  );

  return decimals;
}

export function getTokenSupply(tokenAddr: Address): BigInt {
  const tokenContract = _ERC20.bind(tokenAddr);

  const totalSupply = readValue<BigInt>(
    tokenContract.try_totalSupply(),
    constants.BIGINT_ONE
  );

  return totalSupply;
}
