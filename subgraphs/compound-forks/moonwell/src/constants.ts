import { Address } from "@graphprotocol/graph-ts";
import { cTokenDecimals } from "../../src/constants";
import { TokenData } from "../../src/mapping";

export let comptrollerAddr = Address.fromString(
  "0x0b7a0EAA884849c6Af7a129e899536dDDcA4905E"
);
export let MOVRAddr = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);
export let mMOVRAddr = Address.fromString(
  "0x6a1A771C7826596652daDC9145fEAaE62b1cd07f"
);
export let MFAMAddr = Address.fromString(
  "0xbb8d88bcd9749636bc4d2be22aac4bb3b01a58f1"
);
export let SolarBeamMfamMovrPairAddr = Address.fromString(
  "0xE6Bfc609A2e58530310D6964ccdd236fc93b4ADB"
);

export let SolarBeamMfamMovrPairStartBlock = 1512356;

export const nativeToken = new TokenData(
  Address.fromString("0x0000000000000000000000000000000000000000"),
  "MOVR",
  "MOVR",
  18
);

export const nativeCToken = new TokenData(
  Address.fromString("0x6a1A771C7826596652daDC9145fEAaE62b1cd07f"),
  "Moonwell MOVR",
  "mMOVR",
  cTokenDecimals
);
