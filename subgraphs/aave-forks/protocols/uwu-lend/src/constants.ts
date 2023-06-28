import { Address } from "@graphprotocol/graph-ts";
import { Network } from "../../../src/constants";

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export namespace Protocol {
  export const NAME = "UwU Lend";
  export const SLUG = "uwu-lend";
}
export const UWU_DECIMALS = 8;
export const UWU_TOKEN_ADDRESS = "0x55c08ca52497e2f1534b59e2917bf524d4765257";
export const WETH_TOKEN_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
export const UWU_WETH_LP = "0x3e04863dba602713bb5d0edbf7db7c3a9a2b6027"; // Sushiswap LP

////////////////////////////
///// Network Specific /////
////////////////////////////

export const PROTOCOL_ADDRESS = Address.fromString(
  "0x011c0d38da64b431a1bdfc17ad72678eabf7f1fb"
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
