/* eslint-disable prefer-const */
import { ERC20 } from "../../generated/ERC20/ERC20";
import { Address } from "@graphprotocol/graph-ts";

export const INVALID_TOKEN_DECIMALS = 9999;
export const UNKNOWN_TOKEN_VALUE = "unknown";

export function fetchTokenSymbol(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress);
  return contract.symbol();
}

export function fetchTokenName(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress);
  return contract.name();
}

export function fetchTokenDecimals(tokenAddress: Address): i32 {
  let contract = ERC20.bind(tokenAddress);
  return contract.decimals();
}
