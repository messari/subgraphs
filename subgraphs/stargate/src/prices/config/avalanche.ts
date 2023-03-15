import { Configurations } from "../common/types";
import * as constants from "../common/constants";
import { Address, BigInt } from "@graphprotocol/graph-ts";

export const NETWORK_STRING = "avalanche";

///////////////////////////////////////////////////////////////////////////
///////////////////// CALCULATIONS/ORACLE CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_CONTRACT_ADDRESS = constants.NULL.TYPE_ADDRESS;
export const CHAIN_LINK_CONTRACT_ADDRESS = constants.NULL.TYPE_ADDRESS;
export const SUSHISWAP_CALCULATIONS_ADDRESS = constants.NULL.TYPE_ADDRESS;

export const AAVE_ORACLE_CONTRACT_ADDRESS = Address.fromString(
  "0xEBd36016B3eD09D4693Ed4251c67Bd858c3c7C9C"
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_CALCULATIONS_ADDRESS = constants.NULL.TYPE_ADDRESS;

export const CURVE_REGISTRY_ADDRESSES: Address[] = [
  Address.fromString("0x8474DdbE98F5aA3179B3B3F5942D724aFcdec9f6"),
  Address.fromString("0x90f421832199e93d01b64DaF378b183809EB0988"),
];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// UNISWAP FORKS CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_FORKS_ROUTER_ADDRESSES: Address[] = [
  Address.fromString("0x60aE616a2155Ee3d9A68541Ba4544862310933d4"), // TraderJOE
  Address.fromString("0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106"), // Pangolin
  Address.fromString("0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"), // Sushiswap
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
  Address.fromString("0x5c49b268c9841AFF1Cc3B0a418ff5c3442eE3F3b"), // MAI
];

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// HELPERS /////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const USDC_TOKEN_DECIMALS = BigInt.fromI32(6);

export const ETH_ADDRESS = Address.fromString(
  "0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab"
);
export const WETH_ADDRESS = Address.fromString(
  "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7"
);
export const USDC_ADDRESS = Address.fromString(
  "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e"
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
