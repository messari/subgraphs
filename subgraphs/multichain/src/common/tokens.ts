/* eslint-disable prefer-const */
import { Address, log } from "@graphprotocol/graph-ts";

import { ERC20 } from "../../generated/RouterV6/ERC20";
import { ERC20SymbolBytes } from "../../generated/RouterV6/ERC20SymbolBytes";
import { ERC20NameBytes } from "../../generated/RouterV6/ERC20NameBytes";
import { NetworkConfigs } from "../../configurations/configure";

export const INVALID_TOKEN_DECIMALS = 0;
export const UNKNOWN_TOKEN_VALUE = "unknown";

export function fetchTokenSymbol(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress);
  let contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress);

  // try types string and bytes32 for symbol
  let symbolValue = UNKNOWN_TOKEN_VALUE;
  let symbolResult = contract.try_symbol();
  if (!symbolResult.reverted) {
    return symbolResult.value;
  }

  // non-standard ERC20 implementation
  let symbolResultBytes = contractSymbolBytes.try_symbol();
  if (!symbolResultBytes.reverted) {
    // for broken pairs that have no symbol function exposed
    if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
      symbolValue = symbolResultBytes.value.toString();
    }
  }

  return symbolValue;
}

export function fetchTokenName(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress);
  let contractNameBytes = ERC20NameBytes.bind(tokenAddress);

  // try types string and bytes32 for name
  let nameValue = UNKNOWN_TOKEN_VALUE;
  let nameResult = contract.try_name();
  if (!nameResult.reverted) {
    return nameResult.value;
  }

  // non-standard ERC20 implementation
  let nameResultBytes = contractNameBytes.try_name();
  if (!nameResultBytes.reverted) {
    // for broken exchanges that have no name function exposed
    if (!isNullEthValue(nameResultBytes.value.toHexString())) {
      nameValue = nameResultBytes.value.toString();
    }
  }

  return nameValue;
}

export function fetchTokenDecimals(tokenAddress: Address): i32 {
  let contract = ERC20.bind(tokenAddress);

  // try types uint8 for decimals
  let decimalResult = contract.try_decimals();
  if (!decimalResult.reverted) {
    let decimalValue = decimalResult.value;
    return decimalValue as i32;
  }

  return INVALID_TOKEN_DECIMALS as i32;
}

export function isNullEthValue(value: string): boolean {
  return (
    value ==
    "0x0000000000000000000000000000000000000000000000000000000000000001"
  );
}

export function isRewardToken(tokenAddress: Address): boolean {
  return (
    tokenAddress ==
    Address.fromString(NetworkConfigs.getRewardToken().get("address")!)
  );
}

export function isNativeToken(tokenAddress: Address): boolean {
  return (
    tokenAddress ==
    Address.fromString(NetworkConfigs.getNativeToken().get("address")!)
  );
}
