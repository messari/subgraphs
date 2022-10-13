import { Address } from "@graphprotocol/graph-ts";
import { Network } from "../../../src/constants";

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export namespace Protocol {
  export const NAME = "UwU Lend";
  export const SLUG = "uwu-lend";
  export const SCHEMA_VERSION = "2.0.1";
  export const SUBGRAPH_VERSION = "1.0.0";
  export const METHODOLOGY_VERSION = "1.0.0";
}
export const UWU_DECIMALS = 8;

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
