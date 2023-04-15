import { BigDecimal } from "@graphprotocol/graph-ts";
import { Network } from "../../../src/constants";

/////////////////////
///// Addresses /////
/////////////////////

export const REWARD_TOKEN_ADDRESS =
  "0xd8321aa83fb0a4ecd6348d4577431310a6e0814d"; // GEIST token
export const GEIST_FTM_LP_ADDRESS =
  "0x668ae94d0870230ac007a01b471d02b2c94ddcb9";
export const GFTM_ADDRESS = "0x39b3bd37208cbade74d0fcbdbb12d606295b430a";
export const CRV_ADDRESS = "0x1e4f97b9f9f913c46f1632781732927b9019c68b"; // also gCRV market id
export const CRV_FTM_LP_ADDRESS = "0xb471ac6ef617e952b84c6a9ff5de65a9da96c93b";

// This is hardcoded and can not be changed, so it is set as a constant here
// https://ftmscan.com/address/0x3104ad2aadb6fe9df166948a5e3a547004862f90#code#L3666
export const FLASHLOAN_PREMIUM_TOTAL = BigDecimal.fromString("0.0009"); // = 9/10000

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export namespace Protocol {
  export const PROTOCOL = "Geist Finance";
  export const NAME = "Geist Finance";
  export const SLUG = "geist-finance";
  export const PROTOCOL_ADDRESS = "0x6c793c628fe2b480c5e6fb7957dda4b9291f9c9b";
  export const NETWORK = Network.FANTOM;
}

////////////////////////////
///// Network Specific /////
////////////////////////////

export function equalsIgnoreCase(a: string, b: string): boolean {
  return a.replace("-", "_").toLowerCase() == b.replace("-", "_").toLowerCase();
}
