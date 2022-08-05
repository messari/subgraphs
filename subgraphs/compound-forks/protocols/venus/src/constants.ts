import { Address } from "@graphprotocol/graph-ts";
import { cTokenDecimals } from "../../../src/constants";
import { TokenData } from "../../../src/mapping";

export let comptrollerAddr = Address.fromString(
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

export const cakeToken = new TokenData(
  Address.fromString("0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82"),
  "PancakeSwap Token",
  "CAKE",
  18
);
export const cakeCToken = new TokenData(
  Address.fromString("0x86ac3974e2bd0d60825230fa6f355ff11409df5c"),
  "Venus CAKE",
  "vCAKE",
  cTokenDecimals
);
