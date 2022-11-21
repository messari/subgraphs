import { Configurations } from "../common/types";
import * as constants from "../common/constants";
import { Address, BigInt } from "@graphprotocol/graph-ts";

export const NETWORK_STRING = "bsc";

///////////////////////////////////////////////////////////////////////////
///////////////////// CALCULATIONS/ORACLE CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_CONTRACT_ADDRESS = constants.NULL.TYPE_ADDRESS;
export const CHAIN_LINK_CONTRACT_ADDRESS = constants.NULL.TYPE_ADDRESS;
export const AAVE_ORACLE_CONTRACT_ADDRESS = constants.NULL.TYPE_ADDRESS;
export const SUSHISWAP_CALCULATIONS_ADDRESS = constants.NULL.TYPE_ADDRESS;

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_CALCULATIONS_ADDRESS = constants.NULL.TYPE_ADDRESS;

export const CURVE_REGISTRY_ADDRESSES: Address[] = [];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// UNISWAP FORKS CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_FORKS_ROUTER_ADDRESSES: Address[] = [
  Address.fromString("0x10ED43C718714eb63d5aA57B78B54704E256024E"), // PancakeSwap v2
  Address.fromString("0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F"), // PancakeSwap v1
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
  Address.fromString("0x1075bea848451a13fd6f696b5d0fda52743e6439"), // aETHb
  Address.fromString("0x18b497f4d5f84958b3ba7911401e145397d73604"), // deusdc-3ep
  Address.fromString("0x1a76fe224963818bb3aaa9d6c0603c6178804bf6"), // deUSDC
  Address.fromString("0x2240928ce2010b6d069d381a1c82e57bbf887662"), // arth3eps
  Address.fromString("0x2aa50d69f00d48ee9cfb97c702f2bce09a11cdc9"), // USDM
  Address.fromString("0x2c31c265b83c67d4ec5266f621d576d4a7c123ea"), // metamim
  Address.fromString("0x2d871631058827b703535228fb9ab5f35cf19e76"), // deFRAX
  Address.fromString("0x3d4350cd54aef9f9b2c29435e0fa809957b3f30a"), // UST (wormhole)
  Address.fromString("0x3f56e0c36d275367b8c502090edf38289b3dea0d"), // MAI stablecoin
  Address.fromString("0x469f70cc3f3c3ec11b842c02878c0778a79a34f5"), // usx3eps
  Address.fromString("0x52d36668ec4cedd02e3de25b12ecaf4be789198b"), // usdnv3EPS
  Address.fromString("0x59a48b66228e601a6873c9faee96a15e59756fbe"), // usds eps
  Address.fromString("0x5b5bd8913d766d005859ce002533d4838b0ebbb5"), // val3EPS
  Address.fromString("0x5ee318b2ad8b45675dc169c68a273caf8fb26ee0"), // AUSD/val3EPS
  Address.fromString("0x655853e962dd3cc97077163b19d45375d02a0c19"), // frax3eps
  Address.fromString("0x67ff854d61b0f7a4aa3bf4da1f960439fc1df637"), // usds eps
  Address.fromString("0x7b1cf59492391b416c160ad9788d0983def4f23a"), // USDS+USDC+BUSD+USDT
  Address.fromString("0x7ee5010cbd5e499b7d66a7cba2ec3bde5fca8e00"), // ARTH.usd
  Address.fromString("0x8602f98f7738afe9edb37ca945f9b3e1ab2e1204"), // defrax-3ep
  // Address.fromString("0x88fd584df3f97c64843cd474bdc6f78e398394f4"), // ARTH USD Rebase
  Address.fromString("0x8b02998366f7437f6c4138f4b543ea5c000cd608"), // ARTH USD (Rebase)
  Address.fromString("0x8eb98a16f9a6aa139b3021e23debd7f24ddad06b"), // usdd/busd
  Address.fromString("0x90c97f71e18723b0cf0dfa30ee176ab653e89f40"), // FRAX
  Address.fromString("0xaa7dfcfa0f90213aff443a7a27c32d386c1f4786"), // nBUSD/3EPS
  Address.fromString("0xaf4de8e872131ae328ce21d909c74705d3aaf452"), // Ellipsis.finance BUSD/USDC/USDT
  Address.fromString("0xb38b49bae104bbb6a82640094fd61b341a858f78"), // ARTH.usd/3EPS
  Address.fromString("0xb5102cee1528ce2c760893034a4603663495fd72"), // dForce USD
  Address.fromString("0xb69a424df8c737a122d0e60695382b3eec07ff4b"), // ARTH
  Address.fromString("0xb7d9b83c7dc3c7fab2d0159f8b3fa7c4fb081741"), // Decentralized USD / 3EPS
  Address.fromString("0xc1a52e938ffd0eda3c6ad78ce86179adc9d59feb"), // czusd3eps
  Address.fromString("0xd17479997f34dd9156deef8f95a52d81d265be9c"), // USDD
  Address.fromString("0xd295f4b58d159167db247de06673169425b50ef2"), // USDL
  Address.fromString("0xdcecf0664c33321ceca2effce701e710a2d28a3f"), // AUSD
  Address.fromString("0xde7d1ce109236b12809c45b23d22f30dba0ef424"), // Spice USD
  Address.fromString("0xe04fe47516c4ebd56bc6291b15d46a47535e736b"), // Duet USD
  Address.fromString("0xe1c7c46b666506c6690dce134fcba3f09456e4a9"), // Ellipsis valBUSD/valUSDC/valUSDT
  Address.fromString("0xe68b79e51bf826534ff37aa9cee71a3842ee9c70"), // CZUSD
];

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// HELPERS /////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const USDC_TOKEN_DECIMALS = BigInt.fromI32(18);

export const ETH_ADDRESS = constants.NULL.TYPE_ADDRESS;

export const WETH_ADDRESS = Address.fromString(
  "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c"
);
export const USDC_ADDRESS = Address.fromString(
  "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d"
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
