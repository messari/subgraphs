/* eslint-disable prefer-const */
import { ERC20 } from "../../generated/templates/Vault/ERC20";
import { ERC20NameBytes } from "../../generated/templates/Vault/ERC20NameBytes";
import { ERC20SymbolBytes } from "../../generated/templates/Vault/ERC20SymbolBytes";

export const UNKNOWN_TOKEN_SYMBOL = "unknown";
export const UNKNOWN_TOKEN_NAME = "UNKNOWN";
export const INVALID_TOKEN_DECIMALS = 0;

function isNullEthValue(value: string): boolean {
  return (
    value ==
    "0x0000000000000000000000000000000000000000000000000000000000000001"
  );
}

export function fetchTokenName(contract: ERC20): string {
  // try types string and bytes32 for name
  let nameValue = UNKNOWN_TOKEN_NAME;
  const nameResult = contract.try_name();
  if (!nameResult.reverted) {
    return nameResult.value;
  }

  // non-standard ERC20 implementation
  const contractNameBytes = ERC20NameBytes.bind(contract._address);
  const nameResultBytes = contractNameBytes.try_name();
  if (!nameResultBytes.reverted) {
    // for broken exchanges that have no name function exposed
    if (!isNullEthValue(nameResultBytes.value.toHexString())) {
      nameValue = nameResultBytes.value.toString();
    }
  }
  return nameValue;
}

export function fetchTokenSymbol(contract: ERC20): string {
  const contractSymbolBytes = ERC20SymbolBytes.bind(contract._address);

  // try types string and bytes32 for symbol
  let symbolValue = UNKNOWN_TOKEN_SYMBOL;
  const symbolResult = contract.try_symbol();
  if (!symbolResult.reverted) {
    return symbolResult.value;
  }

  // non-standard ERC20 implementation
  const symbolResultBytes = contractSymbolBytes.try_symbol();
  if (!symbolResultBytes.reverted) {
    // for broken pairs that have no symbol function exposed
    if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
      symbolValue = symbolResultBytes.value.toString();
    }
  }

  return symbolValue;
}

export function fetchTokenDecimals(contract: ERC20): i32 {
  let decimalsValue = INVALID_TOKEN_DECIMALS;
  const decimalResult = contract.try_decimals();
  if (!decimalResult.reverted) {
    return decimalResult.value as i32;
  }

  return decimalsValue;
}
