import { Network } from "../../../src/constants";

/////////////////////
///// Addresses /////
/////////////////////

export const REWARD_TOKEN_ADDRESS =
  "0xd8321AA83Fb0a4ECd6348D4577431310A6E0814d"; // GEIST token
export const GEIST_FTM_LP_ADDRESS =
  "0x668AE94D0870230AC007a01B471D02b2c94DDcB9";
export const GFTM_ADDRESS = "0x39b3bd37208cbade74d0fcbdbb12d606295b430a";
export const CRV_ADDRESS = "0x1e4f97b9f9f913c46f1632781732927b9019c68b"; // also gCRV market id
export const CRV_FTM_LP_ADDRESS = "0xB471Ac6eF617e952b84C6a9fF5de65A9da96C93B";

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export namespace Protocol {
  export const NAME = "Geist Finance";
  export const SLUG = "geist-finance";
  export const SCHEMA_VERSION = "2.0.1";
  export const SUBGRAPH_VERSION = "1.0.10";
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
