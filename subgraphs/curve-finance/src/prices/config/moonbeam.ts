/* eslint-disable @typescript-eslint/no-magic-numbers */

import { Address, BigInt, TypedMap } from "@graphprotocol/graph-ts";
import { Configurations, ContractInfo, TokenInfo } from "../common/types";

export const NETWORK_STRING = "moonbeam";

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_REGISTRY_ADDRESSES = [
  ContractInfo.set(
    Address.fromString("0xc2b1df84112619d190193e48148000e3990bf627"),
    BigInt.fromI32(1452049)
  ),
];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// UNISWAP FORKS CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////
export const UNISWAP_FORKS_ROUTER_ADDRESSES = [
  ContractInfo.set(
    Address.fromString("0x96b244391d98b62d19ae89b1a4dccf0fc56970c7"), // BeamSwap
    BigInt.fromI32(199158)
  ),
  ContractInfo.set(
    Address.fromString("0x1b02da8cb0d097eb8d57a175b88c7d8b47997506"), // SushiSwap
    BigInt.fromI32(503734)
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

export const HARDCODED_STABLES: Address[] = [
  Address.fromString("0x14df360966a1c4582d2b18edbdae432ea0a27575"), // Axelar Wrapped DAI
  Address.fromString("0xca01a1d0993565291051daff390892518acfad3a"), // Axelar Wrapped USDC
  Address.fromString("0xdfd74af792bc6d45d1803f425ce62dd16f8ae038"), // Axelar Wrapped USDT
  Address.fromString("0x765277eebeca2e31912c9946eae1021199b39c61"), // DAI
  Address.fromString("0x81ecac0d6be0550a00ff064a4f9dd2400585fe9c"), // USDT  (Celer)
  Address.fromString("0x8e70cd5b4ff3f62659049e74b6649c6603a0e594"), // USDT
  Address.fromString("0xc234a67a4f840e61ade794be47de455361b52413"), // DAI
];

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// HELPERS /////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const WHITELISTED_TOKENS = new TypedMap<string, TokenInfo>();

WHITELISTED_TOKENS.set(
  "USDC",
  TokenInfo.set(
    "USDC",
    6,
    Address.fromString("0x818ec0a7fe18ff94269904fced6ae3dae6d6dc0b")
  )
);

WHITELISTED_TOKENS.set(
  "USDT",
  TokenInfo.set(
    "USDT",
    6,
    Address.fromString("0xefaeee334f0fd1712f9a8cc375f427d9cdd40d73")
  )
);

WHITELISTED_TOKENS.set(
  "DAI",
  TokenInfo.set(
    "DAI",
    18,
    Address.fromString("0x765277eebeca2e31912c9946eae1021199b39c61")
  )
);

WHITELISTED_TOKENS.set(
  "WETH",
  TokenInfo.set(
    "WETH",
    18,
    Address.fromString("0x30d2a9f5fdf90ace8c17952cbb4ee48a55d916a7")
  )
);

WHITELISTED_TOKENS.set(
  "NATIVE_TOKEN",
  TokenInfo.set(
    "GLMR",
    18,
    Address.fromString("0xacc15dc74880c9944775448304b263d191c6077f")
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
    return null;
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
