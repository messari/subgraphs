import { Address, TypedMap } from "@graphprotocol/graph-ts";

export const NETWORK_STRING = "moonriver";
export const NETWORK_CHAIN_ID = 1285;
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
  "0x98878B06940aE243284CA214f92Bb71a2b032B8A"
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
  Address.fromString("0xAA30eF758139ae4a7f798112902Bf6d65612045f") //Solarbeam
);
UNISWAP_ROUTER_ADDRESS.set(
  "routerV2",
  Address.fromString("0xAA30eF758139ae4a7f798112902Bf6d65612045f")
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
  Address.fromString("0x98878B06940aE243284CA214f92Bb71a2b032B8A")
);
WHITELIST_TOKENS.set(
  "ETH",
  Address.fromString("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE")
);
WHITELIST_TOKENS.set(
  "USDT",
  Address.fromString("0xB44a9B6905aF7c801311e8F4E76932ee959c663C")
);
WHITELIST_TOKENS.set(
  "DAI",
  Address.fromString("0x80A16016cC4A2E6a2CACA8a4a498b1699fF0f844")
);
WHITELIST_TOKENS.set(
  "USDC",
  Address.fromString("0xE3F5a90F9cb311505cd691a46596599aA1A0AD7D")
);
WHITELIST_TOKENS.set(
  "WBTC",
  Address.fromString("0x6aB6d61428fde76768D7b45D8BFeec19c6eF91A8")
);
WHITELIST_TOKENS.set(
  "LINK",
  Address.fromString("0x8b12Ac23BFe11cAb03a634C1F117D64a7f2cFD3e")
);
WHITELIST_TOKENS.set(
  "CRV",
  Address.fromString("0xFEa7a6a0B346362BF88A9e4A88416B77a57D6c2A")
);
