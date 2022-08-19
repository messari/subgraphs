import { Address, TypedMap } from "@graphprotocol/graph-ts";

export const NETWORK_STRING = "bsc";

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
  "0x0000000000000000000000000000000000000000"
);

export const SUSHISWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
SUSHISWAP_ROUTER_ADDRESS.set(
  "routerV1",
  Address.fromString("0x0000000000000000000000000000000000000000")
);
SUSHISWAP_ROUTER_ADDRESS.set(
  "routerV2",
  Address.fromString("0x0000000000000000000000000000000000000000")
);

///////////////////////////////////////////////////////////////////////////
////////////////////////// PANCAKESWAP CONTRACT ///////////////////////////
///////////////////////////////////////////////////////////////////////////
// NOTE: PancakeSwap is a Uniswap Fork

export const UNISWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
UNISWAP_ROUTER_ADDRESS.set(
  "routerV1",
  Address.fromString("0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8") // Biswap v2 Router
);
UNISWAP_ROUTER_ADDRESS.set(
  "routerV2",
  Address.fromString("0x10ED43C718714eb63d5aA57B78B54704E256024E") // Pancakeswap v2 Router
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

export const CHAIN_LINK_CONTRACT_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// HELPERS /////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const USDC_DECIMALS = 18;

export const WHITELIST_TOKENS = new TypedMap<string, Address>();
WHITELIST_TOKENS.set(
  "WETH",
  Address.fromString("0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c")
);
WHITELIST_TOKENS.set(
  "USDT",
  Address.fromString("0x55d398326f99059ff775485246999027b3197955")
);
WHITELIST_TOKENS.set(
  "DAI",
  Address.fromString("0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3")
);
WHITELIST_TOKENS.set(
  "USDC",
  Address.fromString("0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d")
);
WHITELIST_TOKENS.set(
  "ETH",
  Address.fromString("0x2170ed0880ac9a755fd29b2688956bd959f933f8")
);
WHITELIST_TOKENS.set(
  "WBTC",
  Address.fromString("0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c")
);
WHITELIST_TOKENS.set(
  "EURS",
  Address.fromString("0x0000000000000000000000000000000000000000")
);
WHITELIST_TOKENS.set(
  "LINK",
  Address.fromString("0xf8a0bf9cf54bb92f17374d9e9a321e6a111a51bd")
);
