import { Address, TypedMap } from "@graphprotocol/graph-ts";

export const NETWORK_STRING = "aurora";
export const NETWORK_CHAIN_ID = 1313161554;
export const NETWORK_SUFFIX = "-" + NETWORK_CHAIN_ID.toString();

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_CALCULATIONS_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);
export const CURVE_REGISTRY_ADDRESS = Address.fromString(
  "0x5b5cfe992adac0c9d48e05854b2d91c73a003858"
);
export const CURVE_POOL_REGISTRY_ADDRESS = Address.fromString(
  "0x5b5cfe992adac0c9d48e05854b2d91c73a003858"
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
///////////////////////////// UNISWAP CONTRACT ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
UNISWAP_ROUTER_ADDRESS.set(
  "routerV1",
  Address.fromString("0x2CB45Edb4517d5947aFdE3BEAbF95A582506858B")
);
UNISWAP_ROUTER_ADDRESS.set(
  "routerV2",
  Address.fromString("0x2CB45Edb4517d5947aFdE3BEAbF95A582506858B")
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
  Address.fromString("0xC9BdeEd33CD01541e1eeD10f90519d2C06Fe3feB")
);
WHITELIST_TOKENS.set(
  "ETH",
  Address.fromString("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE")
);
WHITELIST_TOKENS.set(
  "USDT",
  Address.fromString("0x4988a896b1227218e4A686fdE5EabdcAbd91571f")
);
WHITELIST_TOKENS.set(
  "DAI",
  Address.fromString("0xe3520349F477A5F6EB06107066048508498A291b")
);
WHITELIST_TOKENS.set(
  "USDC",
  Address.fromString("0xB12BFcA5A55806AaF64E99521918A4bf0fC40802")
);
WHITELIST_TOKENS.set(
  "WBTC",
  Address.fromString("0xF4eB217Ba2454613b15dBdea6e5f22276410e89e")
);
WHITELIST_TOKENS.set(
  "LINK",
  Address.fromString("0x94190d8EF039C670c6d6B9990142e0CE2A1E3178")
);
WHITELIST_TOKENS.set(
  "CRV",
  Address.fromString("0x0000000000000000000000000000000000000000")
);
