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
  export const APT = "APT";
  export const ARBITRUM_ONE = "ARBITRUM_ONE";
  export const ARBITRUM_NOVA = "ARBITRUM_NOVA";
  export const ASTAR = "ASTAR";
  export const AURORA = "AURORA";
  export const AVALANCHE = "AVALANCHE";
  export const BITGERT = "BITGERT";
  export const BITTORRENT = "BITTORRENT";
  export const BLOCK = "BLOCK";
  export const BOBA = "BOBA";
  export const BOBA_2 = "BOBA_2";
  export const BSC = "BSC"; // aka BNB Chain
  export const BTC = "BTC";
  export const CELO = "CELO";
  export const CLOVER = "CLOVER";
  export const COLX = "COLX";
  export const CONFLUX = "CONFLUX";
  export const CRONOS = "CRONOS";
  export const CUBE = "CUBE";
  export const DFK = "DFK";
  export const DOGECHAIN = "DOGECHAIN";
  export const MAINNET = "MAINNET"; // Ethereum mainnet
  export const ETH_POW = "ETH_POW";
  export const ETHEREUM_CLASSIC = "ETHEREUM_CLASSIC";
  export const EVMOS = "EVMOS";
  export const FANTOM = "FANTOM";
  export const FITFI = "FITFI";
  export const FUSE = "FUSE";
  export const FUSION = "FUSION";
  export const GODWOKEN_V1 = "GODWOKEN_V1";
  export const HARMONY = "HARMONY";
  export const HECO = "HECO";
  export const HOO = "HOO";
  export const IOTEX = "IOTEX";
  export const KARDIA = "KARDIA";
  export const KAVA = "KAVA";
  export const KCC = "KCC";
  export const KLAYTN = "KLAYTN";
  export const LTC = "LTC";
  export const MATIC = "MATIC"; // aka Polygon
  export const METIS = "METIS";
  export const MILKOMEDA = "MILKOMEDA";
  export const MILKOMEDA_A1 = "MILKOMEDA_A1";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const NAS = "NAS";
  export const NEAR = "NEAR";
  export const OASIS = "OASIS";
  export const OKEXCHAIN = "OKEXCHAIN";
  export const ONTOLOGY_EVM = "ONTOLOGY_EVM";
  export const OPTIMISM = "OPTIMISM";
  export const REI = "REI";
  export const RONIN = "RONIN";
  export const RSK = "RSK";
  export const SHIDEN = "SHIDEN";
  export const SMARTBCH = "SMARTBCH";
  export const SYSCOIN = "SYSCOIN";
  export const TELOS = "TELOS";
  export const TERRA = "TERRA";
  export const THUNDERCORE = "THUNDERCORE";
  export const TOMOCHAIN = "TOMOCHAIN";
  export const VELAS = "VELAS";
  export const WEMIX = "WEMIX";
  export const XDAI = "XDAI"; // aka Gnosis Chain
  export const XRP = "XRP";
  export const UNKNOWN_NETWORK = "UNKNOWN_NETWORK";
}

export namespace ProtocolType {
  export const EXCHANGE = "EXCHANGE";
  export const LENDING = "LENDING";
  export const YIELD = "YIELD";
  export const BRIDGE = "BRIDGE";
  export const GENERIC = "GENERIC";
}

export namespace BridgePermissionType {
  export const PERMISSIONLESS = "PERMISSIONLESS";
  export const WHITELIST = "WHITELIST";
  export const PRIVATE = "PRIVATE";
}

export namespace BridgePoolType {
  export const LOCK_RELEASE = "LOCK_RELEASE";
  export const BURN_MINT = "BURN_MINT";
  export const LIQUIDITY = "LIQUIDITY";
}

export namespace CrosschainTokenType {
  export const WRAPPED = "WRAPPED";
  export const CANONICAL = "CANONICAL";
}

export namespace EventType {
  export const DEPOSIT = "DEPOSIT";
  export const WITHDRAW = "WITHDRAW";
  export const TRANSFER_IN = "TRANSFER_IN";
  export const TRANSFER_OUT = "TRANSFER_OUT";
  export const MESSAGE_IN = "MESSAGE_IN";
  export const MESSAGE_OUT = "MESSAGE_OUT";
}

export const InverseEventType = new TypedMap<string, string>();
InverseEventType.set(EventType.DEPOSIT, EventType.WITHDRAW);
InverseEventType.set(EventType.WITHDRAW, EventType.DEPOSIT);
InverseEventType.set(EventType.TRANSFER_IN, EventType.TRANSFER_OUT);
InverseEventType.set(EventType.TRANSFER_OUT, EventType.TRANSFER_IN);
InverseEventType.set(EventType.MESSAGE_IN, EventType.MESSAGE_OUT);
InverseEventType.set(EventType.MESSAGE_OUT, EventType.MESSAGE_IN);

export namespace TransferType {
  export const MINT = "MINT";
  export const BURN = "BURN";
  export const LOCK = "LOCK";
  export const RELEASE = "RELEASE";
}

export namespace BridgeType {
  export const BRIDGE = "BRIDGE";
  export const ROUTER = "ROUTER";
}

////////////////////
///// Ethereum /////
////////////////////

export const ETH_NAME = "Ether";
export const ETH_SYMBOL = "ETH";
export const ETH_DECIMALS = 18;
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const ETH_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

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
export const BIGDECIMAL_HUNDRED = new BigDecimal(BIGINT_HUNDRED);

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

export const NetworkByID = new TypedMap<string, string>();
NetworkByID.set("1", Network.MAINNET);
NetworkByID.set("10", Network.OPTIMISM);
NetworkByID.set("24", Network.KARDIA);
NetworkByID.set("25", Network.CRONOS);
NetworkByID.set("30", Network.RSK);
NetworkByID.set("40", Network.TELOS);
NetworkByID.set("56", Network.BSC);
NetworkByID.set("57", Network.SYSCOIN);
NetworkByID.set("58", Network.ONTOLOGY_EVM);
NetworkByID.set("61", Network.ETHEREUM_CLASSIC);
NetworkByID.set("66", Network.OKEXCHAIN);
NetworkByID.set("70", Network.HOO);
NetworkByID.set("88", Network.TOMOCHAIN);
NetworkByID.set("100", Network.XDAI);
NetworkByID.set("106", Network.VELAS);
NetworkByID.set("108", Network.THUNDERCORE);
NetworkByID.set("122", Network.FUSE);
NetworkByID.set("128", Network.HECO);
NetworkByID.set("137", Network.MATIC);
NetworkByID.set("199", Network.BITTORRENT);
NetworkByID.set("250", Network.FANTOM);
NetworkByID.set("288", Network.BOBA);
NetworkByID.set("321", Network.KCC);
NetworkByID.set("336", Network.SHIDEN);
NetworkByID.set("592", Network.ASTAR);
NetworkByID.set("1024", Network.CLOVER);
NetworkByID.set("1030", Network.CONFLUX);
NetworkByID.set("1088", Network.METIS);
NetworkByID.set("1111", Network.WEMIX);
NetworkByID.set("1234", Network.FITFI);
NetworkByID.set("1284", Network.MOONBEAM);
NetworkByID.set("1285", Network.MOONRIVER);
NetworkByID.set("1818", Network.CUBE);
NetworkByID.set("1294", Network.BOBA);
NetworkByID.set("2000", Network.DOGECHAIN);
NetworkByID.set("2001", Network.MILKOMEDA);
NetworkByID.set("2002", Network.MILKOMEDA_A1);
NetworkByID.set("2020", Network.RONIN);
NetworkByID.set("2222", Network.KAVA);
NetworkByID.set("4689", Network.IOTEX);
NetworkByID.set("8217", Network.KLAYTN);
NetworkByID.set("9001", Network.EVMOS);
NetworkByID.set("10000", Network.SMARTBCH);
NetworkByID.set("10001", Network.ETH_POW);
NetworkByID.set("32659", Network.FUSION);
NetworkByID.set("42161", Network.ARBITRUM_ONE);
NetworkByID.set("42170", Network.ARBITRUM_NOVA);
NetworkByID.set("42220", Network.CELO);
NetworkByID.set("42262", Network.OASIS);
NetworkByID.set("43114", Network.AVALANCHE);
NetworkByID.set("47805", Network.REI);
NetworkByID.set("53935", Network.DFK);
NetworkByID.set("71402", Network.GODWOKEN_V1);
NetworkByID.set("1313161554", Network.AURORA);
NetworkByID.set("1666600000", Network.HARMONY);
NetworkByID.set("32520", Network.BITGERT);
NetworkByID.set("1000005002307", Network.LTC);
NetworkByID.set("1000004346947", Network.BTC);
NetworkByID.set("1001129270360", Network.COLX);
NetworkByID.set("1284748104523", Network.BLOCK);
NetworkByID.set("1001313161554", Network.NEAR);
NetworkByID.set("1000005788240", Network.XRP);
NetworkByID.set("1000004280404", Network.APT);
NetworkByID.set("1000005128531", Network.NAS);
NetworkByID.set("1361940275777", Network.TERRA);

const mainnetInaccuratePricefeedTokens = [
  Address.fromString("0x86a298581388bc199e61bfecdca8ea22cf6c0da3"), // anyGTPS
  Address.fromString("0x9b2f9f348425b1ef54c232f87ee7d4d570c1b552"), // anyHOGE
  Address.fromString("0x015cea338ce68bd912b3c704620c6000ee9f4ab9"), // anyGCAKE
];

export const INACCURATE_PRICEFEED_TOKENS = new TypedMap<string, Address[]>();
INACCURATE_PRICEFEED_TOKENS.set(Network.ARBITRUM_ONE, []);
INACCURATE_PRICEFEED_TOKENS.set(Network.AURORA, []);
INACCURATE_PRICEFEED_TOKENS.set(Network.AVALANCHE, []);
INACCURATE_PRICEFEED_TOKENS.set(Network.BOBA, []);
INACCURATE_PRICEFEED_TOKENS.set(Network.BSC, []);
INACCURATE_PRICEFEED_TOKENS.set(Network.CELO, []);
INACCURATE_PRICEFEED_TOKENS.set(Network.CRONOS, []);
INACCURATE_PRICEFEED_TOKENS.set(Network.FANTOM, []);
INACCURATE_PRICEFEED_TOKENS.set(Network.FUSE, []);
INACCURATE_PRICEFEED_TOKENS.set(Network.XDAI, []);
INACCURATE_PRICEFEED_TOKENS.set(Network.HARMONY, []);
INACCURATE_PRICEFEED_TOKENS.set(
  Network.MAINNET,
  mainnetInaccuratePricefeedTokens
);
INACCURATE_PRICEFEED_TOKENS.set(Network.MOONBEAM, []);
INACCURATE_PRICEFEED_TOKENS.set(Network.MOONRIVER, []);
INACCURATE_PRICEFEED_TOKENS.set(Network.OPTIMISM, []);
INACCURATE_PRICEFEED_TOKENS.set(Network.MATIC, []);
INACCURATE_PRICEFEED_TOKENS.set(Network.UNKNOWN_NETWORK, []);
