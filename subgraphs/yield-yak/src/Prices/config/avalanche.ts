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
///////////////////////////// TRADERJOE CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const TRADERJOE_WETH_ADDRESS = Address.fromString("0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7");
export const TRADERJOE_CALCULATIONS_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000000");

export const TRADERJOE_ROUTER_ADDRESS = new TypedMap<string, Address>();
TRADERJOE_ROUTER_ADDRESS.set("routerV1", Address.fromString("0x60aE616a2155Ee3d9A68541Ba4544862310933d4"));
TRADERJOE_ROUTER_ADDRESS.set("routerV2", Address.fromString("0x0000000000000000000000000000000000000000"));

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// HELPERS /////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const WHITELIST_TOKENS = new TypedMap<string, Address>();
WHITELIST_TOKENS.set(
  "WAVAX",
  Address.fromString("0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7")
);
WHITELIST_TOKENS.set(
  "AVAX",
  Address.fromString("0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7")
);
WHITELIST_TOKENS.set(
  "ETH",
  Address.fromString("0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB")
);
WHITELIST_TOKENS.set(
  "USDC",
  Address.fromString("0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664")
);

export const BASE_TOKEN = "AVAX";
export const WRAPPED_BASE_TOKEN = "WAVAX";
