import * as AVALANCHE from "../config/avalanche";

import { Address, BigDecimal, BigInt, TypedMap } from "@graphprotocol/graph-ts";
import { SushiSwapPair__getReservesResult } from "../../../generated/YakStrategyV2/SushiSwapPair";

///////////////////////////////////////////////////////////////////////////
/////////////////////////////////// COMMON ////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGINT_TEN_THOUSAND = BigInt.fromI32(10000);

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);

export const DEFAULT_USDC_DECIMALS = 6;
export const DEFAULT_DECIMALS = BigInt.fromI32(18);

export const ZERO_ADDRESS_STRING = "0x0000000000000000000000000000000000000000";

export const ZERO_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);
export const CHAIN_LINK_USD_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000348"
);

export const NETWORK_BASE_TOKEN_MAP = new TypedMap<string, string[]>();
NETWORK_BASE_TOKEN_MAP.set(AVALANCHE.NETWORK_STRING, [
  AVALANCHE.BASE_TOKEN,
  AVALANCHE.WRAPPED_BASE_TOKEN,
]);

export const WRAPPED_BASE_TOKEN_CALCULATIONS_ADDRESS_MAP = new TypedMap<
  string,
  string
>();

export const WHITELIST_TOKENS_LIST: string[] = [
  "WETH",
  "WAVAX",
  "AVAX",
  "USDT",
  "DAI",
  "USDC",
  "ETH",
  "WBTC",
  "EURS",
  "LINK",
  "gfUSDT",
  "WFTM",
  "fBTC",
  "FRAX",
  "CRV",
  "fsGLP",
];

///////////////////////////////////////////////////////////////////////////
///////////////////////////// SUSHISWAP CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const SUSHISWAP_DEFAULT_RESERVE_CALL =
  new SushiSwapPair__getReservesResult(BIGINT_ZERO, BIGINT_ZERO, BIGINT_ZERO);

export const SUSHISWAP_CALCULATIONS_ADDRESS_MAP = new TypedMap<
  string,
  Address
>();
SUSHISWAP_CALCULATIONS_ADDRESS_MAP.set(
  AVALANCHE.NETWORK_STRING,
  AVALANCHE.SUSHISWAP_CALCULATIONS_ADDRESS
);

export const SUSHISWAP_WETH_ADDRESS = new TypedMap<string, Address>();
SUSHISWAP_WETH_ADDRESS.set(
  AVALANCHE.NETWORK_STRING,
  AVALANCHE.SUSHISWAP_WETH_ADDRESS
);

export const SUSHISWAP_ROUTER_ADDRESS_MAP = new TypedMap<
  string,
  TypedMap<string, Address>
>();
SUSHISWAP_ROUTER_ADDRESS_MAP.set(
  AVALANCHE.NETWORK_STRING,
  AVALANCHE.SUSHISWAP_ROUTER_ADDRESS
);

export const TRADERJOE_ROUTER_ADDRESS_MAP = new TypedMap<
  string,
  TypedMap<string, Address>
>();
TRADERJOE_ROUTER_ADDRESS_MAP.set(
  AVALANCHE.NETWORK_STRING,
  AVALANCHE.TRADERJOE_ROUTER_ADDRESS
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// HELPERS /////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const WHITELIST_TOKENS_MAP = new TypedMap<
  string,
  TypedMap<string, Address>
>();
WHITELIST_TOKENS_MAP.set(AVALANCHE.NETWORK_STRING, AVALANCHE.WHITELIST_TOKENS);
