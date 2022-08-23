import { Address, TypedMap } from "@graphprotocol/graph-ts";

export const NETWORK_STRING = "matic";
export const NETWORK_CHAIN_ID = 137;
export const NETWORK_SUFFIX = "-" + NETWORK_CHAIN_ID.toString();

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_CALCULATIONS_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);
export const CURVE_REGISTRY_ADDRESS = Address.fromString(
  "0x094d12e5b541784701fd8d65f11fc0598fbc6332"
);
export const CURVE_POOL_REGISTRY_ADDRESS = Address.fromString(
  "0x094d12e5b541784701fd8d65f11fc0598fbc6332"
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// SUSHISWAP CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const SUSHISWAP_CALCULATIONS_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);
export const SUSHISWAP_WETH_ADDRESS = Address.fromString(
  "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"
);

export const SUSHISWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
SUSHISWAP_ROUTER_ADDRESS.set(
  "routerV1",
  Address.fromString("0x1b02da8cb0d097eb8d57a175b88c7d8b47997506")
);
SUSHISWAP_ROUTER_ADDRESS.set(
  "routerV2",
  Address.fromString("0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506")
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// UNISWAP CONTRACT ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
UNISWAP_ROUTER_ADDRESS.set(
  "routerV1",
  Address.fromString("0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff")
);
UNISWAP_ROUTER_ADDRESS.set(
  "routerV2",
  Address.fromString("0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45")
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// YEARNLENS CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_CONTRACT_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);

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
  Address.fromString("0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619")
);
WHITELIST_TOKENS.set(
  "ETH",
  Address.fromString("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE")
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
  "WBTC",
  Address.fromString("0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6")
);
WHITELIST_TOKENS.set(
  "LINK",
  Address.fromString("0xb0897686c545045aFc77CF20eC7A532E3120E0F1")
);
WHITELIST_TOKENS.set(
  "CRV",
  Address.fromString("0x172370d5Cd63279eFa6d502DAB29171933a610AF")
);
