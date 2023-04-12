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

export const nativeCToken = new TokenData(
  Address.fromString("0x4e8fe8fd314cfc09bdb0942c5adcc37431abdcd0"),
  "Bastion Ether",
  "cETH",
  cTokenDecimals
);

export const BSTN_TOKEN_ADDRESS = Address.fromString(
  "0x9f1f933c660a1dc856f0e0fe058435879c5ccef0"
);

export const cBSTNContract = Address.fromString(
  "0x08ac1236ae3982ec9463efe10f0f320d9f5a9a4b"
);

export const bstnOracle = Address.fromString(
  "0x4fa59cae2b1e0d3bbadb3385ba29b0b35822e8ad"
);

export const NEAR_TOKEN_ADDRESS = Address.fromString(
  "0xc42c30ac6cc15fac9bd938618bcaa1a1fae8501d"
);

export const cNearContract = Address.fromString(
  "0x8c14ea853321028a7bb5e4fb0d0147f183d3b677"
);

export const nearOracle = Address.fromString(
  "0x91a99a522d6fc3a424701b875497279c426c1d70"
);

export const STNEAR_TOKEN_ADDRESS = Address.fromString(
  "0x07f9f7f963c5cd2bbffd30ccfb964be114332e30"
);

export const cStNearContract = Address.fromString(
  "0x30fff4663a8dcdd9ed81e60acf505e6159f19bbc"
);

export const stNearOracle = Address.fromString(
  "0x71ebea24b18f6ecf97c5a5bcaef3e0639575f08c"
);

// reward token mappings
export const REWARD_TOKENS = [
  Address.fromString("0x9f1f933c660a1dc856f0e0fe058435879c5ccef0"), // BSTN (index 0)
  Address.fromString("0xc42c30ac6cc15fac9bd938618bcaa1a1fae8501d"), // wNEAR (index 1)
  //some realm market has Meta as a reward token e.g Staked NEAR Realm
];
