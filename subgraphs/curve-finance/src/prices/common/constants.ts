import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

///////////////////////////////////////////////////////////////////////////
/////////////////////////////////// COMMON ////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export namespace OracleType {
  export const AAVE_ORACLE = "AaveOracle";
  export const INCH_ORACLE = "InchOracle";
  export const CURVE_ROUTER = "CurveRouter";
  export const CHAINLINK_FEED = "ChainlinkFeed";
  export const YEARN_LENS_ORACLE = "YearnLensOracle";
  export const CURVE_CALCULATIONS = "CurveCalculations";
  export const UNISWAP_FORKS_ROUTER = "UniswapForksRouter";
  export const SUSHI_CALCULATIONS = "SushiswapCalculations";
}

export namespace NULL {
  export const TYPE_STRING = "0x0000000000000000000000000000000000000000";
  export const TYPE_ADDRESS = Address.fromString(TYPE_STRING);
}

export const CHAIN_LINK_USD_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000348"
);
export const ETH_ADDRESS = Address.fromString(
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
);

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGINT_TEN_THOUSAND = BigInt.fromI32(10000);

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_USD_PRICE = BigDecimal.fromString("1000000");

export const DEFAULT_USDC_DECIMALS = 6;
export const DEFAULT_AAVE_ORACLE_DECIMALS = 8;
export const DEFAULT_DECIMALS = BigInt.fromI32(18);

export const STABLE_TOKENS: string[] = ["WETH", "DAI", "USDT", "USDC"];

export const BLACKLISTED_TOKENS: Address[] = [
  Address.fromString("0x0000000000000000000000000000000000000000"), // Null Address
  Address.fromString("0xb755b949c126c04e0348dd881a5cf55d424742b2"), // Curve USD-BTC-ETH
  Address.fromString("0xd79138c49c49200a1afc935171d1bdad084fdc95"), // Curve.fi Factory Plain Pool: 3pool
  Address.fromString("0x37c9be6c81990398e9b87494484afc6a4608c25d"), // Curve.fi Factory Plain Pool: blizz
  Address.fromString("0xf72beacc6fd334e14a7ddac25c3ce1eb8a827e10"), // Curve.fi Factory USD Metapool: Defrost H2O
];
