/* eslint-disable prefer-const */
import { Address } from "@graphprotocol/graph-ts";

import { ERC20 } from "../../generated/StrategyManager/ERC20";

export const UNKNOWN_TOKEN_SYMBOL = "unknown";
export const UNKNOWN_TOKEN_NAME = "UNKNOWN";
export const INVALID_TOKEN_DECIMALS = 0;

export function fetchTokenSymbol(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress);

  let symbolResult = contract.try_symbol();
  if (!symbolResult.reverted) {
    return symbolResult.value;
  }
  return UNKNOWN_TOKEN_SYMBOL;
}

export function fetchTokenName(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress);

  let nameCall = contract.try_name();
  if (!nameCall.reverted) {
    return nameCall.value;
  }
  return UNKNOWN_TOKEN_NAME;
}

export function fetchTokenDecimals(tokenAddress: Address): i32 {
  let contract = ERC20.bind(tokenAddress);

  let decimalCall = contract.try_decimals();
  if (!decimalCall.reverted) {
    return decimalCall.value as i32;
  }
  return INVALID_TOKEN_DECIMALS as i32;
}
