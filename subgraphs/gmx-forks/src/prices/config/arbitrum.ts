/* eslint-disable @typescript-eslint/no-magic-numbers */

import { Address, BigInt, TypedMap } from "@graphprotocol/graph-ts";
import { Configurations, TokenInfo, ContractInfo } from "../common/types";

export const NETWORK_STRING = "arbitrum-one";

///////////////////////////////////////////////////////////////////////////
///////////////////// CALCULATIONS/ORACLE CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_CONTRACT_ADDRESS = ContractInfo.set(
  Address.fromString("0x043518ab266485dc085a1db095b8d9c2fc78e9b9"),
  BigInt.fromI32(2396321)
);

export const INCH_ORACLE_CONTRACT_ADDRESS = ContractInfo.set(
  Address.fromString("0x735247fb0a604c0adc6cab38ace16d0dba31295f"),
  BigInt.fromI32(781467)
);

export const AAVE_ORACLE_CONTRACT_ADDRESS = ContractInfo.set(
  Address.fromString("0xb56c2f0b653b2e0b10c9b928c8580ac5df02c7c7"),
  BigInt.fromI32(7740843)
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_CALCULATIONS_ADDRESS = ContractInfo.set(
  Address.fromString("0x3268c3bda100ef0ff3c2d044f23eab62c80d78d2"),
  BigInt.fromI32(11707234)
);

export const CURVE_REGISTRY_ADDRESSES = [
  ContractInfo.set(
    Address.fromString("0x445fe580ef8d70ff569ab36e80c647af338db351"),
    BigInt.fromI32(1362056)
  ),
  ContractInfo.set(
    Address.fromString("0x0e9fbb167df83ede3240d6a5fa5d40c6c6851e15"),
    BigInt.fromI32(4530115)
  ),
];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// UNISWAP FORKS CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const SUSHISWAP_CALCULATIONS_ADDRESS = ContractInfo.set(
  Address.fromString("0x5ea7e501c9a23f4a76dc7d33a11d995b13a1dd25"),
  BigInt.fromI32(2396120)
);

export const UNISWAP_FORKS_ROUTER_ADDRESSES = [
  ContractInfo.set(
    Address.fromString("0x1b02da8cb0d097eb8d57a175b88c7d8b47997506"), // SushiSwap
    BigInt.fromI32(73)
  ),
];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// BLACKLISTED TOKENS ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_BLACKLIST: Address[] = [
  Address.fromString("0x5979d7b546e38e414f7e9822514be443a4800529"), // Wrapped liquid staked Ether 2.0 token
  Address.fromString("0x3f56e0c36d275367b8c502090edf38289b3dea0d"), // Mai Stablecoin
  Address.fromString("0x64343594ab9b56e99087bfa6f2335db24c2d1f17"), // vesta stable
  Address.fromString("0xf0b5ceefc89684889e5f7e0a7775bd100fcd3709"), // digital dollar
];
export const SUSHI_CALCULATIONS_BLACKSLIST: Address[] = [
  Address.fromString("0x5979d7b546e38e414f7e9822514be443a4800529"), // Wrapped liquid staked Ether 2.0 token
];
export const CURVE_CALCULATIONS_BLACKSLIST: Address[] = [
  Address.fromString("0x5979d7b546e38e414f7e9822514be443a4800529"), // Wrapped liquid staked Ether 2.0 token
];
export const INCH_ORACLE_BLACKLIST: Address[] = [];
export const AAVE_ORACLE_BLACKLIST: Address[] = [];

///////////////////////////////////////////////////////////////////////////
//////////////////////////// HARDCODED STABLES ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const HARDCODED_STABLES: Address[] = [
  Address.fromString("0x641441c631e2f909700d2f41fd87f0aa6a6b4edb"), // dForce USD
  Address.fromString("0x8616e8ea83f048ab9a5ec513c9412dd2993bce3f"), // handleUSD
  Address.fromString("0xeb466342c4d449bc9f53a865d5cb90586f405215"), // Axelar Wrapped USDC
  Address.fromString("0x625e7708f30ca75bfd92586e17077590c60eb4cd"), // Aave Arbitrum USDC
  Address.fromString("0x6ab707aca953edaefbc4fd23ba73294241490620"), // Aave Arbitrum USDT
  Address.fromString("0x82e64f49ed5ec1bc6e43dad4fc8af9bb3a2312ee"), // Aave Arbitrum DAI
  Address.fromString("0xda10009cbd5d07dd0cecc66161fc93d7c9000da1"), // Dai Stablecoin"
  Address.fromString("0xff970a61a04b1ca14834a43f5de4533ebddb5cc8"), // USD arb1
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
    Address.fromString("0xff970a61a04b1ca14834a43f5de4533ebddb5cc8")
  )
);

WHITELISTED_TOKENS.set(
  "USDT",
  TokenInfo.set(
    "USDT",
    6,
    Address.fromString("0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9")
  )
);

WHITELISTED_TOKENS.set(
  "DAI",
  TokenInfo.set(
    "DAI",
    18,
    Address.fromString("0xda10009cbd5d07dd0cecc66161fc93d7c9000da1")
  )
);

WHITELISTED_TOKENS.set(
  "WETH",
  TokenInfo.set(
    "WETH",
    18,
    Address.fromString("0x82af49447d8a07e3bd95bd0d56f35241523fbab1")
  )
);

WHITELISTED_TOKENS.set(
  "NATIVE_TOKEN",
  TokenInfo.set(
    "ETH",
    18,
    Address.fromString("0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee")
  )
);

export class config implements Configurations {
  yearnLens(): ContractInfo | null {
    return YEARN_LENS_CONTRACT_ADDRESS;
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
    return AAVE_ORACLE_CONTRACT_ADDRESS;
  }
  aaveOracleBlacklist(): Address[] {
    return AAVE_ORACLE_BLACKLIST;
  }

  curveCalculations(): ContractInfo | null {
    return CURVE_CALCULATIONS_ADDRESS;
  }
  curveCalculationsBlacklist(): Address[] {
    return CURVE_CALCULATIONS_BLACKSLIST;
  }

  sushiCalculations(): ContractInfo | null {
    return SUSHISWAP_CALCULATIONS_ADDRESS;
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
