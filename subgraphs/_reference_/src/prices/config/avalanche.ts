/* eslint-disable @typescript-eslint/no-unused-vars */
import * as constants from "../common/constants";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Configurations, OracleConfig, OracleContract } from "../common/types";

export const NETWORK_STRING = "avalanche";

///////////////////////////////////////////////////////////////////////////
///////////////////// CALCULATIONS/ORACLE CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_CONTRACT_ADDRESS = new OracleContract();
export const CHAIN_LINK_CONTRACT_ADDRESS = new OracleContract();
export const SUSHISWAP_CALCULATIONS_ADDRESS = new OracleContract();

export const AAVE_ORACLE_CONTRACT_ADDRESS = new OracleContract(
  "0xebd36016b3ed09d4693ed4251c67bd858c3c7c9c",
  11970477
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_CALCULATIONS_ADDRESS = new OracleContract();

export const CURVE_REGISTRY_ADDRESSES: OracleContract[] = [
  new OracleContract("0x8474ddbe98f5aa3179b3b3f5942d724afcdec9f6", 5254206),
  new OracleContract("0x90f421832199e93d01b64daf378b183809eb0988", 9384663),
];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// UNISWAP FORKS CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_FORKS_ROUTER_ADDRESSES: OracleContract[] = [
  new OracleContract("0x60ae616a2155ee3d9a68541ba4544862310933d4", 2486393), // TraderJOE
  new OracleContract("0xe54ca86531e17ef3616d22ca28b0d458b6c89106", 56879), // Pangolin
  new OracleContract("0x1b02da8cb0d097eb8d57a175b88c7d8b47997506", 506236), // Sushiswap
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
