import { Address, TypedMap } from "@graphprotocol/graph-ts";

export const NETWORK_STRING = "avalanche";
export const NETWORK_CHAIN_ID = 43114;
export const NETWORK_SUFFIX = "-" + NETWORK_CHAIN_ID.toString();

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_CALCULATIONS_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);
export const CURVE_REGISTRY_ADDRESS = Address.fromString(
  "0x8474ddbe98f5aa3179b3b3f5942d724afcdec9f6"
);
export const CURVE_POOL_REGISTRY_ADDRESS = Address.fromString(
  "0x8474ddbe98f5aa3179b3b3f5942d724afcdec9f6"
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// SUSHISWAP CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const SUSHISWAP_CALCULATIONS_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);
export const SUSHISWAP_WETH_ADDRESS = Address.fromString(
  "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7"
);

export const SUSHISWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
SUSHISWAP_ROUTER_ADDRESS.set(
  "routerV1",
  Address.fromString("0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106")
);
SUSHISWAP_ROUTER_ADDRESS.set(
  "routerV2",
  Address.fromString("0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506")
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// UNISWAP CONTRACT ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_ROUTER_ADDRESS = new TypedMap<string, Address>();
UNISWAP_ROUTER_ADDRESS.set(
  "routerV1",
  Address.fromString("0x60aE616a2155Ee3d9A68541Ba4544862310933d4") //Trader Joe
);
UNISWAP_ROUTER_ADDRESS.set(
  "routerV2",
  Address.fromString("0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106") //Pangolin
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
  Address.fromString("0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7")
);
WHITELIST_TOKENS.set(
  "ETH",
  Address.fromString("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE")
);
WHITELIST_TOKENS.set(
  "USDT",
  Address.fromString("0xc7198437980c041c805A1EDcbA50c1Ce5db95118")
);
WHITELIST_TOKENS.set(
  "DAI",
  Address.fromString("0xd586E7F844cEa2F87f50152665BCbc2C279D8d70")
);
WHITELIST_TOKENS.set(
  "USDC",
  Address.fromString("0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E")
);
WHITELIST_TOKENS.set(
  "WBTC",
  Address.fromString("0x50b7545627a5162F82A992c33b87aDc75187B218")
);
WHITELIST_TOKENS.set(
  "LINK",
  Address.fromString("0x5947BB275c521040051D82396192181b413227A3")
);
WHITELIST_TOKENS.set(
  "CRV",
  Address.fromString("0x249848BeCA43aC405b8102Ec90Dd5F22CA513c06")
);
