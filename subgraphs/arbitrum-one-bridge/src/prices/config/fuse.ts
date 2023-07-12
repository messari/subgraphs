/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-unused-vars */
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Configurations, OracleConfig, OracleContract } from "../common/types";

export const NETWORK_STRING = "fuse";

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
  new OracleContract("0xe3f85aad0c8dd7337427b9df5d0fb741d65eeeb5", 15645719), // Voltage Finance
  new OracleContract("0x1b02da8cb0d097eb8d57a175b88c7d8b47997506", 12936314), // Sushiswap
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
  "0xa722c13135930332eb3d749b2f0906559d2c5b99"
);
export const WETH_ADDRESS = Address.fromString(
  "0x0be9e53fd7edac9f859882afdda116645287c629" // Wrapped Fuse (WFUSE)
);
export const USDC_ADDRESS = Address.fromString(
  "0x620fd5fa44be6af63715ef4e65ddfa0387ad13f5"
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
