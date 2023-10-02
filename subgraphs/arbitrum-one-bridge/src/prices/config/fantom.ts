/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-unused-vars */
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Configurations, OracleConfig, OracleContract } from "../common/types";

export const NETWORK_STRING = "fantom";

///////////////////////////////////////////////////////////////////////////
///////////////////// CALCULATIONS/ORACLE CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_CONTRACT_ADDRESS = new OracleContract(
  "0x57aa88a0810dfe3f9b71a9b179dd8bf5f956c46a",
  17091856
);
export const CHAIN_LINK_CONTRACT_ADDRESS = new OracleContract();
export const AAVE_ORACLE_CONTRACT_ADDRESS = new OracleContract();
export const SUSHISWAP_CALCULATIONS_ADDRESS = new OracleContract(
  "0x44536de2220987d098d1d29d3aafc7f7348e9ee4",
  3809480
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_CALCULATIONS_ADDRESS = new OracleContract(
  "0x0b53e9df372e72d8fdcdbedfbb56059957a37128",
  27067399
);

export const CURVE_REGISTRY_ADDRESSES: OracleContract[] = [
  new OracleContract("0x0f854ea9f38cea4b1c2fc79047e9d0134419d5d6", 5655918),
  new OracleContract("0x4fb93d7d320e8a263f22f62c2059dfc2a8bcbc4c", 27552509),
];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// UNISWAP FORKS CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_FORKS_ROUTER_ADDRESSES: OracleContract[] = [
  new OracleContract("0xbe4fc72f8293f9d3512d58b969c98c3f676cb957", 3796241), // Uniswap v2
  new OracleContract("0x16327e3fbdaca3bcf7e38f5af2599d2ddc33ae52", 4250168), // Spiritswap
  new OracleContract("0x1b02da8cb0d097eb8d57a175b88c7d8b47997506", 2457904), // Sushiswap
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
  network(): string {
    return NETWORK_STRING;
  }

  yearnLens(): OracleContract {
    return YEARN_LENS_CONTRACT_ADDRESS;
  }
  chainLink(): OracleContract {
    return CHAIN_LINK_CONTRACT_ADDRESS;
  }
  yearnLensBlacklist(): Address[] {
    return YEARN_LENS_BLACKLIST;
  }

  aaveOracle(): OracleContract {
    return AAVE_ORACLE_CONTRACT_ADDRESS;
  }
  aaveOracleBlacklist(): Address[] {
    return AAVE_ORACLE_BLACKLIST;
  }

  curveCalculations(): OracleContract {
    return CURVE_CALCULATIONS_ADDRESS;
  }
  curveCalculationsBlacklist(): Address[] {
    return CURVE_CALCULATIONS_BLACKSLIST;
  }

  sushiCalculations(): OracleContract {
    return SUSHISWAP_CALCULATIONS_ADDRESS;
  }
  sushiCalculationsBlacklist(): Address[] {
    return SUSHI_CALCULATIONS_BLACKSLIST;
  }

  uniswapForks(): OracleContract[] {
    return UNISWAP_FORKS_ROUTER_ADDRESSES;
  }
  curveRegistry(): OracleContract[] {
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

  getOracleOverride(
    tokenAddr: Address | null,
    block: ethereum.Block | null
  ): OracleConfig | null {
    return null;
  }
}
