import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

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
  export const AVALANCHE = "AVALANCHE";
  export const BOBA = "BOBA";
  export const AURORA = "AURORA";
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

export namespace RewardIntervalType {
  export const BLOCK = "BLOCK";
  export const TIMESTAMP = "TIMESTAMP";
}

export namespace NULL {
  export const TYPE_STRING = "0x0000000000000000000000000000000000000000";
  export const TYPE_ADDRESS = Address.fromString(TYPE_STRING);
}

export namespace Protocol {
  export const NAME = "Beethoven X";
  export const SLUG = "beethoven-x";
  export const NETWORK = Network.FANTOM;
}

export namespace MasterChef {
  export const MINICHEF = "MINICHEF";
  export const MASTERCHEF = "MASTERCHEF";
  export const MASTERCHEFV2 = "MASTERCHEFV2";
  export const MASTERCHEFV3 = "MASTERCHEFV3";
}

export const SECONDS_PER_HOUR = 60 * 60;
export const SECONDS_PER_DAY = 60 * 60 * 24;
export const MAX_BPS = BigInt.fromI32(10000);
export const DEFAULT_DECIMALS = BigInt.fromI32(18);

export const INT_ZERO = 0 as i32;
export const INT_ONE = 1 as i32;

export const BIGINT_NEG_ONE = BigInt.fromI32(-1);
export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGINT_HUNDRED = BigInt.fromI32(100);
export const BIGINT_NEGATIVE_ONE = BigInt.fromString("-1");

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export const BIGDECIMAL_TEN = new BigDecimal(BIGINT_TEN);
export const BIGDECIMAL_HUNDRED = BigDecimal.fromString("100");
export const BIGDECIMAL_NEGATIVE_ONE = BigDecimal.fromString("-1");
export const BIGDECIMAL_POINT_FOUR = BigDecimal.fromString("0.4");

export const DEFAULT_DECIMALS_DENOMINATOR = BigDecimal.fromString("1000000000000000000");
export const FEE_DENOMINATOR = DEFAULT_DECIMALS_DENOMINATOR;

export const USDC_DECIMALS = 6;
export const USDC_DENOMINATOR = BigDecimal.fromString("1000000");


export const MIN_POOL_LIQUIDITY = BigDecimal.fromString('2000');
export const MIN_SWAP_VALUE_USD = BigDecimal.fromString('1');

export const PRICE_CACHING_BLOCKS = BigInt.fromI32(7000);

/////////////////////////////////////
///// Protocol/Network Specific /////
/////////////////////////////////////

export const VAULT_ADDRESS = Address.fromString(
  "0x20dd72Ed959b6147912C2e529F0a0C651c33c9ce"
);
export const PROTOCOL_FEES_COLLECTOR_ADDRESS = Address.fromString(
  "0xc6920d3a369e7c8bd1a22dbe385e11d1f7af948f"
);
export const PROTOCOL_TOKEN_ADDRESS = Address.fromString(
  "0xF24Bcf4d1e507740041C9cFd2DddB29585aDCe1e"
);
export const GAUGE_CONTROLLER_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);
export const AAVE_BOOSTED_POOL_ADDRESS = Address.fromString(
  "0x7b50775383d3d6f0215a8f290f2c9e2eebbeceb2"
);
export const BLACKLISTED_PHANTOM_POOLS: Address[] = [
  Address.fromString("0x2bbf681cc4eb09218bee85ea2a5d3d13fa40fc0c"), // Balancer Aave Boosted Pool (USDT) OLD
  Address.fromString("0x804cdb9116a10bb78768d3252355a1b18067bf8f"), // Balancer Aave Boosted Pool (DAI) OLD
  Address.fromString("0x9210f1204b5a24742eba12f710636d76240df3d0"), // Balancer Aave Boosted Pool (USDC) OLD
  Address.fromString("0x2f4eb100552ef93840d5adc30560e5513dfffacb"), // Balancer Aave Boosted Pool (USDT)
  Address.fromString("0xae37d54ae477268b9997d4161b96b8200755935c"), // Balancer Aave Boosted Pool (DAI)
  Address.fromString("0x82698aecc9e28e9bb27608bd52cf57f704bd1b83"), // Balancer Aave Boosted Pool (USDC)
];

export const USE_SWAP_BASED_PRICE_LIB = true;

export const INFLATION_INTERVAL = "TIMESTAMP";
export const STARTING_INFLATION_RATE = BigDecimal.fromString((0).toString()).times(DEFAULT_DECIMALS_DENOMINATOR);

class Assets {
  public stableAssets: Address[];
  public pricingAssets: Address[];
  public fxAssets: Address[];
  public fxAggregators: Address[];
}

export const USDC_ADDRESS = Address.fromString('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
export const DAI_ADDRESS = Address.fromString('0x6b175474e89094c44da98b954eedeac495271d0f');
export const USDT_ADDRESS = Address.fromString('0xdac17f958d2ee523a2206206994597c13d831ec7');

export const assets: Assets = {
  stableAssets: [
    Address.fromString('0x04068da6c83afcfa0e13ba15a6696662335d5b75'), // USDC
    Address.fromString('0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e'), // DAI
    Address.fromString('0x049d68029688eabf473097a2fc38ef61633a3c7a'), // fUSDT
  ],
  pricingAssets: [
    Address.fromString('0x74b23882a30290451a17c44f4f05243b6b58c76d'), // WETH
    Address.fromString('0x1f32b1c2345538c0c6f582fcb022739c4a194ebb'), // wstETH
    Address.fromString('0x13bc6df7189f7997b4977322f2142aa4bb18efae'), // bb-a-USD
    Address.fromString('0x58a547ed09684ac2a688610d5caf8e8968b51908'), // BAL
    Address.fromString('0x38aca5484b8603373acc6961ecd57a6a594510a3'), // WBTC
    Address.fromString('0x39b3bd37208cbade74d0fcbdbb12d606295b430a'), // FTM
  ],
  fxAssets: [
  ],
  fxAggregators: [
  ],
};

export const FX_AGGREGATOR_ADDRESSES = assets.fxAggregators;
export const FX_TOKEN_ADDRESSES = assets.fxAssets;

export const USD_STABLE_ASSETS = assets.stableAssets;
export const PRICING_ASSETS = assets.stableAssets.concat(assets.pricingAssets);
