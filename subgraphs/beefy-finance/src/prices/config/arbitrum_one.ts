import { Address, TypedMap } from "@graphprotocol/graph-ts";

export const NETWORK_STRING = "arbitrum-one";
export const NETWORK_CHAIN_ID = 42161;
export const NETWORK_SUFFIX = "-" + NETWORK_CHAIN_ID.toString();

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_CALCULATIONS_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);
export const CURVE_REGISTRY_ADDRESS = Address.fromString(
  "0x445fe580ef8d70ff569ab36e80c647af338db351"
);
export const CURVE_POOL_REGISTRY_ADDRESS = Address.fromString(
  "0x445fe580ef8d70ff569ab36e80c647af338db351"
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// SUSHISWAP CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const SUSHISWAP_CALCULATIONS_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);
export const SUSHISWAP_WETH_ADDRESS = Address.fromString(
  "0x82af49447d8a07e3bd95bd0d56f35241523fbab1"
);

export const SUSHISWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
SUSHISWAP_ROUTER_ADDRESS.set(
  "routerV1",
  Address.fromString("0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506")
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
  Address.fromString("0xE592427A0AEce92De3Edee1F18E0157C05861564")
);
UNISWAP_ROUTER_ADDRESS.set(
  "routerV2",
  Address.fromString("0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45")
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
  Address.fromString("0x82aF49447D8a07e3bd95BD0d56f35241523fBab1")
);
WHITELIST_TOKENS.set(
  "ETH",
  Address.fromString("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE")
);
WHITELIST_TOKENS.set(
  "USDT",
  Address.fromString("0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9")
);
WHITELIST_TOKENS.set(
  "DAI",
  Address.fromString("0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1")
);
WHITELIST_TOKENS.set(
  "USDC",
  Address.fromString("0xff970a61a04b1ca14834a43f5de4533ebddb5cc8")
);
WHITELIST_TOKENS.set(
  "WBTC",
  Address.fromString("0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f")
);
WHITELIST_TOKENS.set(
  "LINK",
  Address.fromString("0xf97f4df75117a78c1a5a0dbb814af92458539fb4")
);
WHITELIST_TOKENS.set(
  "CRV",
  Address.fromString("0x11cdb42b0eb46d95f990bedd4695a6e3fa034978")
);
