import { Address, TypedMap } from "@graphprotocol/graph-ts";

export const NETWORK_STRING = "cronos";
export const NETWORK_CHAIN_ID = 25;
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
  Address.fromString("0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae")
);
UNISWAP_ROUTER_ADDRESS.set(
  "routerV2",
  Address.fromString("0xcd7d16fB918511BF7269eC4f48d61D79Fb26f918")
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
  Address.fromString("0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23")
);
WHITELIST_TOKENS.set(
  "ETH",
  Address.fromString("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE")
);
WHITELIST_TOKENS.set(
  "USDT",
  Address.fromString("0x66e428c3f67a68878562e79A0234c1F83c208770")
);
WHITELIST_TOKENS.set(
  "DAI",
  Address.fromString("0xF2001B145b43032AAF5Ee2884e456CCd805F677D")
);
WHITELIST_TOKENS.set(
  "USDC",
  Address.fromString("0xc21223249CA28397B4B6541dfFaEcC539BfF0c59")
);
WHITELIST_TOKENS.set(
  "WBTC",
  Address.fromString("0x062E66477Faf219F25D27dCED647BF57C3107d52")
);
WHITELIST_TOKENS.set(
  "LINK",
  Address.fromString("0xBc6f24649CCd67eC42342AccdCECCB2eFA27c9d9")
);
WHITELIST_TOKENS.set(
  "CRV",
  Address.fromString("0x0000000000000000000000000000000000000000")
);
