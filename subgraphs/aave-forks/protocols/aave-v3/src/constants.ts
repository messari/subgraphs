import {
  Address,
  ByteArray,
  crypto,
  dataSource,
  log,
} from "@graphprotocol/graph-ts";
import { Network, ZERO_ADDRESS } from "../../../src/constants";

//////////////////////////////
///// Ethereum Addresses /////
//////////////////////////////

export const DUSD_TOKEN_ADDRESS = "0x4d6e79013212f10a026a1fb0b926c9fd0432b96c"; // DUSD
export const USDC_TOKEN_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"; // ETH
export const USDC_POS_TOKEN_ADDRESS =
  "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"; // Polygon

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export namespace Protocol {
  export const PROTOCOL = "Aave";
  export const NAME = "Aave v3";
  export const SLUG = "aave-v3";
}

export const AAVE_DECIMALS = 8;

export namespace InterestRateMode {
  export const NONE = 0 as i32;
  export const STABLE = 1 as i32;
  export const VARIABLE = 2 as i32;
}

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
      Address.fromString("0x770ef9f4fe897e59dacc474ef11238303f9552b6"),
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
  } else if (equalsIgnoreCase(network, Network.METIS)) {
    return new NetworkSpecificConstant(
      Address.fromString("0x9e7b73ffd9d2026f3ff4212c29e209e09c8a91f5"),
      Network.METIS
    );
  } else if (equalsIgnoreCase(network, Network.BASE)) {
    return new NetworkSpecificConstant(
      Address.fromString("0xe20fcbdbffc4dd138ce8b2e6fbb6cb49777ad64d"),
      Network.BASE
    );
  } else if (equalsIgnoreCase(network, Network.GNOSIS)) {
    return new NetworkSpecificConstant(
      Address.fromString("0x36616cf17557639614c1cddb356b1b83fc0b2132"),
      Network.GNOSIS
    );
  } else if (equalsIgnoreCase(network, Network.BSC)) {
    return new NetworkSpecificConstant(
      Address.fromString("0xff75b6da14ffbbfd355daf7a2731456b3562ba6d"),
      Network.BSC
    );
  } else if (equalsIgnoreCase(network, Network.SCROLL)) {
    return new NetworkSpecificConstant(
      Address.fromString("0x69850d0b276776781c063771b161bd8894bcdd04"),
      Network.SCROLL
    );
  } else if (equalsIgnoreCase(network, 'frax-testnet')) {
    return new NetworkSpecificConstant(
      Address.fromString("0x4e78cb95a44ad8a1279d7d75786d45aa66c5157f"),
      Network.FRAXTAL_TESTNET
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

export const BALANCE_TRANSFER_SIGNATURE = crypto.keccak256(
  ByteArray.fromUTF8("BalanceTransfer(address,address,uint256,uint256)")
);
export const BALANCE_TRANSFER_DATA_TYPE = "(uint256,uint256)";
