/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Configurations, OracleContract } from "../common/types";

export const NETWORK_STRING = "optimism";

///////////////////////////////////////////////////////////////////////////
///////////////////// CALCULATIONS/ORACLE CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_CONTRACT_ADDRESS = new OracleContract(
  "0xb082d9f4734c535d9d80536f7e87a6f4f471bf65",
  18109291
);
export const CHAIN_LINK_CONTRACT_ADDRESS = new OracleContract();
export const AAVE_ORACLE_CONTRACT_ADDRESS = new OracleContract(
  "0xd81eb3728a631871a7ebbad631b5f424909f0c77",
  4365625
);
export const SUSHISWAP_CALCULATIONS_ADDRESS = new OracleContract(
  "0x5fd3815dcb668200a662114fbc9af13ac0a55b4d",
  18216910
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_CALCULATIONS_ADDRESS = new OracleContract(
  "0x0ffe8434eae67c9838b12c3cd11ac4005daa7227",
  18368996
);

export const CURVE_REGISTRY_ADDRESSES: OracleContract[] = [
  new OracleContract("0xc5cfada84e902ad92dd40194f0883ad49639b023", 2373837),
  new OracleContract("0x445fe580ef8d70ff569ab36e80c647af338db351", 3729171),
];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// UNISWAP FORKS CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_FORKS_ROUTER_ADDRESSES: OracleContract[] = [
  new OracleContract("0x9c12939390052919af3155f41bf4160fd3666a6f", 19702709), // Velodrame
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
  "0x4200000000000000000000000000000000000042"
);
export const WETH_ADDRESS = Address.fromString(
  "0x4200000000000000000000000000000000000006"
);
export const USDC_ADDRESS = Address.fromString(
  "0x7f5c764cbc14f9669b88837ca1490cca17c31607"
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
}
