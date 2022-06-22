import { Address, TypedMap } from "@graphprotocol/graph-ts";

export const NETWORK_STRING = "heco";
export const NETWORK_CHAIN_ID = 128;
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
  Address.fromString("0xE592427A0AEce92De3Edee1F18E0157C05861564") //TODO: check MDEX discord
);
UNISWAP_ROUTER_ADDRESS.set(
  "routerV2",
  Address.fromString("0x0000000000000000000000000000000000000000")
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
  Address.fromString("0x5545153CCFcA01fbd7Dd11C0b23ba694D9509A6F")
);
WHITELIST_TOKENS.set(
  "ETH",
  Address.fromString("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE")
);
WHITELIST_TOKENS.set(
  "USDT",
  Address.fromString("0xa71EdC38d189767582C38A3145b5873052c3e47a")
);
WHITELIST_TOKENS.set(
  "DAI",
  Address.fromString("0x3D760a45D0887DFD89A2F5385a236B29Cb46ED2a")
);
WHITELIST_TOKENS.set(
  "USDC",
  Address.fromString("0x9362Bbef4B8313A8Aa9f0c9808B80577Aa26B73B")
);
WHITELIST_TOKENS.set(
  "WBTC",
  Address.fromString("0x70D171d269D964d14aF9617858540061e7bE9EF1")
);
WHITELIST_TOKENS.set(
  "LINK",
  Address.fromString("0x9e004545c59D359F6B7BFB06a26390b087717b42")
);
WHITELIST_TOKENS.set(
  "CRV",
  Address.fromString("0x6BCE534a02f8347f747124082Ef3e35Dd696748D")
);
