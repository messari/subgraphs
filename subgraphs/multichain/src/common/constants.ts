import { Address, BigDecimal, BigInt, TypedMap } from "@graphprotocol/graph-ts";

////////////////////
///// Versions /////
////////////////////

export const PROTOCOL_NAME = "Multichain";
export const PROTOCOL_SLUG = "multichain";

////////////////////////
///// Schema Enums /////
////////////////////////

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

export namespace ProtocolType {
  export const EXCHANGE = "EXCHANGE";
  export const LENDING = "LENDING";
  export const YIELD = "YIELD";
  export const BRIDGE = "BRIDGE";
  export const GENERIC = "GENERIC";
}

export namespace RewardTokenType {
  export const DEPOSIT = "DEPOSIT";
  export const BORROW = "BORROW";
}

////////////////////
///// Ethereum /////
////////////////////

export const ETH_NAME = "Ether";
export const ETH_SYMBOL = "ETH";
export const ETH_DECIMALS = 18;
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

////////////////////////
///// Type Helpers /////
////////////////////////

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TWO = BigInt.fromI32(2);
export const BIGINT_HUNDRED = BigInt.fromI32(100);
export const BIGINT_THOUSAND = BigInt.fromI32(1000);
export const BIGINT_TEN_TO_EIGHTEENTH = BigInt.fromString("10").pow(18);
export const BIGINT_MAX = BigInt.fromString(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935"
);

export const INT_NEGATIVE_ONE = -1 as i32;
export const INT_ZERO = 0 as i32;
export const INT_ONE = 1 as i32;
export const INT_TWO = 2 as i32;
export const INT_FOUR = 4 as i32;

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export const BIGDECIMAL_TWO = new BigDecimal(BIGINT_TWO);

export const MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));

/////////////////////
///// Date/Time /////
/////////////////////

export const SECONDS_PER_DAY = 60 * 60 * 24; // 86400
export const SECONDS_PER_HOUR = 60 * 60; // 3600
export const MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export const DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const MS_PER_YEAR = DAYS_PER_YEAR.times(
  new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000))
);

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export const CHAINS = new Map<string, string>();
CHAINS.set("1", "ethereum");
CHAINS.set("10", "optimism");
CHAINS.set("24", "kardia");
CHAINS.set("25", "cronos");
CHAINS.set("30", "rsk");
CHAINS.set("40", "telos");
CHAINS.set("56", "bsc");
CHAINS.set("57", "syscoin");
CHAINS.set("58", "ontology_evm");
CHAINS.set("61", "ethereumclassic");
CHAINS.set("66", "okexchain");
CHAINS.set("70", "hoo");
CHAINS.set("88", "tomochain");
CHAINS.set("100", "xdai");
CHAINS.set("106", "velas");
CHAINS.set("108", "thundercore");
CHAINS.set("122", "fuse");
CHAINS.set("128", "heco");
CHAINS.set("137", "polygon");
CHAINS.set("199", "bittorrent");
CHAINS.set("250", "fantom");
CHAINS.set("288", "boba");
CHAINS.set("321", "kcc");
CHAINS.set("336", "shiden");
CHAINS.set("592", "astar");
CHAINS.set("1024", "clv");
CHAINS.set("1030", "conflux");
CHAINS.set("1088", "metis");
CHAINS.set("1284", "moonbeam");
CHAINS.set("1285", "moonriver");
CHAINS.set("1818", "cube");
CHAINS.set("1294", "boba");
CHAINS.set("2000", "dogechain");
CHAINS.set("2001", "milkomeda");
CHAINS.set("2002", "milkomeda_a1");
CHAINS.set("2020", "ronin");
CHAINS.set("2222", "kava");
CHAINS.set("4689", "iotex");
CHAINS.set("8217", "klaytn");
CHAINS.set("9001", "evmos");
CHAINS.set("10000", "smartbch");
CHAINS.set("10001", "ethpow");
CHAINS.set("32659", "fusion");
CHAINS.set("42161", "arbitrum");
CHAINS.set("42170", "arbitrum_nova");
CHAINS.set("42220", "celo");
CHAINS.set("42262", "oasis");
CHAINS.set("43114", "avax");
CHAINS.set("47805", "rei");
CHAINS.set("53935", "dfk");
CHAINS.set("71402", "godwoken_v1");
CHAINS.set("1313161554", "aurora");
CHAINS.set("1666600000", "harmony");
CHAINS.set("32520", "bitgert");
