import {
  BigDecimal,
  BigInt,
  TypedMap,
  log,
  dataSource,
  Address,
  Bytes,
} from "@graphprotocol/graph-ts";
import { Token } from "../../../generated/schema";
import {
  chainIDToNetwork,
  networkToChainID,
} from "../protocols/bridge/chainIds";

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
  constructor (
    public readonly chainName: string,
    public readonly originalTokenVault: Address,
    public readonly peggedTokenBridge: TypedMap<string, Address>,
  ){}

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
    const toChainMapping = new TypedMap<string, Address>()
    toChainMapping.set(
      "KLAYTN",
      Address.fromString("0x60070F5D2e1C1001400A04F152E7ABD43410F7B9")
    );
    toChainMapping.set(
      "AVAX",
      Address.fromString("0x6BD8E3beEC87176BA9c705c9507Aa5e6F0E6706f")
    );
    toChainMapping.set(
      "BSC",
      Address.fromString("0x6BD8E3beEC87176BA9c705c9507Aa5e6F0E6706f")
    );
    toChainMapping.set(
      "CELO",
      Address.fromString("0x6BD8E3beEC87176BA9c705c9507Aa5e6F0E6706f")
    );
    toChainMapping.set(
      "FANTOM",
      Address.fromString("0x6BD8E3beEC87176BA9c705c9507Aa5e6F0E6706f")
    );
    toChainMapping.set(
      "HARMONY",
      Address.fromString("0x6BD8E3beEC87176BA9c705c9507Aa5e6F0E6706f")
    );
    toChainMapping.set(
      "HECO",
      Address.fromString("0x6BD8E3beEC87176BA9c705c9507Aa5e6F0E6706f")
    );
    toChainMapping.set(
      "MATIC",
      Address.fromString("0x6BD8E3beEC87176BA9c705c9507Aa5e6F0E6706f")
    );
    toChainMapping.set(
      "MOONRIVER",
      Address.fromString("0x6BD8E3beEC87176BA9c705c9507Aa5e6F0E6706f")
    );
    toChainMapping.set(
      "XDAI",
      Address.fromString("0x6BD8E3beEC87176BA9c705c9507Aa5e6F0E6706f")
    );
    toChainMapping.set(
      "ORBIT",
      Address.fromString("0x1b57Ce997Ca6a009ce54bB2d37DEbEBadFDbBb06")
    );
    return new NetworkSpecificConstant(
      network,
      Address.fromString("0x1bf68a9d1eaee7826b3593c20a0ca93293cb489a"),
      toChainMapping
    );
  }
  else if (equalsIgnoreCase(network, Network.BSC)) {
    const toChainMapping = new TypedMap<string, Address>()
    toChainMapping.set(
      "KLAYTN",
      Address.fromString("0xB0a83941058b109Bd0543fa26d22eFb8a2D0f431")
    );
    toChainMapping.set(
      "HECO",
      Address.fromString("0xf2C5a817cc8FFaAB4122f2cE27AB8486DFeAb09F")
    );
    toChainMapping.set(
      "MATIC",
      Address.fromString("0x89c527764f03BCb7dC469707B23b79C1D7Beb780")
    );
    toChainMapping.set(
      "ORBIT",
      Address.fromString("0xd4EC00c84f01361F36D907E061EA652eE50572AF")
    );
    return new NetworkSpecificConstant(
      network,
      Address.fromString("0x89c527764f03BCb7dC469707B23b79C1D7Beb780"),
      toChainMapping
    )
  }
  else if (equalsIgnoreCase(network, Network.CELO)) {
    const toChainMapping = new TypedMap<string, Address>()
    toChainMapping.set(
      "KLAYTN",
      Address.fromString("0x979cD0826C2bf62703Ef62221a4feA1f23da3777")
    );
    toChainMapping.set(
      "ORBIT",
      Address.fromString("0x979cD0826C2bf62703Ef62221a4feA1f23da3777")
    );
    return new NetworkSpecificConstant(
      network,
      Address.fromString("0x979cD0826C2bf62703Ef62221a4feA1f23da3777"),
      toChainMapping
    )
  }
  else if (equalsIgnoreCase(network, Network.HECO)) {
    const toChainMapping = new TypedMap<string, Address>()
    toChainMapping.set(
      "KLAYTN",
      Address.fromString("0x38C92A7C2B358e2F2b91723e5c4Fc7aa8b4d279F")
    );
    toChainMapping.set(
      "AVAX",
      Address.fromString("0x38C92A7C2B358e2F2b91723e5c4Fc7aa8b4d279F")
    );
    toChainMapping.set(
      "BSC",
      Address.fromString("0x38C92A7C2B358e2F2b91723e5c4Fc7aa8b4d279F")
    );
    toChainMapping.set(
      "CELO",
      Address.fromString("0x38C92A7C2B358e2F2b91723e5c4Fc7aa8b4d279F")
    );
    toChainMapping.set(
      "FANTOM",
      Address.fromString("0x38C92A7C2B358e2F2b91723e5c4Fc7aa8b4d279F")
    );
    toChainMapping.set(
      "HARMONY",
      Address.fromString("0x7112999b437404B430acf80667E94D8E62b9e44E")
    );
    toChainMapping.set(
      "MATIC",
      Address.fromString("0x38C92A7C2B358e2F2b91723e5c4Fc7aa8b4d279F")
    );
    toChainMapping.set(
      "MOONRIVER",
      Address.fromString("0x38C92A7C2B358e2F2b91723e5c4Fc7aa8b4d279F")
    );
    toChainMapping.set(
      "OEC",
      Address.fromString("0x38C92A7C2B358e2F2b91723e5c4Fc7aa8b4d279F")
    );
    toChainMapping.set(
      "XDAI",
      Address.fromString("0x38C92A7C2B358e2F2b91723e5c4Fc7aa8b4d279F")
    );
    toChainMapping.set(
      "ORBIT",
      Address.fromString("0x38C92A7C2B358e2F2b91723e5c4Fc7aa8b4d279F")
    );
    return new NetworkSpecificConstant(
      network,
      Address.fromString("0x38C92A7C2B358e2F2b91723e5c4Fc7aa8b4d279F"),
      toChainMapping
    );
  }
  else if (equalsIgnoreCase(network, Network.KLAYTN)) {
    const toChainMapping = new TypedMap<string, Address>()
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
      Address.fromString("0x012c6d79b189e1aBD1EFaC759b275c5D49Abd164")
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
  }
  else if (equalsIgnoreCase(network, Network.MATIC)) {
    const toChainMapping = new TypedMap<string, Address>()
    toChainMapping.set(
      "AVAX",
      Address.fromString("0x506DC4c6408813948470a06ef6e4a1DaF228dbd5")
    );
    toChainMapping.set(
      "BSC",
      Address.fromString("0x506DC4c6408813948470a06ef6e4a1DaF228dbd5")
    );
    toChainMapping.set(
      "CELO",
      Address.fromString("0x506DC4c6408813948470a06ef6e4a1DaF228dbd5")
    );
    toChainMapping.set(
      "ETH",
      Address.fromString("0x506DC4c6408813948470a06ef6e4a1DaF228dbd5")
    );
    toChainMapping.set(
      "FANTOM",
      Address.fromString("0x506DC4c6408813948470a06ef6e4a1DaF228dbd5")
    );
    toChainMapping.set(
      "HARMONY",
      Address.fromString("0x506DC4c6408813948470a06ef6e4a1DaF228dbd5")
    );
    toChainMapping.set(
      "HECO",
      Address.fromString("0x506DC4c6408813948470a06ef6e4a1DaF228dbd5")
    );
    toChainMapping.set(
      "KLAYTN",
      Address.fromString("0x506DC4c6408813948470a06ef6e4a1DaF228dbd5")
    );
    toChainMapping.set(
      "MOONRIVER",
      Address.fromString("0x506DC4c6408813948470a06ef6e4a1DaF228dbd5")
    );
    toChainMapping.set(
      "OEC",
      Address.fromString("0x506DC4c6408813948470a06ef6e4a1DaF228dbd5")
    );
    toChainMapping.set(
      "XDAI",
      Address.fromString("0x506DC4c6408813948470a06ef6e4a1DaF228dbd5")
    );
    toChainMapping.set(
      "ORBIT",
      Address.fromString("0x506DC4c6408813948470a06ef6e4a1DaF228dbd5")
    );
    return new NetworkSpecificConstant(
      network,
      Address.fromString("0x506DC4c6408813948470a06ef6e4a1DaF228dbd5"),
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