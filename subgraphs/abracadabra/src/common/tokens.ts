/* eslint-disable prefer-const */
import { ERC20 } from "../../generated/BentoBox/ERC20";
import { ERC20SymbolBytes } from "../../generated/BentoBox/ERC20SymbolBytes";
import { ERC20NameBytes } from "../../generated/BentoBox/ERC20NameBytes";
import { Address } from "@graphprotocol/graph-ts";

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
    } else {
      // try with the static definition
      let staticTokenDefinition = fromAddress(tokenAddress);
      if (staticTokenDefinition != null) {
        symbolValue = staticTokenDefinition.symbol;
      }
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
    } else {
      // try with the static definition
      let staticTokenDefinition = fromAddress(tokenAddress);
      if (staticTokenDefinition != null) {
        nameValue = staticTokenDefinition.name;
      }
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

  // try with the static definition
  let staticTokenDefinition = fromAddress(tokenAddress);
  if (staticTokenDefinition != null) {
    return staticTokenDefinition.decimals as i32;
  }

  return INVALID_TOKEN_DECIMALS as i32;
}

export function isNullEthValue(value: string): boolean {
  if (value == "0x0000000000000000000000000000000000000001" || value == "0x0000000000000000000000000000000000000000")
    return true;
  return false;
}

class StaticTokenDefinition {
  constructor(
    public readonly address: Address,
    public readonly symbol: string,
    public readonly name: string,
    public readonly decimals: i32,
  ) {}
}

// Get all tokens with a static defintion
function getStaticDefinitions(): StaticTokenDefinition[] {
  let staticDefinitions: StaticTokenDefinition[] = [];

  // Add DGD
  let tokenDGD = new StaticTokenDefinition(
    Address.fromString("0xe0b7927c4af23765cb51314a0e0521a9645f0e2a"),
    "DGD",
    "DGD",
    9 as i32,
  );
  staticDefinitions.push(tokenDGD);

  // Add AAVE
  let tokenAAVE = new StaticTokenDefinition(
    Address.fromString("0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9"),
    "AAVE",
    "Aave Token",
    18 as i32,
  );
  staticDefinitions.push(tokenAAVE);

  // Add LIF
  let tokenLIF = new StaticTokenDefinition(
    Address.fromString("0xeb9951021698b42e4399f9cbb6267aa35f82d59d"),
    "LIF",
    "Lif",
    18 as i32,
  );
  staticDefinitions.push(tokenLIF);

  // Add SVD
  let tokenSVD = new StaticTokenDefinition(
    Address.fromString("0xbdeb4b83251fb146687fa19d1c660f99411eefe3"),
    "SVD",
    "savedroid",
    18 as i32,
  );
  staticDefinitions.push(tokenSVD);

  // Add TheDAO
  let tokenTheDAO = new StaticTokenDefinition(
    Address.fromString("0xbb9bc244d798123fde783fcc1c72d3bb8c189413"),
    "TheDAO",
    "TheDAO",
    16 as i32,
  );
  staticDefinitions.push(tokenTheDAO);

  // Add HPB
  let tokenHPB = new StaticTokenDefinition(
    Address.fromString("0x38c6a68304cdefb9bec48bbfaaba5c5b47818bb2"),
    "HPB",
    "HPBCoin",
    18 as i32,
  );
  staticDefinitions.push(tokenHPB);

  return staticDefinitions;
}

// Helper for hardcoded tokens
function fromAddress(tokenAddress: Address): StaticTokenDefinition | null {
  let staticDefinitions = getStaticDefinitions();
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
