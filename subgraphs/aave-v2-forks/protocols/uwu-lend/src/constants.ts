import { Address } from "@graphprotocol/graph-ts";
import { Network } from "../../../src/constants";

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export namespace Protocol {
  export const NAME = "UwU Lend";
  export const SLUG = "uwu-lend";
  export const SCHEMA_VERSION = "2.0.1";
  export const SUBGRAPH_VERSION = "1.0.1";
  export const METHODOLOGY_VERSION = "1.0.0";
}
export const UWU_DECIMALS = 8;
export const UWU_TOKEN_ADDRESS = "0x55C08ca52497e2f1534B59E2917BF524D4765257";
export const WETH_TOKEN_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
export const UWU_WETH_LP = "0x3E04863DBa602713Bb5d0edbf7DB7C3A9A2B6027"; // Sushiswap LP

////////////////////////////
///// Network Specific /////
////////////////////////////

export const PROTOCOL_ADDRESS = Address.fromString(
  "0x011C0D38Da64b431A1BdfC17aD72678EAbF7f1FB"
); // protocol id

export class NetworkSpecificConstant {
  constructor(
    public readonly protocolAddress: Address, // aka, LendingPoolAddressesProvider
    public readonly network: string
  ) {}
}

export function getNetworkSpecificConstant(): NetworkSpecificConstant {
  return new NetworkSpecificConstant(PROTOCOL_ADDRESS, Network.MAINNET);
}

export function equalsIgnoreCase(a: string, b: string): boolean {
  return a.replace("-", "_").toLowerCase() == b.replace("-", "_").toLowerCase();
}
