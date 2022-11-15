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
