import { BigDecimal, BigInt, dataSource } from "@graphprotocol/graph-ts";

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
  export const BOBA = "BOBA";
  export const BSC = "BSC"; // aka BNB Chain
  export const CELO = "CELO";
  export const CLOVER = "CLOVER";
  export const COSMOS = "COSMOS";
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

// This is how the Network displays on thegraph.com
export namespace SubgraphNetwork {
  export const ARBITRUM = "arbitrum-one";
  export const AVALANCHE = "avalanche";
  export const AURORA = "aurora";
  export const BOBA = "boba";
  export const BSC = "bsc";
  export const CELO = "celo";
  export const CHAPEL = "chapel";
  export const CLOVER = "clover";
  export const COSMOS = "cosmoshub";
  export const ETHEREUM = "mainnet";
  export const FANTOM = "fantom";
  export const FUSE = "fuse";
  export const MOONBEAM = "moonbeam";
  export const MOONRIVER = "moonriver";
  export const MUMBAI = "mumbai";
  export const NEAR = "near-mainnet";
  export const OPTIMISM = "optimism";
  export const POLYGON = "matic";
  export const POA = "poa-core";
  export const XDAI = "xdai";
}

export namespace IntervalType {
  export const DAILY = "DAILY";
  export const HOURLY = "HOURLY";
}

/////////////////
//// Numbers ////
/////////////////

export const INT_NEGATIVE_ONE = -1;
export const INT_ZERO = 0;
export const INT_ONE = 1;
export const INT_TWO = 2;
export const INT_FOUR = 4;

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

///////////////////////////
//// Network constants ////
///////////////////////////

export const NETWORK_NAME = dataSource.network();
export const SCHEMA_VERSION = "1.0.0";
export const METHODOLOGY_VERSION = "1.0.0";
export const SUBGRAPH_VERSION = "1.0.2";
