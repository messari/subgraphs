import { Address, TypedMap, BigInt } from "@graphprotocol/graph-ts";

export const NETWORK_STRING = "avalanche";

export const CURVE_REGISTRY_ADDRESSES: Address[] = [
  Address.fromString("0x8474DdbE98F5aA3179B3B3F5942D724aFcdec9f6"),
  Address.fromString("0x90f421832199e93d01b64DaF378b183809EB0988"),
];

///////////////////////////////////////////////////////////////////////////
///////////////////////////// AAVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const AAVE_ORACLE_CONTRACT_ADDRESS = Address.fromString(
  "0xEBd36016B3eD09D4693Ed4251c67Bd858c3c7C9C"
);

export const ETH_ADDRESS = Address.fromString(
  "0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab"
);
export const WETH_ADDRESS = Address.fromString(
  "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7"
);
export const USDC_ADDRESS = Address.fromString(
  "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e"
);

export const UNISWAP_FORKS_ROUTER_ADDRESSES: Address[] = [
  Address.fromString("0x60aE616a2155Ee3d9A68541Ba4544862310933d4"), // TraderJOE
  Address.fromString("0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106"), // Pangolin
  Address.fromString("0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"), // Sushiswap
];

export const USDC_TOKEN_DECIMALS = BigInt.fromI32(6);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// SUSHISWAP CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const SUSHISWAP_CALCULATIONS_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000000");
export const SUSHISWAP_ROUTER_ADDRESS_V1 = Address.fromString("0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106");
export const SUSHISWAP_ROUTER_ADDRESS_V2 = Address.fromString("0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506");

///////////////////////////////////////////////////////////////////////////
///////////////////////////// TRADERJOE CONTRACT //////////////////////////
///////////////////////////////////////////////////////////////////////////

export const TRADERJOE_ROUTER_ADDRESS_V1 = Address.fromString("0x60aE616a2155Ee3d9A68541Ba4544862310933d4");
export const TRADERJOE_ROUTER_ADDRESS_V2 = Address.fromString("0x0000000000000000000000000000000000000000");

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// HELPERS /////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const WHITELIST_TOKENS = new TypedMap<string, Address>();
WHITELIST_TOKENS.set(
  "WAVAX",
  Address.fromString("0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7")
);
WHITELIST_TOKENS.set(
  "AVAX",
  Address.fromString("0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7")
);
WHITELIST_TOKENS.set(
  "ETH",
  Address.fromString("0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB")
);
WHITELIST_TOKENS.set(
  "USDC",
  Address.fromString("0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664")
);

export const BASE_TOKEN = "AVAX";
export const WRAPPED_BASE_TOKEN = "WAVAX";
