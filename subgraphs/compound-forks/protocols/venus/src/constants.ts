import { Address } from "@graphprotocol/graph-ts";
import { cTokenDecimals } from "../../../src/constants";
import { TokenData } from "../../../src/mapping";

export const comptrollerAddr = Address.fromString(
  "0xfD36E2c2a6789Db23113685031d7F16329158384"
);

export const nativeToken = new TokenData(
  Address.fromString("0x0000000000000000000000000000000000000000"),
  "BNB",
  "BNB",
  18
);

export const nativeCToken = new TokenData(
  Address.fromString("0xA07c5b74C9B40447a954e1466938b865b6BBea36"),
  "Venus BNB",
  "vBNB",
  cTokenDecimals
);

export const VDAI_MARKET_ADDRESS = Address.fromString(
  "0x334b3ecb4dca3593bccc3c7ebd1a1c1d1780fbf1"
);

export const vXVS = new TokenData(
  Address.fromString("0x151b1e2635a717bcdc836ecd6fbb62b674fe3e1d"),
  "Venus XVS",
  "vXVS",
  cTokenDecimals
);

export const XVS = new TokenData(
  Address.fromString("0xcf6bb5389c92bdda8a3747ddb454cb7a64626c63"),
  "Venus",
  "XVS",
  18
);

// number of decimals the oracle results are scaled by.
export const ORACLE_PRECISION = 18;
