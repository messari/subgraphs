import {
  BigDecimal,
  BigInt,
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

export namespace TokenType {
  export const INTERNAL_BURNABLE = "INTERNAL_BURNABLE";
  export const INTERNAL_BURNABLEFROM = "INTERNAL_BURNABLEFROM";
  export const EXTERNAL = "EXTERNAL";
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
export class NetworkSpecificConstant {
  constructor(
    public readonly chainId: BigInt,
    //public readonly gasFeeToken: Token,
    // assume protocolId is the address of pool-based bridge
    //public readonly protocolId: Bytes,
    public readonly poolAddress: Address
  ) {}

  /*
  getProtocolId(): Bytes {
    return this.protocolId;
  }
  */

  getPoolAddress(): Address {
    return this.poolAddress;
  }
}

// https://cbridge-docs.celer.network/reference/contract-addresses
export function getNetworkSpecificConstant(
  chainId: BigInt | null = null
): NetworkSpecificConstant {
  let network = dataSource.network();
  if (!chainId) {
    chainId = networkToChainID(network);
  } else {
    network = chainIDToNetwork(chainId);
  }

  if (equalsIgnoreCase(network, Network.MAINNET)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0x5427fefa711eff984124bfbb1ab6fbf5e3da1820")
    );
  } else if (equalsIgnoreCase(network, Network.ARB_NOVA)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0xb3833ecd19d4ff964fa7bc3f8ac070ad5e360e56")
    );
  } else if (equalsIgnoreCase(network, Network.ARBITRUM_ONE)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0xbdd2739ae69a054895be33a22b2d2ed71a1de778")
    );
  } else if (equalsIgnoreCase(network, Network.ASTAR)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0x3b53d2c7b44d40be05fa5e2309ffeb6eb2492d88")
    );
  } else if (equalsIgnoreCase(network, Network.AURORA)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0xbdd2739ae69a054895be33a22b2d2ed71a1de778")
    );
  } else if (equalsIgnoreCase(network, Network.AVALANCHE)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0xb774c6f82d1d5dbd36894762330809e512fed195")
    );
  } else if (equalsIgnoreCase(network, Network.BSC)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0x26c76f7fef00e02a5dd4b5cc8a0f717eb61e1e4b")
    );
  } else if (equalsIgnoreCase(network, Network.BOBA)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0xc5ef662b833de914b9ba7a3532c6bb008a9b23a6")
    );
  } else if (equalsIgnoreCase(network, Network.CELO)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0xda1dd66924b0470501ac7736372d4171cdd1162e")
    );
  } else if (equalsIgnoreCase(network, Network.EVMOS)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0xc1d6e421a062fdbb26c31db4a2113df0f678cd04")
    );
  } else if (equalsIgnoreCase(network, Network.FANTOM)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0x30f7aa65d04d289ce319e88193a33a8eb1857fb9")
    );
  } else if (equalsIgnoreCase(network, Network.XDAI)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0xd4c058380d268d85bc7c758072f561e8f2db5975")
    );
  } else if (equalsIgnoreCase(network, Network.HARMONY)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0xdd90e5e87a2081dcf0391920868ebc2ffb81a1af")
    );
  } else if (equalsIgnoreCase(network, Network.HECO)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0x81ecac0d6be0550a00ff064a4f9dd2400585fe9c")
    );
  } else if (equalsIgnoreCase(network, Network.KAVA)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0xf8bf9988206c4de87f52a3c24486e4367b7088cb")
    );
  } else if (equalsIgnoreCase(network, Network.KLAYTN)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0xb3833ecd19d4ff964fa7bc3f8ac070ad5e360e56")
    );
  } else if (equalsIgnoreCase(network, Network.MATIC)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0xb3833ecd19d4ff964fa7bc3f8ac070ad5e360e56")
    );
  } else if (equalsIgnoreCase(network, Network.MOONBEAM)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0xbb7684cc5408f4dd0921e5c2cadd547b8f1ad573")
    );
  } else if (equalsIgnoreCase(network, Network.MOONRIVER)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0x374b8a9f3ec5eb2d97eca84ea27aca45aa1c57ef")
    );
  } else if (equalsIgnoreCase(network, Network.GODWOKEN)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0xb3833ecd19d4ff964fa7bc3f8ac070ad5e360e56")
    );
  } else if (equalsIgnoreCase(network, Network.OKEXCHAIN)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0x48284eb583a1f3058f4bce0a685d44fe29d4539e")
    );
  } else if (equalsIgnoreCase(network, Network.OASIS)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0xbb7684cc5408f4dd0921e5c2cadd547b8f1ad573")
    );
  } else if (equalsIgnoreCase(network, Network.OPTIMISM)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0x61f85ff2a2f4289be4bb9b72fc7010b3142b5f41")
    );
  } else if (equalsIgnoreCase(network, Network.METIS)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0xb51541df05de07be38dcfc4a80c05389a54502bb")
    );
  } else if (equalsIgnoreCase(network, Network.REI)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0x9b36f165bab9ebe611d491180418d8de4b8f3a1f")
    );
  } else if (equalsIgnoreCase(network, Network.SX)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0x9bb46d5100d2db4608112026951c9c965b233f4d")
    );
  } else if (equalsIgnoreCase(network, Network.SHIDEN)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0xbb7684cc5408f4dd0921e5c2cadd547b8f1ad573")
    );
  } else if (equalsIgnoreCase(network, Network.SYSCOIN)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0x841ce48f9446c8e281d3f1444cb859b4a6d0738c")
    );
  }

  log.error("[getNetworkSpecificConstant] Unsupported network: {}", [network]);
  return new NetworkSpecificConstant(BIGINT_ZERO, Address.zero());
}
