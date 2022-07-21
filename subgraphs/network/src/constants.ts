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
  export const ARWEAVE_MAINNET = "ARWEAVE_MAINNET";
  export const AURORA = "AURORA";
  export const AVALANCHE = "AVALANCHE";
  export const BOBA = "BOBA";
  export const BSC = "BSC"; // aka BNB Chain
  export const CELO = "CELO";
  export const COSMOS = "COSMOS";
  export const CLOVER = "CLOVER";
  export const CRONOS = "CRONOS";
  export const MAINNET = "MAINNET"; // Ethereum mainnet
  export const FANTOM = "FANTOM";
  export const FUSE = "FUSE";
  export const HARMONY = "HARMONY";
  export const JUNO = "JUNO";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const NEAR_MAINNET = "NEAR_MAINNET";
  export const OPTIMISM = "OPTIMISM";
  export const OSMOSIS = "OSMOSIS";
  export const MATIC = "MATIC"; // aka Polygon
  export const XDAI = "XDAI"; // aka Gnosis Chain
}

// This is how the Network displays on thegraph.com
// These match the network.json config files
export namespace SubgraphNetwork {
  export const ARBITRUM = "arbitrum-one";
  export const ARWEAVE = "arweave-mainnet";
  export const AVALANCHE = "avalanche";
  export const AURORA = "aurora";
  export const BOBA = "boba";
  export const BSC = "bsc";
  export const CELO = "celo";
  export const CLOVER = "clover";
  export const CRONOS = "cronos";
  export const COSMOS = "cosmoshub-4";
  export const ETHEREUM = "mainnet";
  export const FANTOM = "fantom";
  export const HARMONY = "harmony";
  export const JUNO = "juno";
  export const FUSE = "fuse";
  export const MOONBEAM = "moonbeam";
  export const MOONRIVER = "moonriver";
  export const NEAR = "near-mainnet";
  export const OPTIMISM = "optimism";
  export const OSMOSIS = "osmosis-1";
  export const POLYGON = "matic";
  export const XDAI = "xdai";
}

export namespace DataType {
  export const AUTHORS = "AUTHORS";
  export const DIFFICULTY = "DIFFICULTY";
  export const GAS_USED = "GAS_USED";
  export const GAS_LIMIT = "GAS_LIMIT";
  export const BURNT_FEES = "BURNT_FEES";
  export const REWARDS = "REWARDS";
  export const SIZE = "SIZE";
  export const CHUNKS = "CHUNKS";
  export const SUPPLY = "SUPPLY";
  export const TRANSACTIONS = "TRANSACTIONS";
  export const BLOCKS = "BLOCKS";
  export const BLOCK_INTERVAL = "BLOCK_INTERVAL";
  export const GAS_PRICE = "GAS_PRICE";
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
export const INT_NINE = 9; // nano second > second conversion

export const BIGINT_ZERO = BigInt.fromI32(INT_ZERO);
export const BIGINT_ONE = BigInt.fromI32(INT_ONE);
export const BIGINT_MAX = BigInt.fromString(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935"
);

export const BIGDECIMAL_ZERO = BigDecimal.fromString("0");
export const BIGDECIMAL_TWO = BigDecimal.fromString("2");

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
export const SCHEMA_VERSION = "1.1.0";
export const METHODOLOGY_VERSION = "1.0.0";
export const SUBGRAPH_VERSION = "1.1.0";
