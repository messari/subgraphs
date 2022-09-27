import { Address } from "@graphprotocol/graph-ts";
import { cTokenDecimals } from "../../../src/constants";
import { TokenData } from "../../../src/mapping";

//////////////////////////////
/////     Addresses      /////
//////////////////////////////

export const comptrollerAddr = Address.fromString(
  "0x6De54724e128274520606f038591A00C5E94a1F6"
);

export const rewardDistributorAddress = Address.fromString(
  "0x98E8d4b4F53FA2a2d1b9C651AF919Fc839eE4c1a"
);

export const nativeToken = new TokenData(
  Address.fromString("0x0000000000000000000000000000000000000000"),
  "Ether",
  "ETH",
  18
);

export const nativeCToken = new TokenData(
  Address.fromString("0x4E8fE8fd314cFC09BDb0942c5adCC37431abDCD0"),
  "Bastion Ether",
  "cETH",
  cTokenDecimals
);

export const cBSTNContract = Address.fromString(
  "0x08Ac1236ae3982EC9463EfE10F0F320d9F5A9A4b"
);

export const bstnOracle = Address.fromString(
  "0x4Fa59CaE2b1e0d3BBADB3385Ba29B0B35822e8aD"
);

// reward token mappings
export const REWARD_TOKENS = [
  Address.fromString("0x9f1F933C660a1DC856F0E0Fe058435879c5CCEf0"), // BSTN (index 0)
  Address.fromString("0xC42C30aC6Cc15faC9bD938618BcaA1a1FaE8501d"), // wNEAR (index 1)
];
