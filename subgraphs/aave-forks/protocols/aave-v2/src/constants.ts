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
  export const PROTOCOL = "Aave";
  export const NAME = "Aave v2";
  export const SLUG = "aave-v2";
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
  if (equalsIgnoreCase(network, Network.MAINNET)) {
    return new NetworkSpecificConstant(
      Address.fromString("0xb53c1a33016b2dc2ff3653530bff1848a515c8c5"),
      Network.MAINNET
    );
  } else if (equalsIgnoreCase(network, Network.AVALANCHE)) {
    return new NetworkSpecificConstant(
      Address.fromString("0xb6a86025f0fe1862b372cb0ca18ce3ede02a318f"),
      Network.AVALANCHE
    );
  } else if (equalsIgnoreCase(network, Network.MATIC)) {
    return new NetworkSpecificConstant(
      Address.fromString("0xd05e3e715d945b59290df0ae8ef85c1bdb684744"),
      Network.MATIC
    );
  } else {
    log.error("[getNetworkSpecificConstant] Unsupported network: {}", [
      network,
    ]);
    return new NetworkSpecificConstant(Address.fromString(ZERO_ADDRESS), "");
  }
}

export function equalsIgnoreCase(a: string, b: string): boolean {
  return a.replace("-", "_").toLowerCase() == b.replace("-", "_").toLowerCase();
}
