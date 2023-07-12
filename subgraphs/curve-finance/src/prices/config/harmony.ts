/* eslint-disable @typescript-eslint/no-magic-numbers */

import { Address, BigInt, TypedMap } from "@graphprotocol/graph-ts";
import { Configurations, ContractInfo, TokenInfo } from "../common/types";

export const NETWORK_STRING = "harmony";

///////////////////////////////////////////////////////////////////////////
///////////////////// CALCULATIONS/ORACLE CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const AAVE_ORACLE_CONTRACT_ADDRESS = ContractInfo.set(
  Address.fromString("0x3c90887ede8d65ccb2777a5d577beab2548280ad"),
  BigInt.fromI32(23930344)
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_REGISTRY_ADDRESSES = [
  ContractInfo.set(
    Address.fromString("0x0a53fada2d943057c47a301d25a4d9b3b8e01e8e"),
    BigInt.fromI32(18003250)
  ),
];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// UNISWAP FORKS CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_FORKS_ROUTER_ADDRESSES = [
  ContractInfo.set(
    Address.fromString("0x1b02da8cb0d097eb8d57a175b88c7d8b47997506"), // SushiSwap
    BigInt.fromI32(11256069)
  ),
];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// BLACKLISTED TOKENS ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_BLACKLIST: Address[] = [];
export const INCH_ORACLE_BLACKLIST: Address[] = [];
export const AAVE_ORACLE_BLACKLIST: Address[] = [];
export const CURVE_CALCULATIONS_BLACKSLIST: Address[] = [];
export const SUSHI_CALCULATIONS_BLACKSLIST: Address[] = [];

///////////////////////////////////////////////////////////////////////////
//////////////////////////// HARDCODED STABLES ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const HARDCODED_STABLES: Address[] = [];

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// HELPERS /////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const WHITELISTED_TOKENS = new TypedMap<string, TokenInfo>();

WHITELISTED_TOKENS.set(
  "USDC",
  TokenInfo.set(
    "USDC",
    6,
    Address.fromString("0x985458e523db3d53125813ed68c274899e9dfab4")
  )
);

WHITELISTED_TOKENS.set(
  "USDT",
  TokenInfo.set(
    "USDT",
    6,
    Address.fromString("0x3c2b8be99c50593081eaa2a724f0b8285f5aba8f")
  )
);

WHITELISTED_TOKENS.set(
  "DAI",
  TokenInfo.set(
    "DAI",
    18,
    Address.fromString("0xef977d2f931c1978db5f6747666fa1eacb0d0339")
  )
);

WHITELISTED_TOKENS.set(
  "WETH",
  TokenInfo.set(
    "WETH",
    18,
    Address.fromString("0x6983d1e6def3690c4d616b13597a09e6193ea013")
  )
);

WHITELISTED_TOKENS.set(
  "NATIVE_TOKEN",
  TokenInfo.set(
    "WONE",
    18,
    Address.fromString("0xcf664087a5bb0237a0bad6742852ec6c8d69a27a")
  )
);

export class config implements Configurations {
  yearnLens(): ContractInfo | null {
    return null;
  }
  yearnLensBlacklist(): Address[] {
    return YEARN_LENS_BLACKLIST;
  }

  inchOracle(): ContractInfo | null {
    return null;
  }
  inchOracleBlacklist(): Address[] {
    return INCH_ORACLE_BLACKLIST;
  }

  chainLink(): ContractInfo | null {
    return null;
  }

  aaveOracle(): ContractInfo | null {
    return AAVE_ORACLE_CONTRACT_ADDRESS;
  }
  aaveOracleBlacklist(): Address[] {
    return AAVE_ORACLE_BLACKLIST;
  }

  curveCalculations(): ContractInfo | null {
    return null;
  }
  curveCalculationsBlacklist(): Address[] {
    return CURVE_CALCULATIONS_BLACKSLIST;
  }

  sushiCalculations(): ContractInfo | null {
    return null;
  }
  sushiCalculationsBlacklist(): Address[] {
    return SUSHI_CALCULATIONS_BLACKSLIST;
  }

  uniswapForks(): ContractInfo[] {
    return UNISWAP_FORKS_ROUTER_ADDRESSES;
  }
  curveRegistry(): ContractInfo[] {
    return CURVE_REGISTRY_ADDRESSES;
  }

  hardcodedStables(): Address[] {
    return HARDCODED_STABLES;
  }

  whitelistedTokens(): TypedMap<string, TokenInfo> {
    return WHITELISTED_TOKENS;
  }
}
