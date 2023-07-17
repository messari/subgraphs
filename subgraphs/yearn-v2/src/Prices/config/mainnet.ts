import { Address, TypedMap } from "@graphprotocol/graph-ts";

export const NETWORK_STRING = "mainnet";

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_CALCULATIONS_ADDRESS = Address.fromString(
  "0x25bf7b72815476dd515044f9650bf79bad0df655"
);
export const CURVE_REGISTRY_ADDRESS = Address.fromString(
  "0x7d86446ddb609ed0f5f8684acf30380a356b2b4c"
);
export const CURVE_POOL_REGISTRY_ADDRESS = Address.fromString(
  "0x8f942c20d02befc377d41445793068908e2250d0"
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// SUSHISWAP CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const SUSHISWAP_CALCULATIONS_ADDRESS = Address.fromString(
  "0x8263e161a855b644f582d9c164c66aabee53f927"
);
export const SUSHISWAP_WETH_ADDRESS = Address.fromString(
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
);

export const SUSHISWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
SUSHISWAP_ROUTER_ADDRESS.set(
  "routerV1",
  Address.fromString("0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f")
);
SUSHISWAP_ROUTER_ADDRESS.set(
  "routerV2",
  Address.fromString("0x7a250d5630b4cf539739df2c5dacb4c659f2488d")
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// UNISWAP CONTRACT ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
UNISWAP_ROUTER_ADDRESS.set(
  "routerV1",
  Address.fromString("0x7a250d5630b4cf539739df2c5dacb4c659f2488d")
);
UNISWAP_ROUTER_ADDRESS.set(
  "routerV2",
  Address.fromString("0x0000000000000000000000000000000000000000")
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// YEARNLENS CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_CONTRACT_ADDRESS =
  "0x83d95e0d5f402511db06817aff3f9ea88224b030";

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CHAINLINK CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CHAIN_LINK_CONTRACT_ADDRESS = Address.fromString(
  "0x47fb2585d2c56fe188d0e6ec628a38b74fceeedf"
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// HELPERS /////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const WHITELIST_TOKENS = new TypedMap<string, Address>();
WHITELIST_TOKENS.set(
  "WETH",
  Address.fromString("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2")
);
WHITELIST_TOKENS.set(
  "USDT",
  Address.fromString("0xdac17f958d2ee523a2206206994597c13d831ec7")
);
WHITELIST_TOKENS.set(
  "DAI",
  Address.fromString("0x6b175474e89094c44da98b954eedeac495271d0f")
);
WHITELIST_TOKENS.set(
  "USDC",
  Address.fromString("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48")
);
WHITELIST_TOKENS.set(
  "ETH",
  Address.fromString("0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee")
);
WHITELIST_TOKENS.set(
  "WBTC",
  Address.fromString("0x2260fac5e5542a773aa44fbcfedf7c193bc2c599")
);
WHITELIST_TOKENS.set(
  "EURS",
  Address.fromString("0xdb25f211ab05b1c97d595516f45794528a807ad8")
);
WHITELIST_TOKENS.set(
  "LINK",
  Address.fromString("0x514910771af9ca656af840dff83e8264ecf986ca")
);
