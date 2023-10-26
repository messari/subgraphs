import { ERC20 } from "../../generated/UniswapV2Factory/ERC20";
import { ERC20SymbolBytes } from "../../generated/UniswapV2Factory/ERC20SymbolBytes";
import { ERC20NameBytes } from "../../generated/UniswapV2Factory/ERC20NameBytes";
import { Address } from "@graphprotocol/graph-ts";
import { DEFAULT_DECIMALS, INT_NINE, INT_SIXTEEN } from "./constants";

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
    } else {
      // try with the static definition
      const staticTokenDefinition =
        StaticTokenDefinition.fromAddress(tokenAddress);
      if (staticTokenDefinition != null) {
        symbolValue = staticTokenDefinition.symbol;
      }
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
    } else {
      // try with the static definition
      const staticTokenDefinition =
        StaticTokenDefinition.fromAddress(tokenAddress);
      if (staticTokenDefinition != null) {
        nameValue = staticTokenDefinition.name;
      }
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
    return decimalValue.toI32();
  }

  // try with the static definition
  const staticTokenDefinition = StaticTokenDefinition.fromAddress(tokenAddress);
  if (staticTokenDefinition != null) {
    return staticTokenDefinition.decimals as i32;
  } else {
    return INVALID_TOKEN_DECIMALS as i32;
  }
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
    const staticDefinitions = new Array<StaticTokenDefinition>(INT_SIX);

    // Add DGD
    const tokenDGD = new StaticTokenDefinition(
      Address.fromString("0xe0b7927c4af23765cb51314a0e0521a9645f0e2a"),
      "DGD",
      "DGD",
      INT_NINE as i32
    );
    staticDefinitions.push(tokenDGD);

    // Add AAVE
    const tokenAAVE = new StaticTokenDefinition(
      Address.fromString("0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9"),
      "AAVE",
      "Aave Token",
      DEFAULT_DECIMALS as i32
    );
    staticDefinitions.push(tokenAAVE);

    // Add LIF
    const tokenLIF = new StaticTokenDefinition(
      Address.fromString("0xeb9951021698b42e4399f9cbb6267aa35f82d59d"),
      "LIF",
      "Lif",
      DEFAULT_DECIMALS as i32
    );
    staticDefinitions.push(tokenLIF);

    // Add SVD
    const tokenSVD = new StaticTokenDefinition(
      Address.fromString("0xbdeb4b83251fb146687fa19d1c660f99411eefe3"),
      "SVD",
      "savedroid",
      DEFAULT_DECIMALS as i32
    );
    staticDefinitions.push(tokenSVD);

    // Add TheDAO
    const tokenTheDAO = new StaticTokenDefinition(
      Address.fromString("0xbb9bc244d798123fde783fcc1c72d3bb8c189413"),
      "TheDAO",
      "TheDAO",
      INT_SIXTEEN as i32
    );
    staticDefinitions.push(tokenTheDAO);

    // Add HPB
    const tokenHPB = new StaticTokenDefinition(
      Address.fromString("0x38c6a68304cdefb9bec48bbfaaba5c5b47818bb2"),
      "HPB",
      "HPBCoin",
      DEFAULT_DECIMALS as i32
    );
    staticDefinitions.push(tokenHPB);

    return staticDefinitions;
  }

  // Helper for hardcoded tokens
  static fromAddress(tokenAddress: Address): StaticTokenDefinition | null {
    const staticDefinitions = this.getStaticDefinitions();
    const tokenAddressHex = tokenAddress.toHexString();

    // Search the definition using the address
    for (let i = 0; i < staticDefinitions.length; i++) {
      const staticDefinition = staticDefinitions[i];
      if (staticDefinition.address.toHexString() == tokenAddressHex) {
        return staticDefinition;
      }
    }

    // If not found, return null
    return null;
  }
}
