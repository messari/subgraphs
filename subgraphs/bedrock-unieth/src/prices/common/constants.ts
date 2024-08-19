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

export const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

export const WETH_LIKE_TOKENS: Address[] = [
  Address.fromString("0xefefefefefefefefefefefefefefefefefefefef"), // egETH
  Address.fromString("0xf1c9acdc66974dfb6decb12aa385b9cd01190e38"), // osETH
  Address.fromString("0xac3e018457b222d93114458476f3e3416abbe38f"), // sfrxETH
  Address.fromString("0xa2e3356610840701bdf5611a53974510ae27e2e1"), // wBETH
];
