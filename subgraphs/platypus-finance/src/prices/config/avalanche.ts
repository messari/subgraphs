import { Address, TypedMap } from "@graphprotocol/graph-ts";

export const NETWORK_STRING = "avalanche";

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_CALCULATIONS_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000000");
export const CURVE_REGISTRY_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000000");
export const CURVE_POOL_REGISTRY_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000000");

///////////////////////////////////////////////////////////////////////////
///////////////////////////// SUSHISWAP CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const SUSHISWAP_WETH_ADDRESS = Address.fromString("0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7");
export const SUSHISWAP_CALCULATIONS_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000000");

export const SUSHISWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
SUSHISWAP_ROUTER_ADDRESS.set("routerV1", Address.fromString("0x1b02da8cb0d097eb8d57a175b88c7d8b47997506"));
SUSHISWAP_ROUTER_ADDRESS.set("routerV2", Address.fromString("0x0000000000000000000000000000000000000000"));

///////////////////////////////////////////////////////////////////////////
///////////////////////////// UNISWAP CONTRACT ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const TRADERJOE_WETH_ADDRESS = Address.fromString("0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7");
export const TRADERJOE_CALCULATIONS_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000000");

export const TRADERJOE_ROUTER_ADDRESS = new TypedMap<string, Address>();
TRADERJOE_ROUTER_ADDRESS.set("routerV1", Address.fromString("0x60aE616a2155Ee3d9A68541Ba4544862310933d4"));
TRADERJOE_ROUTER_ADDRESS.set("routerV2", Address.fromString("0x0000000000000000000000000000000000000000"));

///////////////////////////////////////////////////////////////////////////
///////////////////////////// UNISWAP CONTRACT ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
UNISWAP_ROUTER_ADDRESS.set("routerV1", Address.fromString("0x0000000000000000000000000000000000000000"));
UNISWAP_ROUTER_ADDRESS.set("routerV2", Address.fromString("0x0000000000000000000000000000000000000000"));

///////////////////////////////////////////////////////////////////////////
///////////////////////////// YEARNLENS CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CHAINLINK CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CHAIN_LINK_CONTRACT_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000000");

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// HELPERS /////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const WHITELIST_TOKENS = new TypedMap<string, Address>();
WHITELIST_TOKENS.set("WAVAX", Address.fromString("0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7"));
WHITELIST_TOKENS.set("AVAX", Address.fromString("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"));
WHITELIST_TOKENS.set("ETH", Address.fromString("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"));
WHITELIST_TOKENS.set("USDT", Address.fromString("0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7"));
WHITELIST_TOKENS.set("DAI", Address.fromString("0xd586e7f844cea2f87f50152665bcbc2c279d8d70"));
WHITELIST_TOKENS.set("USDC", Address.fromString("0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664"));
WHITELIST_TOKENS.set("CRV", Address.fromString("0x249848beca43ac405b8102ec90dd5f22ca513c06"));
WHITELIST_TOKENS.set("LINK", Address.fromString("0x5947bb275c521040051d82396192181b413227a3"));
WHITELIST_TOKENS.set("WAVAX", Address.fromString("0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7"));

export const BASE_TOKEN = "AVAX";
export const WRAPPED_BASE_TOKEN = "WAVAX";
