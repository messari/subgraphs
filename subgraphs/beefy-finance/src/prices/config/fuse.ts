import { Address, TypedMap } from "@graphprotocol/graph-ts";

export const NETWORK_STRING = "fuse";
export const NETWORK_CHAIN_ID = 122;
export const NETWORK_SUFFIX = "-" + NETWORK_CHAIN_ID.toString();

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_CALCULATIONS_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);
export const CURVE_REGISTRY_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);
export const CURVE_POOL_REGISTRY_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// SUSHISWAP CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const SUSHISWAP_CALCULATIONS_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);
export const SUSHISWAP_WETH_ADDRESS = Address.fromString(
  "0x0BE9e53fd7EDaC9F859882AfdDa116645287C629"
);

export const SUSHISWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
SUSHISWAP_ROUTER_ADDRESS.set(
  "routerV1",
  Address.fromString("0xF4d73326C13a4Fc5FD7A064217e12780e9Bd62c3")
);
SUSHISWAP_ROUTER_ADDRESS.set(
  "routerV2",
  Address.fromString("0x0000000000000000000000000000000000000000")
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// UNISWAP CONTRACT ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
UNISWAP_ROUTER_ADDRESS.set(
  "routerV1",
  Address.fromString("0xE3F85aAd0c8DD7337427B9dF5d0fB741d65EEEB5")
);
UNISWAP_ROUTER_ADDRESS.set(
  "routerV2",
  Address.fromString("0x0000000000000000000000000000000000000000")
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// YEARNLENS CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_CONTRACT_ADDRESS =
  "0x0000000000000000000000000000000000000000";

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CHAINLINK CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CHAIN_LINK_CONTRACT_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// HELPERS /////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const WHITELIST_TOKENS = new TypedMap<string, Address>();
WHITELIST_TOKENS.set(
  "WETH",
  Address.fromString("0x0BE9e53fd7EDaC9F859882AfdDa116645287C629")
);
WHITELIST_TOKENS.set(
  "ETH",
  Address.fromString("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE")
);
WHITELIST_TOKENS.set(
  "USDT",
  Address.fromString("0xFaDbBF8Ce7D5b7041bE672561bbA99f79c532e10")
);
WHITELIST_TOKENS.set(
  "DAI",
  Address.fromString("0x94Ba7A27c7A95863d1bdC7645AC2951E0cca06bA")
);
WHITELIST_TOKENS.set(
  "USDC",
  Address.fromString("0x620fd5fa44BE6af63715Ef4E65DDFA0387aD13F5")
);
WHITELIST_TOKENS.set(
  "WBTC",
  Address.fromString("0x33284f95ccb7B948d9D352e1439561CF83d8d00d")
);
WHITELIST_TOKENS.set(
  "LINK",
  Address.fromString("0x0972F26e8943679b043de23df2fD3852177A7c48")
);
WHITELIST_TOKENS.set(
  "CRV",
  Address.fromString("0xa30BC35F48Af8A4cF10f388A414871DceEBF3863")
);
