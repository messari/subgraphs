import { Address } from "@graphprotocol/graph-ts";
import { Network } from "../../../src/constants";

//////////////////////////////
///// Ethereum Addresses /////
//////////////////////////////

export const USDC_TOKEN_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export namespace Protocol {
  export const NAME = "Aave RWA";
  export const SLUG = "aave-rwa";
  export const SCHEMA_VERSION = "2.0.1";
  export const SUBGRAPH_VERSION = "1.2.16";
  export const METHODOLOGY_VERSION = "1.0.0";
}
export const AAVE_DECIMALS = 8;

////////////////////////////
///// Network Specific /////
////////////////////////////

export const RWA_ADDRESS = Address.fromString(
  "0xB953a066377176092879a151C07798B3946EEa4b"
); // protocol id

export class NetworkSpecificConstant {
  constructor(
    public readonly protocolAddress: Address, // aka, LendingPoolAddressesProvider
    public readonly network: string
  ) {}
}

export function getNetworkSpecificConstant(): NetworkSpecificConstant {
  return new NetworkSpecificConstant(RWA_ADDRESS, Network.MAINNET);
}

export function equalsIgnoreCase(a: string, b: string): boolean {
  return a.replace("-", "_").toLowerCase() == b.replace("-", "_").toLowerCase();
}
