import { Address, TypedMap } from "@graphprotocol/graph-ts";

export const NETWORK_STRING = "arbitrum-one";

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_CALCULATIONS_ADDRESS = Address.fromString("0x26f698491daf32771217abc1356dae48c7230c75");
export const CURVE_REGISTRY_ADDRESS = Address.fromString("0x445FE580eF8d70FF569aB36e80c647af338db351");
export const CURVE_POOL_REGISTRY_ADDRESS = Address.fromString("0x0E9fBb167DF83EdE3240D6a5fa5d40c6C6851e15");

///////////////////////////////////////////////////////////////////////////
///////////////////////////// SUSHISWAP CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const SUSHISWAP_CALCULATIONS_ADDRESS = Address.fromString("0x5EA7E501c9A23F4A76Dc7D33a11D995B13a1dD25");
export const SUSHISWAP_WETH_ADDRESS = Address.fromString("0x82af49447d8a07e3bd95bd0d56f35241523fbab1");

export const SUSHISWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
SUSHISWAP_ROUTER_ADDRESS.set("routerV1", Address.fromString("0x1b02da8cb0d097eb8d57a175b88c7d8b47997506"));
SUSHISWAP_ROUTER_ADDRESS.set("routerV2", Address.fromString("0x0000000000000000000000000000000000000000"));

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
WHITELIST_TOKENS.set("WETH", Address.fromString("0x82af49447d8a07e3bd95bd0d56f35241523fbab1"));
WHITELIST_TOKENS.set("ETH", Address.fromString("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"));
WHITELIST_TOKENS.set("USDT", Address.fromString("0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9"));
WHITELIST_TOKENS.set("DAI", Address.fromString("0xda10009cbd5d07dd0cecc66161fc93d7c9000da1"));
WHITELIST_TOKENS.set("USDC", Address.fromString("0xff970a61a04b1ca14834a43f5de4533ebddb5cc8"));
WHITELIST_TOKENS.set("WBTC", Address.fromString("0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f"));
WHITELIST_TOKENS.set("LINK", Address.fromString("0xf97f4df75117a78c1a5a0dbb814af92458539fb4"));
WHITELIST_TOKENS.set("CRV", Address.fromString("0x11cdb42b0eb46d95f990bedd4695a6e3fa034978"));
