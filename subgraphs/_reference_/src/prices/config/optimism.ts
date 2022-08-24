import { Address, TypedMap, BigInt } from "@graphprotocol/graph-ts";

export const NETWORK_STRING = "optimism";

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
  "0x4200000000000000000000000000000000000006"
);

export const SUSHISWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
SUSHISWAP_ROUTER_ADDRESS.set(
  "routerV1",
  Address.fromString("0x0000000000000000000000000000000000000000")
);
SUSHISWAP_ROUTER_ADDRESS.set(
  "routerV2",
  Address.fromString("0xbe811a0d44e2553d25d11cb8dc0d3f0d0e6430e6")
);

///////////////////////////////////////////////////////////////////////////
////////////////////////// UNISWAP CONTRACT ///////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
UNISWAP_ROUTER_ADDRESS.set(
  "routerV1",
  Address.fromString("0xe592427a0aece92de3edee1f18e0157c05861564")
);
UNISWAP_ROUTER_ADDRESS.set(
  "routerV2",
  Address.fromString("0xa5e0829caced8ffdd4de3c43696c57f7d7a678ff")
);

export const UNISWAP_PATH_OVERRIDE = new TypedMap<Address, Address[]>();

///////////////////////////////////////////////////////////////////////////
///////////////////////////// YEARNLENS CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_CONTRACT_ADDRESS =
  "0x0000000000000000000000000000000000000000";

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CHAINLINK CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

// No Chainlink feed registry on polygon
export const CHAIN_LINK_CONTRACT_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// HELPERS /////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const USDC_DECIMALS = BigInt.fromI32(6);

export const WHITELIST_TOKENS = new TypedMap<string, Address>();
WHITELIST_TOKENS.set(
  "WETH",
  Address.fromString("0x4200000000000000000000000000000000000006")
);
WHITELIST_TOKENS.set(
  "USDT",
  Address.fromString("0x94b008aa00579c1307b0ef2c499ad98a8ce58e58")
);
WHITELIST_TOKENS.set(
  "DAI",
  Address.fromString("0xda10009cbd5d07dd0cecc66161fc93d7c9000da1")
);
WHITELIST_TOKENS.set(
  "USDC",
  Address.fromString("0x7f5c764cbc14f9669b88837ca1490cca17c31607")
);
WHITELIST_TOKENS.set(
  "WBTC",
  Address.fromString("0x68f180fcce6836688e9084f035309e29bf0a2095")
);
WHITELIST_TOKENS.set(
  "LINK",
  Address.fromString("0x350a791bfc2c21f9ed5d10980dad2e2638ffa7f6")
);
