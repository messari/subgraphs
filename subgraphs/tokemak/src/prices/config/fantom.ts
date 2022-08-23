import { Address, TypedMap } from "@graphprotocol/graph-ts";

export const NETWORK_STRING = "fantom";

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_CALCULATIONS_ADDRESS = Address.fromString("0x0b53e9df372e72d8fdcdbedfbb56059957a37128");
export const CURVE_REGISTRY_ADDRESS = Address.fromString("0x0f854EA9F38ceA4B1c2FC79047E9D0134419D5d6");
export const CURVE_POOL_REGISTRY_ADDRESS = Address.fromString("0x4fb93D7d320E8A263F22f62C2059dFC2A8bCbC4c");

///////////////////////////////////////////////////////////////////////////
///////////////////////////// SUSHISWAP CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const SUSHISWAP_CALCULATIONS_ADDRESS = Address.fromString("0xec7Ac8AC897f5082B2c3d4e8D2173F992A097F24");
export const SUSHISWAP_WETH_ADDRESS = Address.fromString("0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83");

export const SUSHISWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
SUSHISWAP_ROUTER_ADDRESS.set("routerV1", Address.fromString("0x1b02da8cb0d097eb8d57a175b88c7d8b47997506"));
SUSHISWAP_ROUTER_ADDRESS.set("routerV2", Address.fromString("0x0000000000000000000000000000000000000000"));

///////////////////////////////////////////////////////////////////////////
///////////////////////////// UNISWAP CONTRACT ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const SPOOKY_SWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
SPOOKY_SWAP_ROUTER_ADDRESS.set("routerV1", Address.fromString("0xbe4fc72f8293f9d3512d58b969c98c3f676cb957"));
SPOOKY_SWAP_ROUTER_ADDRESS.set("routerV2", Address.fromString("0x0000000000000000000000000000000000000000"));

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
WHITELIST_TOKENS.set(
  "WETH",
  Address.fromString("0x658b0c7613e890ee50b8c4bc6a3f41ef411208ad"), // fETH
);
WHITELIST_TOKENS.set("ETH", Address.fromString("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"));
WHITELIST_TOKENS.set("gfUSDT", Address.fromString("0x940f41f0ec9ba1a34cf001cc03347ac092f5f6b5"));
WHITELIST_TOKENS.set("DAI", Address.fromString("0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e"));
WHITELIST_TOKENS.set("USDC", Address.fromString("0x04068da6c83afcfa0e13ba15a6696662335d5b75"));
WHITELIST_TOKENS.set("WFTM", Address.fromString("0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83"));
WHITELIST_TOKENS.set("WBTC", Address.fromString("0x321162Cd933E2Be498Cd2267a90534A804051b11"));
WHITELIST_TOKENS.set("fBTC", Address.fromString("0xe1146b9ac456fcbb60644c36fd3f868a9072fc6e"));
WHITELIST_TOKENS.set("FRAX", Address.fromString("0xdc301622e621166bd8e82f2ca0a26c13ad0be355"));
WHITELIST_TOKENS.set("LINK", Address.fromString("0xb3654dc3d10ea7645f8319668e8f54d2574fbdc8"));
WHITELIST_TOKENS.set("CRV", Address.fromString("0x1E4F97b9f9F913c46F1632781732927B9019C68b"));
