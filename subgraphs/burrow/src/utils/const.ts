import { BigInt, BigDecimal, TypedMap } from "@graphprotocol/graph-ts";

export const BI_ZERO = BigInt.fromString("0");
export const BI_ONE = BigInt.fromString("1");

export const BD_ZERO = BigDecimal.fromString("0");
export const BD_ONE = BigDecimal.fromString("1");
export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

export const BI_BD = (n: BigInt): BigDecimal =>
  BigDecimal.fromString(n.toString());
export const BD_BI = (n: BigDecimal): BigInt =>
  BigInt.fromString(n.truncate(0).toString());
export const BD = (n: string): BigDecimal => BigDecimal.fromString(n);
export const BI = (n: string): BigInt => BigInt.fromString(n);

export const BIGDECIMAL_ONE = BD("1");
export const BIGDECIMAL_TWO = BD("2");
export const BIGDECIMAL_THREE = BD("3");
export const BIGDECIMAL_TWELVE = BD("12");
export const BIGDECIMAL_SIX = BD("6");
export const BIGDECIMAL_100 = BD("100");

export const NANOSEC_TO_SEC = (time: u64): u64 => (time / 1000000000) as u64;
export const NANOS_TO_MS = (time: u64): u64 => (time / 1000000) as u64;
export const NANOS_TO_DAY = (time: u64): u64 =>
  (time / (1000000000 * 86400)) as u64;
export const NANOS_TO_HOUR = (time: u64): u64 =>
  (time / (1000000000 * 3600)) as u64;

////////////////////
///// Versions /////
////////////////////

export const PROTOCOL_NAME = "Burrow";
export const PROTOCOL_SLUG = "burrow-near";

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

export namespace AccountTime {
  export const HOURLY = "HOURLY";
  export const DAILY = "DAILY";
}

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
  export const FIXED = "FIXED";
}

export namespace InterestRateSide {
  export const LENDER = "LENDER";
  export const BORROWER = "BORROWER";
}

export namespace PositionSide {
  export const LENDER = "LENDER";
  export const BORROWER = "BORROWER";
}

export namespace UsageType {
  export const DEPOSIT = "DEPOSIT";
  export const WITHDRAW = "WITHDRAW";
  export const SWAP = "SWAP";
}

export namespace IntervalType {
  export const DAILY = "DAILY";
  export const HOURLY = "HOURLY";
}

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
export const BIGINT_MAX = BigInt.fromString(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935"
);

export const INT_NEGATIVE_ONE = -1 as i32;
export const INT_ZERO = 0 as i32;
export const INT_ONE = 1 as i32;
export const INT_TWO = 2 as i32;
export const INT_FOUR = 4 as i32;

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);

export const MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));

export const assets = new TypedMap<string, TokenMetadata>();

class TokenMetadata {
  constructor(
    public name: string,
    public symbol: string,
    public decimals: number,
    public extraDecimals: number
  ) {}
}

assets.set("meta-pool.near", new TokenMetadata("Staked NEAR", "stNEAR", 24, 0));

assets.set("usn", new TokenMetadata("USN Stablecoin", "USN", 18, 0));

assets.set("token.burrow.near", new TokenMetadata("Burrow", "BRRR", 18, 0));

assets.set("wrap.near", new TokenMetadata("Wrapped Near", "wNEAR", 24, 0));

assets.set(
  "dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near",
  new TokenMetadata("Tether USD", "USDT", 6, 12)
);

assets.set(
  "a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near",
  new TokenMetadata("USD Coin", "USDC", 6, 12)
);

assets.set(
  "6b175474e89094c44da98b954eedeac495271d0f.factory.bridge.near",
  new TokenMetadata("DAI Stablecoin", "DAI", 18, 0)
);

assets.set(
  "2260fac5e5542a773aa44fbcfedf7c193bc2c599.factory.bridge.near",
  new TokenMetadata("Wrapped BTC", "wBTC", 8, 10)
);

assets.set("aurora", new TokenMetadata("Ethereum", "ETH", 18, 0));

assets.set(
  "linear-protocol.near",
  new TokenMetadata("LiNEAR", "liNEAR", 24, 0)
);

assets.set(
  "4691937a7508860f876c9c0a2a617e7d9e945d4b.factory.bridge.near",
  new TokenMetadata("Wootrade Network", "WOO", 18, 0)
);

assets.set(
  "aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near",
  new TokenMetadata("Aurora", "AURORA", 18, 0)
);

assets.set("meta-token.near", new TokenMetadata("Meta Token", "META", 18, 0));

// v2-nearx.stader-labs.near
assets.set(
  "v2-nearx.stader-labs.near",
  new TokenMetadata("Stader NearX", "NEARX", 18, 0)
);

// wrapped near
assets.set(
  "c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.factory.bridge.near",
  new TokenMetadata("Wrapped Ether", "WETH", 18, 0)
);

// chainlink
assets.set(
  "514910771af9ca656af840dff83e8264ecf986ca.factory.bridge.near",
  new TokenMetadata("Chainlink", "LINK", 18, 0)
);

// ref
assets.set(
  "token.v2.ref-finance.near",
  new TokenMetadata("Ref Finance", "REF", 18, 0)
);

// skyward
assets.set(
  "token.skyward.near",
  new TokenMetadata("Skyward Finance", "SKYWARD", 18, 0)
);

// octopus
assets.set(
  "f5cfbc74057c610c8ef151a439252680ac68c6dc.factory.bridge.near",
  new TokenMetadata("Octopus", "OCT", 18, 0)
);
