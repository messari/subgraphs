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
  export const PoolBasedBridge = "PoolBasedBridge";
  export const OriginalTokenVault = "OriginalTokenVault";
  export const OriginalTokenVaultV2 = "OriginalTokenVaultV2";
  export const PeggedTokenBridge = "PeggedTokenBridge";
  export const PeggedTokenBridgeV2 = "PeggedTokenBridgeV2";
}

export type PoolName = string;
export class NetworkSpecificConstant {
  constructor(
    public readonly chainId: BigInt,
    public readonly gasFeeToken: Token,
    // assume protocolId is the address of pool-based bridge
    //public readonly protocolId: Bytes,
    public readonly poolBasedBridge: Address,
    public readonly originalTokenVault: Address,
    public readonly originalTokenVaultV2: Address,
    public readonly peggedTokenBridge: Address,
    public readonly peggedTokenBridgeV2: Address
  ) {}

  getProtocolId(): Bytes {
    return this.poolBasedBridge;
  }

  getPoolAddress(poolName: PoolName): Address {
    if (poolName == PoolName.OriginalTokenVault) return this.originalTokenVault;

    if (poolName == PoolName.OriginalTokenVaultV2)
      return this.originalTokenVaultV2;
    if (poolName == PoolName.PeggedTokenBridge) return this.peggedTokenBridge;
    if (poolName == PoolName.PeggedTokenBridgeV2)
      return this.peggedTokenBridgeV2;
    if (poolName == PoolName.PoolBasedBridge) return this.poolBasedBridge;

    return this.poolBasedBridge;
  }
}

export function getOrCreateGasFeeToken(
  id: Bytes,
  name: string,
  symbol: string,
  decimals: i32
): Token {
  let token = Token.load(id);
  if (token) {
    return token;
  }

  token = new Token(id);
  token.name = name;
  token.symbol = symbol;
  token.decimals = decimals;
  token.save();
  return token;
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

  // default gas token
  const gasFeeToken = getOrCreateGasFeeToken(
    Address.zero(),
    `Gas fee token ${network}`,
    "Unknown",
    18 as i32
  );

  if (equalsIgnoreCase(network, Network.MAINNET)) {
    return new NetworkSpecificConstant(
      chainId,
      getOrCreateGasFeeToken(
        Address.fromString(ETH_ADDRESS),
        ETH_NAME,
        ETH_SYMBOL,
        18 as i32
      ),
      Address.fromString("0x5427fefa711eff984124bfbb1ab6fbf5e3da1820"),
      Address.fromString("0xb37d31b2a74029b5951a2778f959282e2d518595"),
      Address.fromString("0x7510792a3b1969f9307f3845ce88e39578f2bae1"),
      Address.fromString("0x16365b45eb269b5b5dacb34b4a15399ec79b95eb"),
      Address.fromString("0x52e4f244f380f8fa51816c8a10a63105dd4de084")
    );
  } else if (equalsIgnoreCase(network, Network.ARB_NOVA)) {
    return new NetworkSpecificConstant(
      chainId,
      gasFeeToken,
      Address.fromString("0xb3833ecd19d4ff964fa7bc3f8ac070ad5e360e56"),
      Address.zero(),
      Address.zero(),
      Address.zero(),
      Address.zero()
    );
  } else if (equalsIgnoreCase(network, Network.ARBITRUM_ONE)) {
    return new NetworkSpecificConstant(
      chainId,
      gasFeeToken,
      Address.fromString("0x1619de6b6b20ed217a58d00f37b9d47c7663feca"),
      Address.fromString("0xfe31bfc4f7c9b69246a6dc0087d91a91cb040f76"),
      Address.fromString("0xea4b1b0aa3c110c55f650d28159ce4ad43a4a58b"),
      Address.fromString("0xbdd2739ae69a054895be33a22b2d2ed71a1de778"),
      Address.zero()
    );
  } else if (equalsIgnoreCase(network, Network.ASTAR)) {
    return new NetworkSpecificConstant(
      chainId,
      gasFeeToken,
      Address.fromString("0x841ce48f9446c8e281d3f1444cb859b4a6d0738c"),
      Address.fromString("0xbcfef6bb4597e724d720735d32a9249e0640aa11"),
      Address.zero(),
      Address.fromString("0xbb7684cc5408f4dd0921e5c2cadd547b8f1ad573"),
      Address.fromString("0x3b53d2c7b44d40be05fa5e2309ffeb6eb2492d88")
    );
  } else if (equalsIgnoreCase(network, Network.AURORA)) {
    return new NetworkSpecificConstant(
      chainId,
      getOrCreateGasFeeToken(
        Address.fromString("0xaaaaaa20d9e0e2461697782ef11675f668207961"),
        "Aurora",
        "AURORA",
        18 as i32
      ),
      Address.fromString("0x841ce48f9446c8e281d3f1444cb859b4a6d0738c"),
      Address.zero(),
      Address.fromString("0xbcfef6bb4597e724d720735d32a9249e0640aa11"),
      Address.fromString("0x4384d5a9d7354c65ce3aee411337bd40493ad1bc"),
      Address.fromString("0xbdd2739ae69a054895be33a22b2d2ed71a1de778")
    );
  } else if (equalsIgnoreCase(network, Network.AVALANCHE)) {
    return new NetworkSpecificConstant(
      chainId,
      getOrCreateGasFeeToken(
        Address.fromString("0x85f138bfee4ef8e540890cfb48f620571d67eda3"),
        // Real address is non-EVM compatible
        //Address.fromString("FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z"),
        "Avalanche",
        "AVAX",
        9 as i32
      ),
      Address.fromString("0xef3c714c9425a8f3697a9c969dc1af30ba82e5d4"),
      Address.fromString("0x5427fefa711eff984124bfbb1ab6fbf5e3da1820"),
      Address.fromString("0xb51541df05de07be38dcfc4a80c05389a54502bb"),
      Address.fromString("0x88dcdc47d2f83a99cf0000fdf667a468bb958a78"),
      Address.fromString("0xb774c6f82d1d5dbd36894762330809e512fed195")
    );
  } else if (equalsIgnoreCase(network, Network.BSC)) {
    return new NetworkSpecificConstant(
      chainId,
      getOrCreateGasFeeToken(
        Address.fromString("0x242a1ff6ee06f2131b7924cacb74c7f9e3a5edc9"),
        "BNB Token",
        "BNB",
        18 as i32
      ),
      Address.fromString("0xdd90e5e87a2081dcf0391920868ebc2ffb81a1af"),
      Address.fromString("0x78bc5ee9f11d133a08b331c2e18fe81be0ed02dc"),
      Address.fromString("0x11a0c9270d88c99e221360bca50c2f6fda44a980"),
      Address.fromString("0xd443fe6bf23a4c9b78312391a30ff881a097580e"),
      Address.fromString("0x26c76f7fef00e02a5dd4b5cc8a0f717eb61e1e4b")
    );
  } else if (equalsIgnoreCase(network, Network.BOBA)) {
    return new NetworkSpecificConstant(
      chainId,
      getOrCreateGasFeeToken(
        Address.fromString("0x42bbfa2e77757c645eeaad1655e0911a7553efbc"),
        "Boba Token",
        "BOBA",
        18 as i32
      ),
      Address.fromString("0x841ce48f9446c8e281d3f1444cb859b4a6d0738c"),
      Address.fromString("0x8db213be5268a2b8b78af08468ff1ea422073da0"),
      Address.fromString("0x4c882ec256823ee773b25b414d36f92ef58a7c0c"),
      Address.fromString("0xc5ef662b833de914b9ba7a3532c6bb008a9b23a6"),
      Address.zero()
    );
  } else if (equalsIgnoreCase(network, Network.CELO)) {
    return new NetworkSpecificConstant(
      chainId,
      getOrCreateGasFeeToken(
        Address.fromString("0x471ece3750da237f93b8e339c536989b8978a438"),
        "Celo Token",
        "CELO",
        18 as i32
      ),
      Address.fromString("0xbb7684cc5408f4dd0921e5c2cadd547b8f1ad573"),
      Address.zero(),
      Address.zero(),
      Address.fromString("0xda1dd66924b0470501ac7736372d4171cdd1162e"),
      Address.zero()
    );
  } /* //Clover, Conflux, and Crab Smart Chain are not included in Network
  else if (equalsIgnoreCase(network, Network.CLOVER)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0x841ce48f9446c8e281d3f1444cb859b4a6d0738c"),
      Address.zero(),
      Address.zero(),
      Address.zero(),
      Address.fromString("0x3b53d2c7b44d40be05fa5e2309ffeb6eb2492d88")
    );
  } else if (equalsIgnoreCase(network, Network.CONFLUX)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0x841ce48f9446c8e281d3f1444cb859b4a6d0738c"),
      Address.zero(),
      Address.zero(),
      Address.zero(),
      Address.fromString("0x3b53d2c7b44d40be05fa5e2309ffeb6eb2492d88")
    );
  } else if (equalsIgnoreCase(network, Network.CRAB)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0x841ce48f9446c8e281d3f1444cb859b4a6d0738c"),
      Address.zero(),
      Address.zero(),
      Address.zero(),
      Address.fromString("0x3b53d2c7b44d40be05fa5e2309ffeb6eb2492d88")
    );
  } */ else if (equalsIgnoreCase(network, Network.EVMOS)) {
    return new NetworkSpecificConstant(
      chainId,
      getOrCreateGasFeeToken(
        Address.fromString("0xbf183e0d2f06872e10f5dbec745999adfcb5f000"),
        "EVMOS",
        "EVMOS",
        18 as i32
      ),
      Address.fromString("0x5f52b9d1c0853da636e178169e6b426e4ccfa813"),
      Address.zero(),
      Address.zero(),
      Address.zero(),
      Address.fromString("0xc1d6e421a062fdbb26c31db4a2113df0f678cd04")
    );
  } else if (equalsIgnoreCase(network, Network.FANTOM)) {
    return new NetworkSpecificConstant(
      chainId,
      getOrCreateGasFeeToken(
        Address.fromString("0x4e15361fd6b4bb609fa63c81a2be19d873717870"),
        "Fantom Token",
        "FTM",
        18 as i32
      ),
      Address.fromString("0x374b8a9f3ec5eb2d97eca84ea27aca45aa1c57ef"),
      Address.fromString("0x7d91603e79ea89149baf73c9038c51669d8f03e9"),
      Address.zero(),
      Address.fromString("0x38d1e20b0039bfbeef4096be00175227f8939e51"),
      Address.fromString("0x30f7aa65d04d289ce319e88193a33a8eb1857fb9")
    );
  } /* // non-EVM chain not supported
  else if (equalsIgnoreCase(network, Network.FLOW)) {
    return new NetworkSpecificConstant(
      chainId,
      "A.08dd120226ec2213.cBridge",
      "A.08dd120226ec2213.SafeBox",
      Address.zero(),
      Address.zero(),
      "A.08dd120226ec2213.PegBridge"
    );
  } */ else if (equalsIgnoreCase(network, Network.XDAI)) {
    return new NetworkSpecificConstant(
      chainId,
      getOrCreateGasFeeToken(Address.zero(), "xDAI", "xDAI", 18 as i32),
      Address.fromString("0x3795c36e7d12a8c252a20c5a7b455f7c57b60283"),
      Address.zero(),
      Address.zero(),
      Address.fromString("0xd4c058380d268d85bc7c758072f561e8f2db5975"),
      Address.zero()
    );
  } else if (equalsIgnoreCase(network, Network.HARMONY)) {
    return new NetworkSpecificConstant(
      chainId,
      getOrCreateGasFeeToken(
        Address.fromString("0x799a4202c12ca952cb311598a024c80ed371a41e"),
        "Harmony One",
        "ONE",
        18 as i32
      ),
      Address.fromString("0x78a21c1d3ed53a82d4247b9ee5bf001f4620ceec"),
      Address.zero(),
      Address.zero(),
      Address.fromString("0xdd90e5e87a2081dcf0391920868ebc2ffb81a1af"),
      Address.zero()
    );
  } else if (equalsIgnoreCase(network, Network.HECO)) {
    return new NetworkSpecificConstant(
      chainId,
      getOrCreateGasFeeToken(Address.zero(), "HECO Token", "HT", 18 as i32),
      Address.fromString("0xbb7684cc5408f4dd0921e5c2cadd547b8f1ad573"),
      Address.fromString("0x5d96d4287d1ff115ee50fac0526cf43ecf79bfc6"),
      Address.zero(),
      Address.fromString("0x81ecac0d6be0550a00ff064a4f9dd2400585fe9c"),
      Address.zero()
    );
  } else if (equalsIgnoreCase(network, Network.KAVA)) {
    return new NetworkSpecificConstant(
      chainId,
      getOrCreateGasFeeToken(
        Address.fromString("0xb66a437693992d9c94f0c315270f869c016432b9"),
        "Kava Token",
        "KAVA",
        18 as i32
      ),
      Address.fromString("0xb51541df05de07be38dcfc4a80c05389a54502bb"),
      Address.zero(),
      Address.zero(),
      Address.zero(),
      Address.fromString("0xf8bf9988206c4de87f52a3c24486e4367b7088cb")
    );
  } else if (equalsIgnoreCase(network, Network.KLAYTN)) {
    return new NetworkSpecificConstant(
      chainId,
      getOrCreateGasFeeToken(
        Address.fromString("0x393126c0653f49e079500cc0f218a27c793136a0"),
        "Klaytn Token",
        "KLAY",
        18 as i32
      ),
      Address.fromString("0x4c882ec256823ee773b25b414d36f92ef58a7c0c"),
      Address.zero(),
      Address.zero(),
      Address.zero(),
      Address.fromString("0xb3833ecd19d4ff964fa7bc3f8ac070ad5e360e56")
    );
  } else if (equalsIgnoreCase(network, Network.MATIC)) {
    return new NetworkSpecificConstant(
      chainId,
      getOrCreateGasFeeToken(
        Address.fromString("0x0000000000000000000000000000000000001010"),
        "Matic Token",
        "MATIC",
        18 as i32
      ),
      Address.fromString("0x841ce48f9446c8e281d3f1444cb859b4a6d0738c"),
      Address.zero(),
      Address.zero(),
      Address.fromString("0x3bbadff9aeee4a74d3cf6da05c30868c9ff85bb8"),
      Address.fromString("0xb3833ecd19d4ff964fa7bc3f8ac070ad5e360e56")
    );
  } /* // Milkomeda Cardano is not included in Network
  else if (equalsIgnoreCase(network, Network.MILKOMEDA)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0x841ce48f9446c8e281d3f1444cb859b4a6d0738c"),
      Address.zero(),
      Address.fromString("0xb51541df05de07be38dcfc4a80c05389a54502bb"),
      Address.fromString("0x3b53d2c7b44d40be05fa5e2309ffeb6eb2492d88"),
      Address.fromString("0x3b53d2c7b44d40be05fa5e2309ffeb6eb2492d88")
    );
  } */ else if (equalsIgnoreCase(network, Network.MOONBEAM)) {
    return new NetworkSpecificConstant(
      chainId,
      getOrCreateGasFeeToken(
        Address.fromString("0x017be64db48dfc962221c984b9a6937a5d09e81a"),
        "Moonbeam Token",
        "GLMR",
        9 as i32
      ),
      Address.fromString("0x841ce48f9446c8e281d3f1444cb859b4a6d0738c"),
      Address.zero(),
      Address.zero(),
      Address.fromString("0xbb7684cc5408f4dd0921e5c2cadd547b8f1ad573"),
      Address.fromString("0x3b53d2c7b44d40be05fa5e2309ffeb6eb2492d88")
    );
  } else if (equalsIgnoreCase(network, Network.MOONRIVER)) {
    return new NetworkSpecificConstant(
      chainId,
      getOrCreateGasFeeToken(
        Address.fromString("0xaa4483bd555f6cddfe34c2ee6a5a798e5c75775a"),
        "Moonriver Token",
        "MOVR",
        18 as i32
      ),
      Address.fromString("0x841ce48f9446c8e281d3f1444cb859b4a6d0738c"),
      Address.zero(),
      Address.zero(),
      Address.fromString("0x374b8a9f3ec5eb2d97eca84ea27aca45aa1c57ef"),
      Address.zero()
    );
  } else if (equalsIgnoreCase(network, Network.GODWOKEN)) {
    return new NetworkSpecificConstant(
      chainId,
      gasFeeToken,
      Address.fromString("0x4c882ec256823ee773b25b414d36f92ef58a7c0c"),
      Address.zero(),
      Address.zero(),
      Address.fromString("0xb3833ecd19d4ff964fa7bc3f8ac070ad5e360e56"),
      Address.fromString("0xb3833ecd19d4ff964fa7bc3f8ac070ad5e360e56")
    );
  } else if (equalsIgnoreCase(network, Network.OKEXCHAIN)) {
    return new NetworkSpecificConstant(
      chainId,
      getOrCreateGasFeeToken(
        Address.fromString("0xe302bf71b1f6f3024e7642f9c824ac86b58436a0"),
        "OKEx Token",
        "OKB",
        18 as i32
      ),
      Address.fromString("0x6a2d262d56735dba19dd70682b39f6be9a931d98"),
      Address.zero(),
      Address.zero(),
      Address.fromString("0x48284eb583a1f3058f4bce0a685d44fe29d4539e"),
      Address.zero()
    );
  } else if (equalsIgnoreCase(network, Network.OASIS)) {
    return new NetworkSpecificConstant(
      chainId,
      getOrCreateGasFeeToken(
        Address.fromString("0x30589d7c60490c72c2452a04f4d1a95653ba056f"),
        "Oasis Token",
        "OAC",
        18 as i32
      ),
      Address.fromString("0x841ce48f9446c8e281d3f1444cb859b4a6d0738c"),
      Address.zero(),
      Address.zero(),
      Address.fromString("0xbb7684cc5408f4dd0921e5c2cadd547b8f1ad573"),
      Address.fromString("0x3b53d2c7b44d40be05fa5e2309ffeb6eb2492d88")
    );
  } /* // ONTOLOGY is not included in Network
  else if (equalsIgnoreCase(network, Network.ONTOLOGY)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0x841ce48f9446c8e281d3f1444cb859b4a6d0738c"),
      Address.zero(),
      Address.zero(),
      Address.fromString("0xd4c058380d268d85bc7c758072f561e8f2db5975"),
      Address.fromString("0xd4c058380d268d85bc7c758072f561e8f2db5975")
    );
  } */ else if (equalsIgnoreCase(network, Network.OPTIMISM)) {
    return new NetworkSpecificConstant(
      chainId,
      getOrCreateGasFeeToken(
        Address.fromString("0xb2ea9527bf05bc3b73320a1ec18bd4f2fe88d952"),
        "Optimism Token",
        "OP",
        18 as i32
      ),
      Address.fromString("0x9d39fc627a6d9d9f8c831c16995b209548cc3401"),
      Address.fromString("0xbcfef6bb4597e724d720735d32a9249e0640aa11"),
      Address.zero(),
      Address.fromString("0x61f85ff2a2f4289be4bb9b72fc7010b3142b5f41"),
      Address.zero()
    );
  } /* // PlatON is not included in Network
  else if (equalsIgnoreCase(network, Network.PLATON)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0xbf2b2757f0b2a2f70136c4a6627e99d8ec5cc7b9"),
      Address.zero(),
      Address.zero(),
      Address.fromString("0xd340bc3ec35e63bcf929c5a9ad3ae5b1ebdbe678"),
      Address.fromString("0xd340bc3ec35e63bcf929c5a9ad3ae5b1ebdbe678")
    );
  } */ else if (equalsIgnoreCase(network, Network.METIS)) {
    return new NetworkSpecificConstant(
      chainId,
      getOrCreateGasFeeToken(
        Address.fromString("0x9e32b13ce7f2e80a01932b42553652e053d6ed8e"),
        "Metis Token",
        "METIS",
        18 as i32
      ),
      Address.fromString("0x88dcdc47d2f83a99cf0000fdf667a468bb958a78"),
      Address.fromString("0xc1a2d967dfaa6a10f3461bc21864c23c1dd51eea"),
      Address.fromString("0x4c882ec256823ee773b25b414d36f92ef58a7c0c"),
      Address.fromString("0x4d58fdc7d0ee9b674f49a0ade11f26c3c9426f7a"),
      Address.fromString("0xb51541df05de07be38dcfc4a80c05389a54502bb")
    );
  } else if (equalsIgnoreCase(network, Network.REI)) {
    return new NetworkSpecificConstant(
      chainId,
      getOrCreateGasFeeToken(
        Address.fromString("0x3e9d9124596af6d8faaefc9b3e07b3ce397d34f7"),
        "REI Token",
        "REIT",
        18 as i32
      ),
      Address.fromString("0x841ce48f9446c8e281d3f1444cb859b4a6d0738c"),
      Address.zero(),
      Address.zero(),
      Address.fromString("0x9b36f165bab9ebe611d491180418d8de4b8f3a1f"),
      Address.fromString("0x9b36f165bab9ebe611d491180418d8de4b8f3a1f")
    );
  } else if (equalsIgnoreCase(network, Network.SX)) {
    return new NetworkSpecificConstant(
      chainId,
      getOrCreateGasFeeToken(
        Address.fromString("0x99fe3b1391503a1bc1788051347a1324bff41452"),
        "SX Network Token",
        "SX",
        18 as i32
      ),
      Address.fromString("0x9b36f165bab9ebe611d491180418d8de4b8f3a1f"),
      Address.zero(),
      Address.zero(),
      Address.fromString("0x9bb46d5100d2db4608112026951c9c965b233f4d"),
      Address.fromString("0x9bb46d5100d2db4608112026951c9c965b233f4d")
    );
  } else if (equalsIgnoreCase(network, Network.SHIDEN)) {
    return new NetworkSpecificConstant(
      chainId,
      getOrCreateGasFeeToken(
        Address.fromString("0x00e856ee945a49bb73436e719d96910cd9d116a4"),
        "SHIDEN Token",
        "SDN",
        18 as i32
      ),
      Address.fromString("0x841ce48f9446c8e281d3f1444cb859b4a6d0738c"),
      Address.fromString("0xbb7684cc5408f4dd0921e5c2cadd547b8f1ad573"),
      Address.zero(),
      Address.zero(),
      Address.zero()
    );
  } /* // SWIMMER Network is not included in Network
  else if (equalsIgnoreCase(network, Network.SWIMMER)) {
    return new NetworkSpecificConstant(
      chainId,
      Address.fromString("0xb51541df05de07be38dcfc4a80c05389a54502bb"),
      Address.zero(),
      Address.zero(),
      Address.fromString("0xf8bf9988206c4de87f52a3c24486e4367b7088cb"),
      Address.fromString("0xf8bf9988206c4de87f52a3c24486e4367b7088cb")
    );
  }*/ else if (equalsIgnoreCase(network, Network.SYSCOIN)) {
    return new NetworkSpecificConstant(
      chainId,
      getOrCreateGasFeeToken(
        Address.fromString("0x3a0d746b3ea1d8ccdf19ad915913bd68391133ca"),
        "Syscoin Token",
        "SYSX",
        18 as i32
      ),
      Address.fromString("0x841ce48f9446c8e281d3f1444cb859b4a6d0738c"),
      Address.zero(),
      Address.zero(),
      Address.zero(),
      Address.zero()
    );
  }

  log.error("[getNetworkSpecificConstant] Unsupported network: {}", [network]);
  return new NetworkSpecificConstant(
    networkToChainID(Network.UNKNOWN_NETWORK),
    gasFeeToken,
    Address.zero(),
    Address.zero(),
    Address.zero(),
    Address.zero(),
    Address.zero()
  );
}
