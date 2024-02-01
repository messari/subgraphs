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
  export const NAME = "Balancer v2";
  export const SLUG = "balancer-v2";
  export const NETWORK = Network.MAINNET;
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
  "0xBA12222222228d8Ba445958a75a0704d566BF2C8"
);
export const PROTOCOL_FEES_COLLECTOR_ADDRESS = Address.fromString(
  "0xce88686553686DA562CE7Cea497CE749DA109f9F"
);
export const PROTOCOL_TOKEN_ADDRESS = Address.fromString(
  "0xba100000625a3754423978a60c9317c58a424e3D"
);
export const GAUGE_CONTROLLER_ADDRESS = Address.fromString(
  "0xC128468b7Ce63eA702C1f104D55A2566b13D3ABD"
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

export const USE_SWAP_BASED_PRICE_LIB = false;

export const INFLATION_INTERVAL = "TIMESTAMP";
export const STARTING_INFLATION_RATE = BigDecimal.fromString((0.23974867724).toString()).times(DEFAULT_DECIMALS_DENOMINATOR);

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
    Address.fromString('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'), // USDC
    Address.fromString('0x6B175474E89094C44Da98b954EedeAC495271d0F'), // DAI
    Address.fromString('0xdAC17F958D2ee523a2206206994597C13D831ec7'), // USDT
  ],
  pricingAssets: [
    Address.fromString('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'), // WETH
    Address.fromString('0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0'), // wstETH
    Address.fromString('0x804CdB9116a10bB78768D3252355a1b18067bF8f'), // bb-a-DAI-V1
    Address.fromString('0x9210F1204b5a24742Eba12f710636D76240dF3d0'), // bb-a-USDC-V1
    Address.fromString('0x2BBf681cC4eb09218BEe85EA2a5d3D13Fa40fC0C'), // bb-a-USDT-V1
    Address.fromString('0xae37D54Ae477268B9997d4161B96b8200755935c'), // bb-a-DAI-V2
    Address.fromString('0x82698aeCc9E28e9Bb27608Bd52cF57f704BD1B83'), // bb-a-USDC-V2
    Address.fromString('0x2F4eb100552ef93840d5aDC30560E5513DFfFACb'), // bb-a-USDT-V2
    Address.fromString('0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'), // WBTC
    Address.fromString('0xba100000625a3754423978a60c9317c58a424e3D'), // BAL
    Address.fromString('0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2'), // MKR
    Address.fromString('0x6810e776880C02933D47DB1b9fc05908e5386b96'), // GNO
    Address.fromString('0x5c6ee304399dbdb9c8ef030ab642b10820db8f56'), // B-80BAL-20WETH
    Address.fromString('0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0'), // MATIC
    Address.fromString('0xA13a9247ea42D743238089903570127DdA72fE44'), // bb-a-USD
  ],
  fxAssets: [
    Address.fromString('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'), // USDC
    Address.fromString('0x70e8dE73cE538DA2bEEd35d14187F6959a8ecA96'), // XSGD
    Address.fromString('0x6B175474E89094C44Da98b954EedeAC495271d0F'), // DAI
    Address.fromString('0xdB25f211AB05b1c97D595516F45794528a807ad8'), // EURS
    Address.fromString('0xD533a949740bb3306d119CC777fa900bA034cd52'), // CRV
  ],
  fxAggregators: [
    Address.fromString('0x789190466E21a8b78b8027866CBBDc151542A26C'), // USDC-USD
    Address.fromString('0xc96129C796F03bb21AC947EfC5329CD1F560305B'), // XSGD-USD
    Address.fromString('0xDEc0a100eaD1fAa37407f0Edc76033426CF90b82'), // DAI-USD
    Address.fromString('0x02F878A94a1AE1B15705aCD65b5519A46fe3517e'), // EURS-USD
    Address.fromString('0xb4c4a493AB6356497713A78FFA6c60FB53517c63'), // CRV-USD
  ],
};

export const FX_AGGREGATOR_ADDRESSES = assets.fxAggregators;
export const FX_TOKEN_ADDRESSES = assets.fxAssets;

export const USD_STABLE_ASSETS = assets.stableAssets;
export const PRICING_ASSETS = assets.stableAssets.concat(assets.pricingAssets);
