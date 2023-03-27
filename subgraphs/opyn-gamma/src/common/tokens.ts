import { ERC20 } from "../../generated/Controller/ERC20";
import { ERC20SymbolBytes } from "../../generated/Controller/ERC20SymbolBytes";
import { ERC20NameBytes } from "../../generated/Controller/ERC20NameBytes";
import { Address, Bytes } from "@graphprotocol/graph-ts";
import { Token } from "../../generated/schema";
import { BIGINT_ZERO } from "./constants";

export const INVALID_TOKEN_DECIMALS = 0;
export const UNKNOWN_TOKEN_VALUE = "unknown";

export function fetchTokenSymbol(tokenAddress: Address): string {
  const contract = ERC20.bind(tokenAddress);
  const contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress);

  // try types string and bytes32 for symbol
  let symbolValue = UNKNOWN_TOKEN_VALUE;
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

export function fetchTokenName(tokenAddress: Address): string {
  const contract = ERC20.bind(tokenAddress);
  const contractNameBytes = ERC20NameBytes.bind(tokenAddress);

  // try types string and bytes32 for name
  let nameValue = UNKNOWN_TOKEN_VALUE;
  const nameResult = contract.try_name();
  if (!nameResult.reverted) {
    return nameResult.value;
  }

  // non-standard ERC20 implementation
  const nameResultBytes = contractNameBytes.try_name();
  if (!nameResultBytes.reverted) {
    // for broken exchanges that have no name function exposed
    if (!isNullEthValue(nameResultBytes.value.toHexString())) {
      nameValue = nameResultBytes.value.toString();
    }
  }

  return nameValue;
}

export function fetchTokenDecimals(tokenAddress: Address): i32 {
  const contract = ERC20.bind(tokenAddress);

  // try types uint8 for decimals
  const decimalResult = contract.try_decimals();
  if (!decimalResult.reverted) {
    const decimalValue = decimalResult.value;
    return decimalValue;
  }

  return INVALID_TOKEN_DECIMALS as i32;
}

export function isNullEthValue(value: string): boolean {
  return (
    value ==
    "0x0000000000000000000000000000000000000000000000000000000000000001"
  );
}

export function getOrCreateToken(address: Bytes): Token {
  const tokenAddress = Address.fromBytes(address);
  let token = Token.load(tokenAddress);
  // fetch info if null
  if (!token) {
    token = new Token(tokenAddress);
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.name = fetchTokenName(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress);
    token.lastPriceBlockNumber = BIGINT_ZERO;
    token.save();
  }
  return token;
}
