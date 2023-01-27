import { Configurations } from "../common/types";
import * as constants from "../common/constants";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { ASI_LP_ADDRESS, JOE_LP_ADDRESS, K3C_LP_ADDRESS, OLIVE_LP_ADDRESS, STAKED_GLP_ADDRESS, USDC_LP_ADDRESS } from "../../helpers/constants";

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

export const HARDCODED_STABLES: Address[] = [];

export const BASE_FOR_LP_TOKENS: Map<Address, Address> = new Map();
BASE_FOR_LP_TOKENS.set(
  STAKED_GLP_ADDRESS,
  Address.fromString("0x62edc0692BD897D2295872a9FFCac5425011c661")
);
BASE_FOR_LP_TOKENS.set(
  JOE_LP_ADDRESS,
  Address.fromString("0x48f88A3fE843ccb0b5003e70B4192c1d7448bEf0")
);
BASE_FOR_LP_TOKENS.set(
  USDC_LP_ADDRESS,
  Address.fromString("0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E")
);
BASE_FOR_LP_TOKENS.set(
  ASI_LP_ADDRESS,
  Address.fromString("0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7")
);
BASE_FOR_LP_TOKENS.set(
  K3C_LP_ADDRESS,
  Address.fromString("0x63a72806098bd3d9520cc43356dd78afe5d386d9")
);
BASE_FOR_LP_TOKENS.set(
  OLIVE_LP_ADDRESS,
  Address.fromString("0x617724974218A18769020A70162165A539c07E8a")
);

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

export const GMX_STRATEGY = Address.fromString(
  "0x9f637540149f922145c06e1aa3f38dcdc32aff5c"
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

  getBaseToken(address: Address): Address {
    return BASE_FOR_LP_TOKENS.get(address);
  }
}
