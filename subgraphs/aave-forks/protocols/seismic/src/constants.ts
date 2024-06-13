import { Address, BigDecimal, dataSource, log } from "@graphprotocol/graph-ts";
import { Network, ZERO_ADDRESS } from "../../../src/constants";

//////////////////////////////
///// Ethereum Addresses /////
//////////////////////////////

export const USDC_TOKEN_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"; // ETH
export const USDC_POS_TOKEN_ADDRESS =
  "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"; // Polygon

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export namespace Protocol {
  export const PROTOCOL = "Seismic Protocol";
  export const NAME = "Seismic Protocol";
  export const SLUG = "seismic";
}
export const AAVE_DECIMALS = 8;

// This is hardcoded and can not be changed, so it is set as a constant here
// https://etherscan.io/address/0x05bfa9157e92690b179033ca2f6dd1e86b25ea4d#code#F96#L89
export const FLASHLOAN_PREMIUM_TOTAL = BigDecimal.fromString("0.0009"); // = 9/10000

////////////////////////////
///// Network Specific /////
////////////////////////////

export class NetworkSpecificConstant {
  constructor(
    public readonly protocolAddress: Address, // aka, LendingPoolAddressesProvider
    public readonly network: string
  ) {}
}

export function getNetworkSpecificConstant(): NetworkSpecificConstant {
  const network = dataSource.network();
  if (equalsIgnoreCase(network, Network.BLAST_MAINNET)) {
    return new NetworkSpecificConstant(
      Address.fromString("0xeeca436a6d4aff6f0d55d71e9b1c271abf511cd0"),
      Network.BLAST_MAINNET
    );
  } else {
    log.critical("[getNetworkSpecificConstant] Unsupported network: {}", [
      network,
    ]);
    return new NetworkSpecificConstant(Address.fromString(ZERO_ADDRESS), "");
  }
}

export function equalsIgnoreCase(a: string, b: string): boolean {
  return a.replace("-", "_").toLowerCase() == b.replace("-", "_").toLowerCase();
}
