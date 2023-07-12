/* eslint-disable @typescript-eslint/no-magic-numbers */

import { Address, BigInt, TypedMap } from "@graphprotocol/graph-ts";
import { Configurations, ContractInfo, TokenInfo } from "../common/types";

export const NETWORK_STRING: string = "xdai";

///////////////////////////////////////////////////////////////////////////
///////////////////// CALCULATIONS/ORACLE CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const INCH_ORACLE_CONTRACT_ADDRESS = ContractInfo.set(
  Address.fromString("0x142db045195cecabe415161e1df1cf0337a4d02e"),
  BigInt.fromI32(19731993)
);
///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_REGISTRY_ADDRESSES = [
  ContractInfo.set(
    Address.fromString("0x55e91365697eb8032f98290601847296ec847210"),
    BigInt.fromI32(20754886)
  ),
  ContractInfo.set(
    Address.fromString("0x8a4694401be8f8fccbc542a3219af1591f87ce17"),
    BigInt.fromI32(23334728)
  ),
];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// UNISWAP FORKS CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_FORKS_ROUTER_ADDRESSES = [
  ContractInfo.set(
    Address.fromString("0x1b02da8cb0d097eb8d57a175b88c7d8b47997506"), // SushiSwap
    BigInt.fromI32(14735910)
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
    Address.fromString("0xddafbb505ad214d7b80b1f830fccc89b60fb7a83")
  )
);

WHITELISTED_TOKENS.set(
  "USDT",
  TokenInfo.set(
    "USDT",
    6,
    Address.fromString("0x4ecaba5870353805a9f068101a40e0f32ed605c6")
  )
);

WHITELISTED_TOKENS.set(
  "DAI",
  TokenInfo.set(
    "DAI",
    18,
    Address.fromString("0xe91d153e0b41518a2ce8dd3d7944fa863463a97d")
  )
);

WHITELISTED_TOKENS.set(
  "WETH",
  TokenInfo.set(
    "WETH",
    18,
    Address.fromString("0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1")
  )
);

WHITELISTED_TOKENS.set(
  "NATIVE_TOKEN",
  TokenInfo.set(
    "GNOSIS",
    18,
    Address.fromString("0x9c58bacc331c9aa871afd802db6379a98e80cedb")
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
    return INCH_ORACLE_CONTRACT_ADDRESS;
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
