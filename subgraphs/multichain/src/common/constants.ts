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
  export const THUNDERCORE = "THUNDERCORE";
  export const TOMOCHAIN = "TOMOCHAIN";
  export const VELAS = "VELAS";
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
NetworkByID.set("99999", Network.LTC);
NetworkByID.set("99998", Network.BTC);
NetworkByID.set("99997", Network.COLX);
NetworkByID.set("99996", Network.BLOCK);
NetworkByID.set("99995", Network.NEAR);
NetworkByID.set("99994", Network.XRP);
NetworkByID.set("99993", Network.APT);

const mainnetInacuratePricefeedTokens = [
  Address.fromString("0x86A298581388bc199e61BFeCDcA8eA22Cf6C0Da3"), // anyGTPS

  Address.fromString("0xb4f89d6a8c113b4232485568e542e646d93cfab1"),
  Address.fromString("0xb5c827fdbbee6f6e9df3a5cb499aedf5927de1b8"),
  Address.fromString("0xdc9524a8774dc2956bdb8b55fdf91938757f3185"),
  Address.fromString("0xc9d7cc5d224119c6a563a2aa2c5a49ebc97444d7"),
  Address.fromString("0x620e59769085f69d2712a53aa0436821218e1068"),
  Address.fromString("0xa10d8a7cae8dae8019daa64095f309716264ebca"),
  Address.fromString("0x1469fd8b056e098d9035d3c7c9109e22a1f4ca86"),
  Address.fromString("0x04ae3226c80e8c04d35e6e56089345bdd06da6de"),
  Address.fromString("0x85a8df6564517cd0a8501587db0cc74850f191d6"),
  Address.fromString("0xca0bc229e2216a6ba6ef0278351ed6aa2303ddf6"),
  Address.fromString("0xa648904b6e812e2d847b87878a9a3f1d74e5af50"),

  Address.fromString("0x93f9a668dccc090f63b0ec27d809527dc2f0ebba"),
  Address.fromString("0xc65d2f76c6cc9fde1ceea5d47d5753b889e22412"),
  Address.fromString("0xe57bcdeb786e163b5e10f0b5ca7b59c8764d1080"),
  Address.fromString("0x183c9e9c8a787269024a20f2e3788764cd458f72"),
  Address.fromString("0x36ce6ded1378c83bcb6efe844550af94b90a1979"),
  Address.fromString("0x302434cc94a5ada01ee23375ff8c61f42f1dabb1"),
  Address.fromString("0x54bbaa521fa27065e3067b431ce9563dbaf8733b"),
  Address.fromString("0x4cb7a6dec613f4af9f618cff56354f76115a8023"),
  Address.fromString("0x9492b0ab0571b2c785c2dad4b3a272dba39d6e61"),
  Address.fromString("0x5bc2228dc7be251ca5d6068e01fc6d4e7ca3d3a1"),
  Address.fromString("0xc2ea516ed97778afa2331be021754735796865e8"),
  Address.fromString("0xa288507d3cae42adf3bef755c37b8605a9f62f25"),
  Address.fromString("0x123aeafd4ce574be7d417aca0e5cb3122f3e1149"),
  Address.fromString("0x16c102f12468670c8d2bb03ea6d781cb3394c09e"),
  Address.fromString("0xb467613d657edb3d3e926aeba0f17386976a9c1f"),
  Address.fromString("0xa8d0352634d3dec194e48b9878634487a837df0f"),
  Address.fromString("0xee9c40f27687a6c5de027b102caa31e2ff7a8956"),
  Address.fromString("0x0aa1a18504a10c1c09732e5859ee2bd1892ac762"),
];

export const INACURATE_PRICEFEED_TOKENS = new TypedMap<string, Address[]>();
INACURATE_PRICEFEED_TOKENS.set(Network.ARBITRUM_ONE, []);
INACURATE_PRICEFEED_TOKENS.set(Network.AURORA, []);
INACURATE_PRICEFEED_TOKENS.set(Network.AVALANCHE, []);
INACURATE_PRICEFEED_TOKENS.set(Network.BOBA, []);
INACURATE_PRICEFEED_TOKENS.set(Network.BSC, []);
INACURATE_PRICEFEED_TOKENS.set(Network.CELO, []);
INACURATE_PRICEFEED_TOKENS.set(Network.CRONOS, []);
INACURATE_PRICEFEED_TOKENS.set(Network.FANTOM, []);
INACURATE_PRICEFEED_TOKENS.set(Network.FUSE, []);
INACURATE_PRICEFEED_TOKENS.set(Network.XDAI, []);
INACURATE_PRICEFEED_TOKENS.set(Network.HARMONY, []);
INACURATE_PRICEFEED_TOKENS.set(
  Network.MAINNET,
  mainnetInacuratePricefeedTokens
);
INACURATE_PRICEFEED_TOKENS.set(Network.MOONBEAM, []);
INACURATE_PRICEFEED_TOKENS.set(Network.MOONRIVER, []);
INACURATE_PRICEFEED_TOKENS.set(Network.OPTIMISM, []);
INACURATE_PRICEFEED_TOKENS.set(Network.MATIC, []);
INACURATE_PRICEFEED_TOKENS.set(Network.UNKNOWN_NETWORK, []);
