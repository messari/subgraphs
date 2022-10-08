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
  "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270"  // WMATIC
);

export const SUSHISWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
SUSHISWAP_ROUTER_ADDRESS.set(
  "routerV1",
  Address.fromString("0x0000000000000000000000000000000000000000")
);
SUSHISWAP_ROUTER_ADDRESS.set(
  "routerV2",
  Address.fromString("0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506")
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
  Address.fromString("0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff")
);

export const QUICKSWAP_PATH_OVERRIDE = new TypedMap<Address, Address[]>();
QUICKSWAP_PATH_OVERRIDE.set(
  Address.fromString("0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6"),  // WBTC - WBTC/WMATIC liquidity too low， use WBTC/USDC directly
  [
    Address.fromString("0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6"),  // WBTC
    Address.fromString("0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"),  // USDC
  ]
)

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
  Address.fromString("0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270")  // WMATIC
);
WHITELIST_TOKENS.set(
  "USDT",
  Address.fromString("0xc2132D05D31c914a87C6611C10748AEb04B58e8F")
);
WHITELIST_TOKENS.set(
  "DAI",
  Address.fromString("0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063")
);
WHITELIST_TOKENS.set(
  "USDC",
  Address.fromString("0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174")
);
WHITELIST_TOKENS.set(
  "ETH",
  Address.fromString("0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0") // MATIC
);
WHITELIST_TOKENS.set(
  "WBTC",
  Address.fromString("0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6")
);
WHITELIST_TOKENS.set(
  "EURS",
  Address.fromString("0xE111178A87A3BFf0c8d18DECBa5798827539Ae99")
);
WHITELIST_TOKENS.set(
  "LINK",
  Address.fromString("0xb0897686c545045aFc77CF20eC7A532E3120E0F1")
);
