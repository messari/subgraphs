import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { Network } from "../../../src/constants";

//////////////////////////////
///// Ethereum Addresses /////
//////////////////////////////

export const USDC_TOKEN_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
// This is hardcoded and can not be changed, so it is set as a constant here
// http://etherscan.io/address/0x1b94587eef7538b99c348781720af92cd71f7f4d#code#F1#L89
export const FLASHLOAN_PREMIUM_TOTAL = BigDecimal.fromString("0.0009"); // = 9/10000

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export namespace Protocol {
  export const PROTOCOL = "Aave";
  export const NAME = "Aave RWA";
  export const SLUG = "aave-rwa";
}
export const AAVE_DECIMALS = 8;

////////////////////////////
///// Network Specific /////
////////////////////////////

export const RWA_ADDRESS = Address.fromString(
  "0xb953a066377176092879a151c07798b3946eea4b"
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
