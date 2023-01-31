import { Address, dataSource, log } from "@graphprotocol/graph-ts";
import { Network, ZERO_ADDRESS } from "../../../src/constants";

//////////////////////////////
///// Ethereum Addresses /////
//////////////////////////////

export const USDC_TOKEN_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // ETH
export const USDC_POS_TOKEN_ADDRESS =
  "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"; // Polygon

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export namespace Protocol {
  export const NAME = "Aave v3";
  export const SLUG = "aave-v3";
}

export namespace TokenType {
  export const ATOKEN = "ATOKEN";
  export const INPUTTOKEN = "INPUTTOKEN";
  export const VTOKEN = "VTOKEN";
  export const STOKEN = "STOKEN";
}

export const AAVE_DECIMALS = 8;

////////////////////////////
///// Network Specific /////
////////////////////////////

export class NetworkSpecificConstant {
  constructor(
    public readonly protocolAddress: Address, // aka, PoolAddressesProviderRegistry
    public readonly network: string
  ) {}
}

export function getNetworkSpecificConstant(): NetworkSpecificConstant {
  const network = dataSource.network();
  if (equalsIgnoreCase(network, Network.ARBITRUM_ONE)) {
    return new NetworkSpecificConstant(
      Address.fromString("0x770ef9f4fe897e59daCc474EF11238303F9552b6"),
      Network.ARBITRUM_ONE
    );
  } else if (equalsIgnoreCase(network, Network.AVALANCHE)) {
    return new NetworkSpecificConstant(
      Address.fromString("0x770ef9f4fe897e59dacc474ef11238303f9552b6"),
      Network.AVALANCHE
    );
  } else if (equalsIgnoreCase(network, Network.FANTOM)) {
    return new NetworkSpecificConstant(
      Address.fromString("0x770ef9f4fe897e59dacc474ef11238303f9552b6"),
      Network.FANTOM
    );
  } else if (equalsIgnoreCase(network, Network.HARMONY)) {
    return new NetworkSpecificConstant(
      Address.fromString("0x770ef9f4fe897e59dacc474ef11238303f9552b6"),
      Network.HARMONY
    );
  } else if (equalsIgnoreCase(network, Network.MATIC)) {
    return new NetworkSpecificConstant(
      Address.fromString("0x770ef9f4fe897e59dacc474ef11238303f9552b6"),
      Network.MATIC
    );
  } else if (equalsIgnoreCase(network, Network.OPTIMISM)) {
    return new NetworkSpecificConstant(
      Address.fromString("0x770ef9f4fe897e59dacc474ef11238303f9552b6"),
      Network.OPTIMISM
    );
  } else if (equalsIgnoreCase(network, Network.MAINNET)) {
    return new NetworkSpecificConstant(
      Address.fromString("0xbaa999ac55eace41ccae355c77809e68bb345170"),
      Network.MAINNET
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

// Context keys
export const PROTOCOL_ID_KEY = "protocolId";
export const POOL_ADDRESSES_PROVIDER_ID_KEY = "poolAddressesProviderId";
