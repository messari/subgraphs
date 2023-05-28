/* eslint-disable @typescript-eslint/no-magic-numbers */

import { BigInt, Address, TypedMap } from "@graphprotocol/graph-ts";
import { Configurations, ContractInfo, TokenInfo } from "../common/types";

export const NETWORK_STRING = "matic";

///////////////////////////////////////////////////////////////////////////
///////////////////// CALCULATIONS/ORACLE CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const INCH_ORACLE_CONTRACT_ADDRESS = ContractInfo.set(
  Address.fromString("0x7f069df72b7a39bce9806e3afaf579e54d8cf2b9"),
  BigInt.fromI32(15030523)
);

export const AAVE_ORACLE_CONTRACT_ADDRESS = ContractInfo.set(
  Address.fromString("0xb023e699f5a33916ea823a16485e259257ca8bd1"),
  BigInt.fromI32(25825996)
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_REGISTRY_ADDRESSES = [
  ContractInfo.set(
    Address.fromString("0x094d12e5b541784701fd8d65f11fc0598fbc6332"),
    BigInt.fromI32(13991825)
  ),
  ContractInfo.set(
    Address.fromString("0x47bb542b9de58b970ba50c9dae444ddb4c16751a"),
    BigInt.fromI32(23556360)
  ),
];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// UNISWAP FORKS CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_FORKS_ROUTER_ADDRESSES = [
  ContractInfo.set(
    Address.fromString("0xa5e0829caced8ffdd4de3c43696c57f7d7a678ff"), // QuickSwap
    BigInt.fromI32(4931900)
  ),
  ContractInfo.set(
    Address.fromString("0x1b02da8cb0d097eb8d57a175b88c7d8b47997506"), // SushiSwap
    BigInt.fromI32(11333235)
  ),
];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// BLACKLISTED TOKENS ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_BLACKLIST: Address[] = [];
export const INCH_ORACLE_BLACKLIST: Address[] = [
  Address.fromString("0xf8a57c1d3b9629b77b6726a042ca48990a84fb49"), // btcCRV
  Address.fromString("0xdad97f7713ae9437fa9249920ec8507e5fbb23d3"), // Curve USD-BTC-ETH
];
export const AAVE_ORACLE_BLACKLIST: Address[] = [];
export const CURVE_CALCULATIONS_BLACKSLIST: Address[] = [];
export const SUSHI_CALCULATIONS_BLACKSLIST: Address[] = [];

///////////////////////////////////////////////////////////////////////////
//////////////////////////// HARDCODED STABLES ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const HARDCODED_STABLES: Address[] = [
  Address.fromString("0x1a13f4ca1d028320a707d99520abfefca3998b7f"), // Aave Matic Market USDC
  Address.fromString("0x27f8d03b3a2196956ed754badc28d73be8830a6e"), // Aave Matic Market DAI
  Address.fromString("0x60d55f02a771d515e077c9c2403a1ef324885cec"), // Aave Matic Market USDT
  Address.fromString("0xe2aa7db6da1dae97c5f5c6914d285fbfcc32a128"), // PAR Stablecoin (PAR)
  Address.fromString("0x7bdf330f423ea880ff95fc41a280fd5ecfd3d09f"), // Euro Tether (PoS)
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
    Address.fromString("0x2791bca1f2de4661ed88a30c99a7a9449aa84174")
  )
);

WHITELISTED_TOKENS.set(
  "USDT",
  TokenInfo.set(
    "USDT",
    6,
    Address.fromString("0xc2132d05d31c914a87c6611c10748aeb04b58e8f")
  )
);

WHITELISTED_TOKENS.set(
  "DAI",
  TokenInfo.set(
    "DAI",
    18,
    Address.fromString("0x8f3cf7ad23cd3cadbd9735aff958023239c6a063")
  )
);

WHITELISTED_TOKENS.set(
  "WETH",
  TokenInfo.set(
    "WETH",
    18,
    Address.fromString("0x7ceb23fd6bc0add59e62ac25578270cff1b9f619")
  )
);

WHITELISTED_TOKENS.set(
  "NATIVE_TOKEN",
  TokenInfo.set(
    "MATIC",
    18,
    Address.fromString("0x0000000000000000000000000000000000001010")
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
