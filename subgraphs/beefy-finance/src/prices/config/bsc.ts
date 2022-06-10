import { Address, TypedMap } from "@graphprotocol/graph-ts";

export const NETWORK_STRING = "bsc";
export const NETWORK_CHAIN_ID = 56;
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
  "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
);

export const SUSHISWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
SUSHISWAP_ROUTER_ADDRESS.set(
  "routerV1",
  Address.fromString("0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8") //biswap
);
SUSHISWAP_ROUTER_ADDRESS.set(
  "routerV2",
  Address.fromString("0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506") //sushiswap
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// UNISWAP CONTRACT ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
UNISWAP_ROUTER_ADDRESS.set(
  "routerV1",
  Address.fromString("0x10ED43C718714eb63d5aA57B78B54704E256024E") //pancakeswap
);
UNISWAP_ROUTER_ADDRESS.set(
  "routerV2",
  Address.fromString("0xcF0feBd3f17CEf5b47b0cD257aCf6025c5BFf3b7") //apeswap
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
  Address.fromString("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c")
);
WHITELIST_TOKENS.set(
  "ETH",
  Address.fromString("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE")
);
WHITELIST_TOKENS.set(
  "USDT",
  Address.fromString("0x2B90E061a517dB2BbD7E39Ef7F733Fd234B494CA")
);
WHITELIST_TOKENS.set(
  "DAI",
  Address.fromString("0x1dC56F2705Ff2983f31fb5964CC3E19749A7CBA7")
);
WHITELIST_TOKENS.set(
  "USDC",
  Address.fromString("0xc1F47175d96Fe7c4cD5370552e5954f384E3C791")
);
WHITELIST_TOKENS.set(
  "WBTC",
  Address.fromString("0x2919B42E28Ba205b56712425d09D98D3BDeB7b1a")
);
WHITELIST_TOKENS.set(
  "LINK",
  Address.fromString("0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD")
);
WHITELIST_TOKENS.set(
  "CRV",
  Address.fromString("0x0000000000000000000000000000000000000000")
);
