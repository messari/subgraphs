import { BigInt, Address, TypedMap } from "@graphprotocol/graph-ts";

export const NETWORK_STRING = "matic";

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
  "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270" // WMATIC
);

export const SUSHISWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
SUSHISWAP_ROUTER_ADDRESS.set(
  "routerV1",
  Address.fromString("0x0000000000000000000000000000000000000000")
);
SUSHISWAP_ROUTER_ADDRESS.set(
  "routerV2",
  Address.fromString("0x1b02da8cb0d097eb8d57a175b88c7d8b47997506")
);

///////////////////////////////////////////////////////////////////////////
////////////////////////// QUICKSWAP CONTRACT ///////////////////////////
///////////////////////////////////////////////////////////////////////////
// NOTE: QUICKSWAP is a Uniswap V2 Fork

export const QUICKSWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
QUICKSWAP_ROUTER_ADDRESS.set(
  "routerV1",
  Address.fromString("0x0000000000000000000000000000000000000000")
);
QUICKSWAP_ROUTER_ADDRESS.set(
  "routerV2",
  Address.fromString("0xa5e0829caced8ffdd4de3c43696c57f7d7a678ff")
);

export const QUICKSWAP_PATH_OVERRIDE = new TypedMap<Address, Address[]>();
QUICKSWAP_PATH_OVERRIDE.set(
  Address.fromString("0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6"), // WBTC - WBTC/WMATIC liquidity too low， use WBTC/USDC directly
  [
    Address.fromString("0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6"), // WBTC
    Address.fromString("0x2791bca1f2de4661ed88a30c99a7a9449aa84174"), // USDC
  ]
);

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
///////////////////////////// CHAINLINK CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const AAVE_ORACLE_CONTRACT_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CHAINLINK CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const ONE_INCH_ORACLE_CONTRACT_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// HELPERS /////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const USDC_DECIMALS = BigInt.fromI32(6);

export const WHITELIST_TOKENS = new TypedMap<string, Address>();
WHITELIST_TOKENS.set(
  "WETH",
  Address.fromString("0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270") // WMATIC
);
WHITELIST_TOKENS.set(
  "USDT",
  Address.fromString("0xc2132d05d31c914a87c6611c10748aeb04b58e8f")
);
WHITELIST_TOKENS.set(
  "DAI",
  Address.fromString("0x8f3cf7ad23cd3cadbd9735aff958023239c6a063")
);
WHITELIST_TOKENS.set(
  "USDC",
  Address.fromString("0x2791bca1f2de4661ed88a30c99a7a9449aa84174")
);
WHITELIST_TOKENS.set(
  "ETH",
  Address.fromString("0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0") // MATIC
);
WHITELIST_TOKENS.set(
  "WBTC",
  Address.fromString("0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6")
);
WHITELIST_TOKENS.set(
  "EURS",
  Address.fromString("0xe111178a87a3bff0c8d18decba5798827539ae99")
);
WHITELIST_TOKENS.set(
  "LINK",
  Address.fromString("0xb0897686c545045afc77cf20ec7a532e3120e0f1")
);
