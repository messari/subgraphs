import * as constants from "../common/constants";
import { Configurations } from "../common/types";
import { Address, BigInt } from "@graphprotocol/graph-ts";

export const NETWORK_STRING = "fantom";

///////////////////////////////////////////////////////////////////////////
///////////////////// CALCULATIONS/ORACLE CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_CONTRACT_ADDRESS = Address.fromString(
  "0x57aa88a0810dfe3f9b71a9b179dd8bf5f956c46a"
);
export const CHAIN_LINK_CONTRACT_ADDRESS = constants.NULL.TYPE_ADDRESS;
export const AAVE_ORACLE_CONTRACT_ADDRESS = constants.NULL.TYPE_ADDRESS;
export const SUSHISWAP_CALCULATIONS_ADDRESS = Address.fromString(
  "0x44536de2220987d098d1d29d3aafc7f7348e9ee4"
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_CALCULATIONS_ADDRESS = Address.fromString(
  "0x0b53e9df372e72d8fdcdbedfbb56059957a37128"
);

export const CURVE_REGISTRY_ADDRESSES: Address[] = [
  Address.fromString("0x0f854EA9F38ceA4B1c2FC79047E9D0134419D5d6"),
  Address.fromString("0x4fb93D7d320E8A263F22f62C2059dFC2A8bCbC4c"),
];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// UNISWAP FORKS CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_FORKS_ROUTER_ADDRESSES: Address[] = [
  Address.fromString("0xbe4fc72f8293f9d3512d58b969c98c3f676cb957"), // Uniswap
  Address.fromString("0x16327E3FbDaCA3bcF7E38F5Af2599D2DDc33aE52"), // Spiritswap
  Address.fromString("0x1b02da8cb0d097eb8d57a175b88c7d8b47997506"), // Sushiswap
];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// BLACKLISTED TOKENS ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_BLACKLIST: Address[] = [];
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

export const USDC_TOKEN_DECIMALS = BigInt.fromI32(6);

export const ETH_ADDRESS = Address.fromString(
  "0x658b0c7613e890ee50b8c4bc6a3f41ef411208ad"
);
export const WETH_ADDRESS = Address.fromString(
  "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83"
);
export const USDC_ADDRESS = Address.fromString(
  "0x04068da6c83afcfa0e13ba15a6696662335d5b75"
);

export class config implements Configurations {
  yearnLens(): Address {
    return YEARN_LENS_CONTRACT_ADDRESS;
  }
  chainLink(): Address {
    return CHAIN_LINK_CONTRACT_ADDRESS;
  }
  yearnLensBlacklist(): Address[] {
    return YEARN_LENS_BLACKLIST;
  }

  aaveOracle(): Address {
    return AAVE_ORACLE_CONTRACT_ADDRESS;
  }
  aaveOracleBlacklist(): Address[] {
    return AAVE_ORACLE_BLACKLIST;
  }

  curveCalculations(): Address {
    return CURVE_CALCULATIONS_ADDRESS;
  }
  curveCalculationsBlacklist(): Address[] {
    return CURVE_CALCULATIONS_BLACKSLIST;
  }

  sushiCalculations(): Address {
    return SUSHISWAP_CALCULATIONS_ADDRESS;
  }
  sushiCalculationsBlacklist(): Address[] {
    return SUSHI_CALCULATIONS_BLACKSLIST;
  }

  uniswapForks(): Address[] {
    return UNISWAP_FORKS_ROUTER_ADDRESSES;
  }
  curveRegistry(): Address[] {
    return CURVE_REGISTRY_ADDRESSES;
  }

  hardcodedStables(): Address[] {
    return HARDCODED_STABLES;
  }

  ethAddress(): Address {
    return ETH_ADDRESS;
  }
  wethAddress(): Address {
    return WETH_ADDRESS;
  }
  usdcAddress(): Address {
    return USDC_ADDRESS;
  }

  usdcTokenDecimals(): BigInt {
    return USDC_TOKEN_DECIMALS;
  }
}
