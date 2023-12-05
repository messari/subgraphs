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
  export const ADA = "ADA";
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
  export const SOL = "SOL";
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

export const INVERSE_EVENT_TYPE = new TypedMap<string, string>();
INVERSE_EVENT_TYPE.set(EventType.DEPOSIT, EventType.WITHDRAW);
INVERSE_EVENT_TYPE.set(EventType.WITHDRAW, EventType.DEPOSIT);
INVERSE_EVENT_TYPE.set(EventType.TRANSFER_IN, EventType.TRANSFER_OUT);
INVERSE_EVENT_TYPE.set(EventType.TRANSFER_OUT, EventType.TRANSFER_IN);
INVERSE_EVENT_TYPE.set(EventType.MESSAGE_IN, EventType.MESSAGE_OUT);
INVERSE_EVENT_TYPE.set(EventType.MESSAGE_OUT, EventType.MESSAGE_IN);

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
export const BIGINT_FOURTY_FIVE = BigInt.fromI32(45);
export const BIGINT_FIFTY_FIVE = BigInt.fromI32(55);
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
export const BIGDECIMAL_FOURTY_FIVE = new BigDecimal(BIGINT_FOURTY_FIVE);
export const BIGDECIMAL_FIFTY_FIVE = new BigDecimal(BIGINT_FIFTY_FIVE);
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

export const ID_BY_NETWORK = new TypedMap<string, BigInt>();
ID_BY_NETWORK.set(Network.ARBITRUM_ONE, BigInt.fromI32(42161));
ID_BY_NETWORK.set(Network.AVALANCHE, BigInt.fromI32(43114));
ID_BY_NETWORK.set(Network.BSC, BigInt.fromI32(56));
ID_BY_NETWORK.set(Network.CELO, BigInt.fromI32(42220));
ID_BY_NETWORK.set(Network.MAINNET, BigInt.fromI32(1));
ID_BY_NETWORK.set(Network.FANTOM, BigInt.fromI32(250));
ID_BY_NETWORK.set(Network.XDAI, BigInt.fromI32(100));
ID_BY_NETWORK.set(Network.OPTIMISM, BigInt.fromI32(10));
ID_BY_NETWORK.set(Network.MATIC, BigInt.fromI32(137));

export const NETWORK_BY_ID = new TypedMap<string, string>();
NETWORK_BY_ID.set("1", Network.MAINNET);
NETWORK_BY_ID.set("10", Network.OPTIMISM);
NETWORK_BY_ID.set("24", Network.KARDIA);
NETWORK_BY_ID.set("25", Network.CRONOS);
NETWORK_BY_ID.set("30", Network.RSK);
NETWORK_BY_ID.set("40", Network.TELOS);
NETWORK_BY_ID.set("56", Network.BSC);
NETWORK_BY_ID.set("57", Network.SYSCOIN);
NETWORK_BY_ID.set("58", Network.ONTOLOGY_EVM);
NETWORK_BY_ID.set("61", Network.ETHEREUM_CLASSIC);
NETWORK_BY_ID.set("66", Network.OKEXCHAIN);
NETWORK_BY_ID.set("70", Network.HOO);
NETWORK_BY_ID.set("88", Network.TOMOCHAIN);
NETWORK_BY_ID.set("100", Network.XDAI);
NETWORK_BY_ID.set("106", Network.VELAS);
NETWORK_BY_ID.set("108", Network.THUNDERCORE);
NETWORK_BY_ID.set("122", Network.FUSE);
NETWORK_BY_ID.set("128", Network.HECO);
NETWORK_BY_ID.set("137", Network.MATIC);
NETWORK_BY_ID.set("199", Network.BITTORRENT);
NETWORK_BY_ID.set("250", Network.FANTOM);
NETWORK_BY_ID.set("288", Network.BOBA);
NETWORK_BY_ID.set("321", Network.KCC);
NETWORK_BY_ID.set("336", Network.SHIDEN);
NETWORK_BY_ID.set("592", Network.ASTAR);
NETWORK_BY_ID.set("1024", Network.CLOVER);
NETWORK_BY_ID.set("1030", Network.CONFLUX);
NETWORK_BY_ID.set("1088", Network.METIS);
NETWORK_BY_ID.set("1111", Network.WEMIX);
NETWORK_BY_ID.set("1234", Network.FITFI);
NETWORK_BY_ID.set("1284", Network.MOONBEAM);
NETWORK_BY_ID.set("1285", Network.MOONRIVER);
NETWORK_BY_ID.set("1818", Network.CUBE);
NETWORK_BY_ID.set("1294", Network.BOBA);
NETWORK_BY_ID.set("2000", Network.DOGECHAIN);
NETWORK_BY_ID.set("2001", Network.MILKOMEDA);
NETWORK_BY_ID.set("2002", Network.MILKOMEDA_A1);
NETWORK_BY_ID.set("2020", Network.RONIN);
NETWORK_BY_ID.set("2222", Network.KAVA);
NETWORK_BY_ID.set("4689", Network.IOTEX);
NETWORK_BY_ID.set("8217", Network.KLAYTN);
NETWORK_BY_ID.set("9001", Network.EVMOS);
NETWORK_BY_ID.set("10000", Network.SMARTBCH);
NETWORK_BY_ID.set("10001", Network.ETH_POW);
NETWORK_BY_ID.set("32659", Network.FUSION);
NETWORK_BY_ID.set("42161", Network.ARBITRUM_ONE);
NETWORK_BY_ID.set("42170", Network.ARBITRUM_NOVA);
NETWORK_BY_ID.set("42220", Network.CELO);
NETWORK_BY_ID.set("42262", Network.OASIS);
NETWORK_BY_ID.set("43114", Network.AVALANCHE);
NETWORK_BY_ID.set("47805", Network.REI);
NETWORK_BY_ID.set("53935", Network.DFK);
NETWORK_BY_ID.set("71402", Network.GODWOKEN_V1);
NETWORK_BY_ID.set("1313161554", Network.AURORA);
NETWORK_BY_ID.set("1666600000", Network.HARMONY);
NETWORK_BY_ID.set("32520", Network.BITGERT);
NETWORK_BY_ID.set("1000005002307", Network.LTC);
NETWORK_BY_ID.set("1000004346947", Network.BTC);
NETWORK_BY_ID.set("1001129270360", Network.COLX);
NETWORK_BY_ID.set("1284748104523", Network.BLOCK);
NETWORK_BY_ID.set("1001313161554", Network.NEAR);
NETWORK_BY_ID.set("1000005788240", Network.XRP);
NETWORK_BY_ID.set("1000004280404", Network.APT);
NETWORK_BY_ID.set("1000005128531", Network.NAS);
NETWORK_BY_ID.set("1361940275777", Network.TERRA);
NETWORK_BY_ID.set("1000004277313", Network.ADA);
NETWORK_BY_ID.set("1000005459788", Network.SOL);
NETWORK_BY_ID.set("0", Network.UNKNOWN_NETWORK);

const MAINNET_INACCURATE_PRICEFEED_TOKENS = [
  Address.fromString("0x86a298581388bc199e61bfecdca8ea22cf6c0da3"), // anyGTPS
  Address.fromString("0x9b2f9f348425b1ef54c232f87ee7d4d570c1b552"), // anyHOGE
  Address.fromString("0x015cea338ce68bd912b3c704620c6000ee9f4ab9"), // anyGCAKE
];
const BSC_INACCURATE_PRICEFEED_TOKENS = [
  Address.fromString("0x98d939325313ae0129c377b3eabdf39188b38760"), // anyMFTU
  Address.fromString("0x1441e091e1247e6e6990ccb2c27169204fb04aa9"), // anyXMETA
];
const MATIC_INACCURATE_PRICEFEED_TOKENS = [
  Address.fromString("0xd4d4139b2f64b0367f522732b27be7701d36e187"), // anyHND
];
const AVALANCHE_INACCURATE_PRICEFEED_TOKENS = [
  Address.fromString("0xeaf8190fd5042ec3144184241fd405bb1dec59e8"), // anyUSDt
  Address.fromString("0xa2f9a3323e3664b9684fbc9fb64861dc493085df"), // anyUSDC
  Address.fromString("0x19f36bbb75cfb2969486d46a95e37c74a90c7cbb"), // anyPOPS
];

export const INACCURATE_PRICEFEED_TOKENS = new TypedMap<string, Address[]>();
INACCURATE_PRICEFEED_TOKENS.set(Network.ARBITRUM_ONE, []);
INACCURATE_PRICEFEED_TOKENS.set(Network.AURORA, []);
INACCURATE_PRICEFEED_TOKENS.set(
  Network.AVALANCHE,
  AVALANCHE_INACCURATE_PRICEFEED_TOKENS
);
INACCURATE_PRICEFEED_TOKENS.set(Network.BOBA, []);
INACCURATE_PRICEFEED_TOKENS.set(Network.BSC, BSC_INACCURATE_PRICEFEED_TOKENS);
INACCURATE_PRICEFEED_TOKENS.set(Network.CELO, []);
INACCURATE_PRICEFEED_TOKENS.set(Network.CRONOS, []);
INACCURATE_PRICEFEED_TOKENS.set(Network.FANTOM, []);
INACCURATE_PRICEFEED_TOKENS.set(Network.FUSE, []);
INACCURATE_PRICEFEED_TOKENS.set(Network.XDAI, []);
INACCURATE_PRICEFEED_TOKENS.set(Network.HARMONY, []);
INACCURATE_PRICEFEED_TOKENS.set(
  Network.MAINNET,
  MAINNET_INACCURATE_PRICEFEED_TOKENS
);
INACCURATE_PRICEFEED_TOKENS.set(Network.MOONBEAM, []);
INACCURATE_PRICEFEED_TOKENS.set(Network.MOONRIVER, []);
INACCURATE_PRICEFEED_TOKENS.set(Network.OPTIMISM, []);
INACCURATE_PRICEFEED_TOKENS.set(
  Network.MATIC,
  MATIC_INACCURATE_PRICEFEED_TOKENS
);
INACCURATE_PRICEFEED_TOKENS.set(Network.UNKNOWN_NETWORK, []);

export const CONTEXT_KEY_POOLID = "poolID";
export const CONTEXT_KEY_CHAINID = "chainID";
export const CONTEXT_KEY_CROSSCHAINID = "crosschainID";

export const INVALID_TOKEN_DECIMALS = 0;
export const UNKNOWN_TOKEN_VALUE = "unknown";

export namespace SnapshotFrequency {
  export const DAILY = "daily";
  export const HOURLY = "hourly";
}
