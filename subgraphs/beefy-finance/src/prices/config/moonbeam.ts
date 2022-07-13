import { Address, TypedMap } from "@graphprotocol/graph-ts";

export const NETWORK_STRING = "moonbeam";
export const NETWORK_CHAIN_ID = 1284;
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
  "0x0000000000000000000000000000000000000000"
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
  Address.fromString("0x70085a09D30D6f8C4ecF6eE10120d1847383BB57") //Stellaswap
);
UNISWAP_ROUTER_ADDRESS.set(
  "routerV2",
  Address.fromString("0x96b244391D98B62D19aE89b1A4dCcf0fc56970C7") //Beamswap
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
  Address.fromString("0xAcc15dC74880C9944775448304B263D191c6077F")
);
WHITELIST_TOKENS.set(
  "ETH",
  Address.fromString("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE")
);
WHITELIST_TOKENS.set(
  "USDT",
  Address.fromString("0x8e70cD5B4Ff3f62659049e74b6649c6603A0E594")
);
WHITELIST_TOKENS.set(
  "DAI",
  Address.fromString("0x765277EebeCA2e31912C9946eAe1021199B39C61")
);
WHITELIST_TOKENS.set(
  "USDC",
  Address.fromString("0x8f552a71EFE5eeFc207Bf75485b356A0b3f01eC9")
);
WHITELIST_TOKENS.set(
  "WBTC",
  Address.fromString("0x1DC78Acda13a8BC4408B207c9E48CDBc096D95e0")
);
WHITELIST_TOKENS.set(
  "LINK",
  Address.fromString("0x0000000000000000000000000000000000000000")
);
WHITELIST_TOKENS.set(
  "CRV",
  Address.fromString("0x0000000000000000000000000000000000000000")
);
