import { Configurations } from "../common/types";
import * as constants from "../common/constants";
import { BigInt, Address } from "@graphprotocol/graph-ts";

export const NETWORK_STRING = "matic";

///////////////////////////////////////////////////////////////////////////
///////////////////// CALCULATIONS/ORACLE CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_CONTRACT_ADDRESS = constants.NULL.TYPE_ADDRESS;
export const CHAIN_LINK_CONTRACT_ADDRESS = constants.NULL.TYPE_ADDRESS;
export const SUSHISWAP_CALCULATIONS_ADDRESS = constants.NULL.TYPE_ADDRESS;

export const AAVE_ORACLE_CONTRACT_ADDRESS = Address.fromString(
  "0xb023e699F5a33916Ea823A16485e259257cA8Bd1"
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_CALCULATIONS_ADDRESS = constants.NULL.TYPE_ADDRESS;

export const CURVE_REGISTRY_ADDRESSES: Address[] = [
  Address.fromString("0x094d12e5b541784701FD8d65F11fc0598FBC6332"),
  Address.fromString("0x47bB542B9dE58b970bA50c9dae444DDB4c16751a"),
];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// UNISWAP FORKS CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_FORKS_ROUTER_ADDRESSES: Address[] = [
  Address.fromString("0xa5e0829caced8ffdd4de3c43696c57f7d7a678ff"), // QuickSwap
  Address.fromString("0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"), // SushiSwap
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
  "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619"
);
export const WETH_ADDRESS = Address.fromString(
  "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270"
);
export const USDC_ADDRESS = Address.fromString(
  "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"
);

export class config implements Configurations {
  network(): string {
    return NETWORK_STRING;
  }

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
