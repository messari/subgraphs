import {
  BigDecimal,
  BigInt,
  TypedMap,
  log,
  Address,
} from "@graphprotocol/graph-ts";

////////////////////////
///// Schema Enums /////
////////////////////////

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

  // other networks
  export const UBIQ = "UBIQ";
  export const SONGBIRD = "SONGBIRD";
  export const ELASTOS = "ELASTOS";
  export const KARDIACHAIN = "KARDIACHAIN";
  export const CRONOS = "CRONOS";
  export const RSK = "RSK";
  export const TELOS = "TELOS";
  export const XDC = "XDC";
  export const ZYX = "ZYX";
  export const CSC = "CSC";
  export const SYSCOIN = "SYSCOIN";
  export const GOCHAIN = "GOCHAIN";
  export const ETHEREUMCLASSIC = "ETHEREUMCLASSIC";
  export const OKEXCHAIN = "OKEXCHAIN";
  export const HOO = "HOO";
  export const METER = "METER";
  export const NOVA_NETWORK = "NOVA_NETWORK";
  export const TOMOCHAIN = "TOMOCHAIN";
  export const VELAS = "VELAS";
  export const THUNDERCORE = "THUNDERCORE";
  export const HECO = "HECO";
  export const XDAIARB = "XDAIARB";
  export const ENERGYWEB = "ENERGYWEB";
  export const HPB = "HPB";
  export const BOBA = "BOBA";
  export const KUCOIN = "KUCOIN";
  export const SHIDEN = "SHIDEN";
  export const THETA = "THETA";
  export const SX = "SX";
  export const CANDLE = "CANDLE";
  export const ASTAR = "ASTAR";
  export const CALLISTO = "CALLISTO";
  export const WANCHAIN = "WANCHAIN";
  export const METIS = "METIS";
  export const ULTRON = "ULTRON";
  export const STEP = "STEP";
  export const DOGECHAIN = "DOGECHAIN";
  export const RONIN = "RONIN";
  export const KAVA = "KAVA";
  export const IOTEX = "IOTEX";
  export const XLC = "XLC";
  export const NAHMII = "NAHMII";
  export const TOMBCHAIN = "TOMBCHAIN";
  export const CANTO = "CANTO";
  export const KLAYTN = "KLAYTN";
  export const EVMOS = "EVMOS";
  export const SMARTBCH = "SMARTBCH";
  export const BITGERT = "BITGERT";
  export const FUSION = "FUSION";
  export const OHO = "OHO";
  export const ARB_NOVA = "ARB_NOVA";
  export const OASIS = "OASIS";
  export const REI = "REI";
  export const REICHAIN = "REICHAIN";
  export const GODWOKEN = "GODWOKEN";
  export const POLIS = "POLIS";
  export const KEKCHAIN = "KEKCHAIN";
  export const VISION = "VISION";
  export const HARMONY = "HARMONY";
  export const PALM = "PALM";
  export const CURIO = "CURIO";

  export const UNKNOWN_NETWORK = "UNKNOWN_NETWORK";
}
export type Network = string;

export namespace ProtocolType {
  export const EXCHANGE = "EXCHANGE";
  export const LENDING = "LENDING";
  export const YIELD = "YIELD";
  export const BRIDGE = "BRIDGE";
  export const GENERIC = "GENERIC";
}

export namespace VaultFeeType {
  export const MANAGEMENT_FEE = "MANAGEMENT_FEE";
  export const PERFORMANCE_FEE = "PERFORMANCE_FEE";
  export const DEPOSIT_FEE = "DEPOSIT_FEE";
  export const WITHDRAWAL_FEE = "WITHDRAWAL_FEE";
}

export namespace LiquidityPoolFeeType {
  export const FIXED_TRADING_FEE = "FIXED_TRADING_FEE";
  export const TIERED_TRADING_FEE = "TIERED_TRADING_FEE";
  export const DYNAMIC_TRADING_FEE = "DYNAMIC_TRADING_FEE";
  export const FIXED_LP_FEE = "FIXED_LP_FEE";
  export const DYNAMIC_LP_FEE = "DYNAMIC_LP_FEE";
  export const FIXED_PROTOCOL_FEE = "FIXED_PROTOCOL_FEE";
  export const DYNAMIC_PROTOCOL_FEE = "DYNAMIC_PROTOCOL_FEE";
}

export namespace RewardTokenType {
  export const DEPOSIT = "DEPOSIT";
  export const BORROW = "BORROW";
}
export type RewardTokenType = string;

export namespace LendingType {
  export const CDP = "CDP";
  export const POOLED = "POOLED";
}

export namespace RiskType {
  export const GLOBAL = "GLOBAL";
  export const ISOLATED = "ISOLATED";
}

export namespace InterestRateType {
  export const STABLE = "STABLE";
  export const VARIABLE = "VARIABLE";
  export const FIXED_TERM = "FIXED_TERM";
}

export namespace InterestRateSide {
  export const LENDER = "LENDER";
  export const BORROWER = "BORROWER";
}

export namespace UsageType {
  export const DEPOSIT = "DEPOSIT";
  export const WITHDRAW = "WITHDRAW";
  export const SWAP = "SWAP";
}

//////////////////////////////
///// Ethereum Addresses /////
//////////////////////////////

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const ETH_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

////////////////////////
///// Type Helpers /////
////////////////////////

export const DEFAULT_DECIMALS = 18;

export const USDC_DECIMALS = 6;
export const USDC_DENOMINATOR = BigDecimal.fromString("1000000");

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TWO = BigInt.fromI32(2);
export const BIGINT_HUNDRED = BigInt.fromI32(100);
export const BIGINT_THOUSAND = BigInt.fromI32(1000);
export const BIGINT_TEN_TO_EIGHTEENTH = BigInt.fromString("10").pow(18);
export const BIGINT_MINUS_ONE = BigInt.fromI32(-1);
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
export const BIGDECIMAL_MINUS_ONE = new BigDecimal(BIGINT_MINUS_ONE);

export const MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));

/////////////////////
///// Date/Time /////
/////////////////////

export const SECONDS_PER_DAY = 60 * 60 * 24; // 86400
export const SECONDS_PER_HOUR = 60 * 60; // 3600
export const SECONDS_PER_DAY_BI = BigInt.fromI32(SECONDS_PER_DAY);
export const SECONDS_PER_HOUR_BI = BigInt.fromI32(SECONDS_PER_HOUR);
export const MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export const DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const MS_PER_YEAR = DAYS_PER_YEAR.times(
  new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000))
);

////////////////
///// Misc /////
////////////////

export const ETH_SYMBOL = "ETH";
export const ETH_NAME = "Ether";

export function equalsIgnoreCase(a: string, b: string): boolean {
  return a.replace("-", "_").toLowerCase() == b.replace("-", "_").toLowerCase();
}

///////////////////////////////////////
///// Protocol specific Constants /////
///////////////////////////////////////

export namespace PoolName {
  export const OriginalTokenVault = "OriginalTokenVault";
  export const PeggedTokenBridge = "PeggedTokenBridge";
}

export type PoolName = string;
export class NetworkSpecificConstant {
  constructor(
    public readonly chainName: string,
    public readonly originalTokenVault: Address,
    public readonly peggedTokenBridge: TypedMap<string, Address>
  ) {}

  getOriginalTokenVaultAddress(): Address {
    return this.originalTokenVault;
  }

  getpeggedTokenBridgeForChain(Chain: string): Address | null {
    return this.peggedTokenBridge.get(Chain);
  }
}

// https://bridge-docs.orbitchain.io/faq/integration-guide/2.-contract-addresses
export function getNetworkSpecificConstant(
  network: Network
): NetworkSpecificConstant {
  if (equalsIgnoreCase(network, Network.MAINNET)) {
    const toChainMapping = new TypedMap<string, Address>();
    toChainMapping.set(
      "KLAYTN",
      Address.fromString("0x60070f5d2e1c1001400a04f152e7abd43410f7b9")
    );
    toChainMapping.set(
      "AVAX",
      Address.fromString("0x6bd8e3beec87176ba9c705c9507aa5e6f0e6706f")
    );
    toChainMapping.set(
      "BSC",
      Address.fromString("0x6bd8e3beec87176ba9c705c9507aa5e6f0e6706f")
    );
    toChainMapping.set(
      "CELO",
      Address.fromString("0x6bd8e3beec87176ba9c705c9507aa5e6f0e6706f")
    );
    toChainMapping.set(
      "FANTOM",
      Address.fromString("0x6bd8e3beec87176ba9c705c9507aa5e6f0e6706f")
    );
    toChainMapping.set(
      "HARMONY",
      Address.fromString("0x6bd8e3beec87176ba9c705c9507aa5e6f0e6706f")
    );
    toChainMapping.set(
      "HECO",
      Address.fromString("0x6bd8e3beec87176ba9c705c9507aa5e6f0e6706f")
    );
    toChainMapping.set(
      "MATIC",
      Address.fromString("0x6bd8e3beec87176ba9c705c9507aa5e6f0e6706f")
    );
    toChainMapping.set(
      "MOONRIVER",
      Address.fromString("0x6bd8e3beec87176ba9c705c9507aa5e6f0e6706f")
    );
    toChainMapping.set(
      "XDAI",
      Address.fromString("0x6bd8e3beec87176ba9c705c9507aa5e6f0e6706f")
    );
    toChainMapping.set(
      "TON",
      Address.fromString("0x6bd8e3beec87176ba9c705c9507aa5e6f0e6706f")
    );
    toChainMapping.set(
      "WEMIX",
      Address.fromString("0x6bd8e3beec87176ba9c705c9507aa5e6f0e6706f")
    );
    toChainMapping.set(
      "ICON",
      Address.fromString("0x6bd8e3beec87176ba9c705c9507aa5e6f0e6706f")
    );
    toChainMapping.set(
      "ORBIT",
      Address.fromString("0x1b57ce997ca6a009ce54bb2d37debebadfdbbb06")
    );
    return new NetworkSpecificConstant(
      network,
      Address.fromString("0x1bf68a9d1eaee7826b3593c20a0ca93293cb489a"),
      toChainMapping
    );
  } else if (equalsIgnoreCase(network, Network.BSC)) {
    const toChainMapping = new TypedMap<string, Address>();
    toChainMapping.set(
      "KLAYTN",
      Address.fromString("0xb0a83941058b109bd0543fa26d22efb8a2d0f431")
    );
    toChainMapping.set(
      "HECO",
      Address.fromString("0xf2c5a817cc8ffaab4122f2ce27ab8486dfeab09f")
    );
    toChainMapping.set(
      "MATIC",
      Address.fromString("0x89c527764f03bcb7dc469707b23b79c1d7beb780")
    );
    toChainMapping.set(
      "ORBIT",
      Address.fromString("0xd4ec00c84f01361f36d907e061ea652ee50572af")
    );
    return new NetworkSpecificConstant(
      network,
      Address.fromString("0x89c527764f03bcb7dc469707b23b79c1d7beb780"),
      toChainMapping
    );
  } else if (equalsIgnoreCase(network, Network.CELO)) {
    const toChainMapping = new TypedMap<string, Address>();
    toChainMapping.set(
      "KLAYTN",
      Address.fromString("0x979cd0826c2bf62703ef62221a4fea1f23da3777")
    );
    toChainMapping.set(
      "ORBIT",
      Address.fromString("0x979cd0826c2bf62703ef62221a4fea1f23da3777")
    );
    return new NetworkSpecificConstant(
      network,
      Address.fromString("0x979cd0826c2bf62703ef62221a4fea1f23da3777"),
      toChainMapping
    );
  } else if (equalsIgnoreCase(network, Network.HECO)) {
    const toChainMapping = new TypedMap<string, Address>();
    toChainMapping.set(
      "KLAYTN",
      Address.fromString("0x38c92a7c2b358e2f2b91723e5c4fc7aa8b4d279f")
    );
    toChainMapping.set(
      "AVAX",
      Address.fromString("0x38c92a7c2b358e2f2b91723e5c4fc7aa8b4d279f")
    );
    toChainMapping.set(
      "BSC",
      Address.fromString("0x38c92a7c2b358e2f2b91723e5c4fc7aa8b4d279f")
    );
    toChainMapping.set(
      "CELO",
      Address.fromString("0x38c92a7c2b358e2f2b91723e5c4fc7aa8b4d279f")
    );
    toChainMapping.set(
      "FANTOM",
      Address.fromString("0x38c92a7c2b358e2f2b91723e5c4fc7aa8b4d279f")
    );
    toChainMapping.set(
      "HARMONY",
      Address.fromString("0x7112999b437404b430acf80667e94d8e62b9e44e")
    );
    toChainMapping.set(
      "MATIC",
      Address.fromString("0x38c92a7c2b358e2f2b91723e5c4fc7aa8b4d279f")
    );
    toChainMapping.set(
      "MOONRIVER",
      Address.fromString("0x38c92a7c2b358e2f2b91723e5c4fc7aa8b4d279f")
    );
    toChainMapping.set(
      "OEC",
      Address.fromString("0x38c92a7c2b358e2f2b91723e5c4fc7aa8b4d279f")
    );
    toChainMapping.set(
      "XDAI",
      Address.fromString("0x38c92a7c2b358e2f2b91723e5c4fc7aa8b4d279f")
    );
    toChainMapping.set(
      "ORBIT",
      Address.fromString("0x38c92a7c2b358e2f2b91723e5c4fc7aa8b4d279f")
    );
    return new NetworkSpecificConstant(
      network,
      Address.fromString("0x38c92a7c2b358e2f2b91723e5c4fc7aa8b4d279f"),
      toChainMapping
    );
  } else if (equalsIgnoreCase(network, Network.KLAYTN)) {
    const toChainMapping = new TypedMap<string, Address>();
    toChainMapping.set(
      "AVAX",
      Address.fromString("0x9abc3f6c11dbd83234d6e6b2c373dfc1893f648d")
    );
    toChainMapping.set(
      "BSC",
      Address.fromString("0x9abc3f6c11dbd83234d6e6b2c373dfc1893f648d")
    );
    toChainMapping.set(
      "CELO",
      Address.fromString("0x9abc3f6c11dbd83234d6e6b2c373dfc1893f648d")
    );
    toChainMapping.set(
      "ETH",
      Address.fromString("0x012c6d79b189e1abd1efac759b275c5d49abd164")
    );
    toChainMapping.set(
      "FANTOM",
      Address.fromString("0x9abc3f6c11dbd83234d6e6b2c373dfc1893f648d")
    );
    toChainMapping.set(
      "HARMONY",
      Address.fromString("0x9abc3f6c11dbd83234d6e6b2c373dfc1893f648d")
    );
    toChainMapping.set(
      "HECO",
      Address.fromString("0x9abc3f6c11dbd83234d6e6b2c373dfc1893f648d")
    );
    toChainMapping.set(
      "MATIC",
      Address.fromString("0x9abc3f6c11dbd83234d6e6b2c373dfc1893f648d")
    );
    toChainMapping.set(
      "MOONRIVER",
      Address.fromString("0x9abc3f6c11dbd83234d6e6b2c373dfc1893f648d")
    );
    toChainMapping.set(
      "OEC",
      Address.fromString("0x9abc3f6c11dbd83234d6e6b2c373dfc1893f648d")
    );
    toChainMapping.set(
      "XDAI",
      Address.fromString("0x9abc3f6c11dbd83234d6e6b2c373dfc1893f648d")
    );
    toChainMapping.set(
      "ORBIT",
      Address.fromString("0x9abc3f6c11dbd83234d6e6b2c373dfc1893f648d")
    );
    return new NetworkSpecificConstant(
      network,
      Address.fromString("0x9abc3f6c11dbd83234d6e6b2c373dfc1893f648d"),
      toChainMapping
    );
  } else if (equalsIgnoreCase(network, Network.MATIC)) {
    const toChainMapping = new TypedMap<string, Address>();
    toChainMapping.set(
      "AVAX",
      Address.fromString("0x506dc4c6408813948470a06ef6e4a1daf228dbd5")
    );
    toChainMapping.set(
      "BSC",
      Address.fromString("0x506dc4c6408813948470a06ef6e4a1daf228dbd5")
    );
    toChainMapping.set(
      "CELO",
      Address.fromString("0x506dc4c6408813948470a06ef6e4a1daf228dbd5")
    );
    toChainMapping.set(
      "ETH",
      Address.fromString("0x506dc4c6408813948470a06ef6e4a1daf228dbd5")
    );
    toChainMapping.set(
      "FANTOM",
      Address.fromString("0x506dc4c6408813948470a06ef6e4a1daf228dbd5")
    );
    toChainMapping.set(
      "HARMONY",
      Address.fromString("0x506dc4c6408813948470a06ef6e4a1daf228dbd5")
    );
    toChainMapping.set(
      "HECO",
      Address.fromString("0x506dc4c6408813948470a06ef6e4a1daf228dbd5")
    );
    toChainMapping.set(
      "KLAYTN",
      Address.fromString("0x506dc4c6408813948470a06ef6e4a1daf228dbd5")
    );
    toChainMapping.set(
      "MOONRIVER",
      Address.fromString("0x506dc4c6408813948470a06ef6e4a1daf228dbd5")
    );
    toChainMapping.set(
      "OEC",
      Address.fromString("0x506dc4c6408813948470a06ef6e4a1daf228dbd5")
    );
    toChainMapping.set(
      "XDAI",
      Address.fromString("0x506dc4c6408813948470a06ef6e4a1daf228dbd5")
    );
    toChainMapping.set(
      "ORBIT",
      Address.fromString("0x506dc4c6408813948470a06ef6e4a1daf228dbd5")
    );
    return new NetworkSpecificConstant(
      network,
      Address.fromString("0x506dc4c6408813948470a06ef6e4a1daf228dbd5"),
      toChainMapping
    );
  }
  log.debug("[getNetworkSpecificConstant] Unsupported network: {}", [network]);
  return new NetworkSpecificConstant(
    "UNKNOWN",
    Address.zero(),
    new TypedMap<string, Address>()
  );
}
