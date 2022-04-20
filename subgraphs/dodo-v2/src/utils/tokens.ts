/* eslint-disable prefer-const */
import { ERC20 } from "../../generated/CP/ERC20";
import { Address } from "@graphprotocol/graph-ts";

export function fetchTokenSymbol(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress);
  let symbol = contract.try_symbol();
  if (symbol.reverted) {
    return "";
  }
  return symbol.value;
}

export function fetchTokenName(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress);
  let name = contract.try_name();
  if (name.reverted) {
    return "";
  }
  return name.value;
}

export function fetchTokenDecimals(tokenAddress: Address): i32 {
  let contract = ERC20.bind(tokenAddress);

  let decimals = contract.try_decimals();
  if (decimals.reverted) {
    return 0;
  }
  return decimals.value;
}
