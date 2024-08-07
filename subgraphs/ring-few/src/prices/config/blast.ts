/* eslint-disable @typescript-eslint/no-unused-vars */
import * as constants from "../common/constants";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Configurations, OracleConfig, OracleContract } from "../common/types";

export const NETWORK_STRING = "blast-mainnet";

///////////////////////////////////////////////////////////////////////////
///////////////////// CALCULATIONS/ORACLE CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_CONTRACT_ADDRESS = new OracleContract();
export const CHAIN_LINK_CONTRACT_ADDRESS = new OracleContract();
export const AAVE_ORACLE_CONTRACT_ADDRESS = new OracleContract();
export const SUSHISWAP_CALCULATIONS_ADDRESS = new OracleContract();

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_CALCULATIONS_ADDRESS = new OracleContract();

export const CURVE_REGISTRY_ADDRESSES: OracleContract[] = [];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// UNISWAP FORKS CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_FORKS_ROUTER_ADDRESSES: OracleContract[] = [
  new OracleContract("0x7001f706acb6440d17cbfad63fa50a22d51696ff", 163568), // Ring Swap v2
  new OracleContract("0x98994a9a7a2570367554589189dc9772241650f6", 157110), // Thruster v2 Router1
  new OracleContract("0x44889b52b71e60de6ed7de82e2939fcc52fb2b4e", 157501), // Thruster v2 Router2
  new OracleContract("0x54cf3d259a06601b5bc45f61a16443ed5404dd64", 285726), // Sushiswap v2 Router02
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

export const HARDCODED_STABLES: Address[] = [
  Address.fromString("0x4300000000000000000000000000000000000003"),
];

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// HELPERS /////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const USDC_TOKEN_DECIMALS = BigInt.fromI32(18);

export const ETH_ADDRESS = constants.NULL.TYPE_ADDRESS;
export const WETH_ADDRESS = Address.fromString(
  "0x4300000000000000000000000000000000000004"
);
export const USDC_ADDRESS = Address.fromString(
  "0x4300000000000000000000000000000000000003"
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
