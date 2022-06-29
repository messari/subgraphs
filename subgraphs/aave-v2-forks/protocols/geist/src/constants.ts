import { Network } from "../../../src/constants";

//////////////////////////////
///// Ethereum Addresses /////
//////////////////////////////

export const USDC_TOKEN_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export namespace Protocol {
  export const NAME = "Geist";
  export const SLUG = "geist";
  export const SCHEMA_VERSION = "1.3.0";
  export const SUBGRAPH_VERSION = "1.0.0";
  export const METHODOLOGY_VERSION = "1.0.0";
  export const PROTOCOL_ADDRESS = "0x6c793c628Fe2b480c5e6FB7957dDa4b9291F9c9b";
  export const NETWORK = Network.FANTOM;
}

////////////////////////////
///// Network Specific /////
////////////////////////////

export function equalsIgnoreCase(a: string, b: string): boolean {
  return a.replace("-", "_").toLowerCase() == b.replace("-", "_").toLowerCase();
}
