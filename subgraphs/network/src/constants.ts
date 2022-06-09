import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

/////////////////////////
//// Enums / Classes ////
/////////////////////////

// The network names corresponding to the Network enum in the schema.
// They also correspond to the ones in `dataSource.network()` after converting to lower case.
// See below for a complete list:
// https://thegraph.com/docs/en/hosted-service/what-is-hosted-service/#supported-networks-on-the-hosted-service
export namespace Network {
  export const ARBITRUM_ONE = "ARBITRUM_ONE";
  export const AVALANCHE = "AVALANCHE";
  export const AURORA = "AURORA";
  export const BSC = "BSC"; // aka BNB Chain
  export const CELO = "CELO";
  export const MAINNET = "MAINNET"; // Ethereum mainnet
  export const FANTOM = "FANTOM";
  export const FUSE = "FUSE";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const NEAR_MAINNET = "NEAR_MAINNET";
  export const OPTIMISM = "OPTIMISM";
  export const MATIC = "MATIC"; // aka Polygon
  export const XDAI = "XDAI"; // aka Gnosis Chain
}

/////////////////
//// Numbers ////
/////////////////

export const INT_ZERO = 0;

export const BIGINT_ZERO = BigInt.fromI32(INT_ZERO);

export const BIGDECIMAL_ZERO = BigDecimal.fromString("0");

/////////////////////
//// Date / Time ////
/////////////////////

export const SECONDS_PER_HOUR = 60 * 60; // 3600
export const SECONDS_PER_DAY = SECONDS_PER_HOUR * 24; // 86400

///////////////////
//// Addresses ////
///////////////////

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

//////////////////////////////////
//// Chain-specific constants ////
//////////////////////////////////

export const SCHEMA_VERSION = "1.0.0";
export const METHODOLOGY_VERSION = "1.0.0";
export const SUBGRAPH_VERSION = "1.0.0";

// TODO:
// name, decimals, maxSupply, native token address
// ETH constants
export const NATIVE_TOKEN = ETH_ADDRESS;
export const NATIVE_TOKEN_DECIMALS = 18;
export const BLOCKCHAIN_NAME = Network.MAINNET;
export const MAX_SUPPLY = BIGINT_ZERO;
