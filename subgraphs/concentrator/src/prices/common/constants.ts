import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

///////////////////////////////////////////////////////////////////////////
/////////////////////////////////// COMMON ////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export namespace NULL {
  export const TYPE_STRING = "0x0000000000000000000000000000000000000000";
  export const TYPE_ADDRESS = Address.fromString(TYPE_STRING);
}

export namespace OracleType {
  export const AAVE_ORACLE = "AaveOracle";
  export const CURVE_ROUTER = "CurveRouter";
  export const CHAINLINK_FEED = "ChainlinkFeed";
  export const YEARN_LENS_ORACLE = "YearnLensOracle";
  export const CURVE_CALCULATIONS = "CurveCalculations";
  export const UNISWAP_FORKS_ROUTER = "UniswapForksRouter";
  export const SUSHI_CALCULATIONS = "SushiswapCalculations";
}

export const CHAIN_LINK_USD_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000348"
);

export const PRICE_LIB_VERSION = "1.3.4";

export const INT_ZERO = 0 as i32;
export const INT_ONE = 1 as i32;
export const INT_TWO = 2 as i32;
export const INT_NEGATIVE_ONE = -1 as i32;

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGINT_TEN_THOUSAND = BigInt.fromI32(10000);

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_USD_PRICE = BigDecimal.fromString("1000000");

export const AAVE_ORACLE_DECIMALS = 8;
export const DEFAULT_USDC_DECIMALS = 6;
export const DEFAULT_DECIMALS = BigInt.fromI32(18);

export const SDCRV_ADDRESS: Address = Address.fromString(
  "0xd1b5651e55d4ceed36251c61c50c889b36f6abb5"
);

export const CRV_ADDRESS: Address = Address.fromString(
  "0xd533a949740bb3306d119cc777fa900ba034cd52"
);

export const CURVE_ROUTER_BLACKLIST: Address[] = [
  Address.fromString("0x06325440d014e39736583c165c2963ba99faf14e"),
];

export const GLOBAL_PRICING_BLACKLIST: Address[] = [
  Address.fromString("0x0000000000000000000000000000000000000000"),
  Address.fromString("0xc4c319e2d4d66cca4464c0c2b32c9bd23ebe784e"), // Curve.fi Factory Pool: alETH
];
