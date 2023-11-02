/* eslint-disable prefer-const */
import { ERC20 } from "../../generated/Vault/ERC20";
import { ERC20SymbolBytes } from "../../generated/Vault/ERC20SymbolBytes";
import { ERC20NameBytes } from "../../generated/Vault/ERC20NameBytes";
import { Address, log } from "@graphprotocol/graph-ts";

export const INVALID_TOKEN_DECIMALS = 0;
export const UNKNOWN_TOKEN_VALUE = "unknown";

export function fetchTokenSymbol(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress);
  let contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress);

  // try types string and bytes32 for symbol
  let symbolValue = "Unknown";
  let symbolResult = contract.try_symbol();
  if (!symbolResult.reverted) {
    return symbolResult.value;
  }

  // non-standard ERC20 implementation
  let symbolResultBytes = contractSymbolBytes.try_symbol();
  if (!symbolResultBytes.reverted) {
    // for broken pairs that have no symbol function exposed
    if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
      return symbolResultBytes.value.toString();
    }
  }
  log.warning(
    "[getTokenParams]Fail to get symbol for token {}; default to 'Unknown'",
    [tokenAddress.toHexString()]
  );
  return symbolValue;
}

export function fetchTokenName(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress);
  let contractNameBytes = ERC20NameBytes.bind(tokenAddress);

  // try types string and bytes32 for name
  let nameValue = "Unknown Token";
  let nameResult = contract.try_name();
  if (!nameResult.reverted) {
    return nameResult.value;
  }

  // non-standard ERC20 implementation
  let nameResultBytes = contractNameBytes.try_name();
  if (!nameResultBytes.reverted) {
    // for broken exchanges that have no name function exposed
    if (!isNullEthValue(nameResultBytes.value.toHexString())) {
      return nameResultBytes.value.toString();
    }
  }
  log.warning(
    "[getTokenParams]Fail to get name for token {}; default to 'Unknown Token'",
    [tokenAddress.toHexString()]
  );
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

  log.warning(
    "[getTokenParams]token {} decimals() call reverted; default to 18 decimals",
    [tokenAddress.toHexString()]
  );
  return 18 as i32;
}

export function isNullEthValue(value: string): boolean {
  return (
    value ==
    "0x0000000000000000000000000000000000000000000000000000000000000001"
  );
}

// Initialize a Token Definition with the attributes
class StaticTokenDefinition {
  address: Address;
  symbol: string;
  name: string;
  decimals: i32;

  // Initialize a Token Definition with its attributes
  constructor(address: Address, symbol: string, name: string, decimals: i32) {
    this.address = address;
    this.symbol = symbol;
    this.name = name;
    this.decimals = decimals;
  }

  // Get all tokens with a static defintion
  static getStaticDefinitions(): Array<StaticTokenDefinition> {
    let staticDefinitions = new Array<StaticTokenDefinition>(6);

    // Add DGD
    let tokenDGD = new StaticTokenDefinition(
      Address.fromString("0xe0b7927c4af23765cb51314a0e0521a9645f0e2a"),
      "DGD",
      "DGD",
      9 as i32
    );
    staticDefinitions.push(tokenDGD);

    // Add AAVE
    let tokenAAVE = new StaticTokenDefinition(
      Address.fromString("0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9"),
      "AAVE",
      "Aave Token",
      18 as i32
    );
    staticDefinitions.push(tokenAAVE);

    // Add LIF
    let tokenLIF = new StaticTokenDefinition(
      Address.fromString("0xeb9951021698b42e4399f9cbb6267aa35f82d59d"),
      "LIF",
      "Lif",
      18 as i32
    );
    staticDefinitions.push(tokenLIF);

    // Add SVD
    let tokenSVD = new StaticTokenDefinition(
      Address.fromString("0xbdeb4b83251fb146687fa19d1c660f99411eefe3"),
      "SVD",
      "savedroid",
      18 as i32
    );
    staticDefinitions.push(tokenSVD);

    // Add TheDAO
    let tokenTheDAO = new StaticTokenDefinition(
      Address.fromString("0xbb9bc244d798123fde783fcc1c72d3bb8c189413"),
      "TheDAO",
      "TheDAO",
      16 as i32
    );
    staticDefinitions.push(tokenTheDAO);

    // Add HPB
    let tokenHPB = new StaticTokenDefinition(
      Address.fromString("0x38c6a68304cdefb9bec48bbfaaba5c5b47818bb2"),
      "HPB",
      "HPBCoin",
      18 as i32
    );
    staticDefinitions.push(tokenHPB);

    return staticDefinitions;
  }

  // Helper for hardcoded tokens
  static fromAddress(tokenAddress: Address): StaticTokenDefinition | null {
    let staticDefinitions = this.getStaticDefinitions();
    let tokenAddressHex = tokenAddress.toHexString();

    // Search the definition using the address
    for (let i = 0; i < staticDefinitions.length; i++) {
      let staticDefinition = staticDefinitions[i];
      if (staticDefinition.address.toHexString() == tokenAddressHex) {
        return staticDefinition;
      }
    }

    // If not found, return null
    return null;
  }
}
