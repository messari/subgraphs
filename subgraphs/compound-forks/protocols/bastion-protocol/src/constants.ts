import { Address } from "@graphprotocol/graph-ts";
import { cTokenDecimals } from "../../../src/constants";
import { TokenData } from "../../../src/mapping";

//////////////////////////////
/////     Addresses      /////
//////////////////////////////

export const comptrollerAddr = Address.fromString(
  "0x6de54724e128274520606f038591a00c5e94a1f6"
);
export const AURORA_REALM_ADDRESS = Address.fromString(
  "0xe1cf09bda2e089c63330f0ffe3f6d6b790835973"
);
export const STNEAR_REALM_ADDRESS = Address.fromString(
  "0xe550a886716241afb7ee276e647207d7667e1e79"
);
export const MULTICHAIN_REALM_ADDRESS = Address.fromString(
  "0xa195b3d7aa34e47fb2d2e5a682df2d9efa2daf06"
);

export const rewardDistributorAddress = Address.fromString(
  "0x98e8d4b4f53fa2a2d1b9c651af919fc839ee4c1a"
);

export const nativeToken = new TokenData(
  Address.fromString("0x0000000000000000000000000000000000000000"),
  "Ether",
  "ETH",
  18
);

export const WETH_ADDRESS = "0xc9bdeed33cd01541e1eed10f90519d2c06fe3feb";

export const nativeCToken = new TokenData(
  Address.fromString("0x4e8fe8fd314cfc09bdb0942c5adcc37431abdcd0"),
  "Bastion Ether",
  "cETH",
  cTokenDecimals
);

export const cBSTNContract = Address.fromString(
  "0x08ac1236ae3982ec9463efe10f0f320d9f5a9a4b"
);

export const bstnOracle = Address.fromString(
  "0x4fa59cae2b1e0d3bbadb3385ba29b0b35822e8ad"
);

export const stNEAR_MARKETS = [
  Address.fromString("0x30fff4663a8dcdd9ed81e60acf505e6159f19bbc"),
  Address.fromString("0xb76108eb764b4427505c4bb020a37d95b3ef5afe"),
];

// reward token mappings
export const REWARD_TOKENS = [
  Address.fromString("0x9f1f933c660a1dc856f0e0fe058435879c5ccef0"), // BSTN (index 0)
  Address.fromString("0xc42c30ac6cc15fac9bd938618bcaa1a1fae8501d"), // wNEAR (index 1)
];
