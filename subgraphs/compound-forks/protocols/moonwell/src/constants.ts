import { Address } from "@graphprotocol/graph-ts";
import { cTokenDecimals } from "../../../src/constants";
import { TokenData } from "../../../src/mapping";

export const comptrollerAddr = Address.fromString(
  "0x0b7a0EAA884849c6Af7a129e899536dDDcA4905E"
);
export const MOVRAddr = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);
export const mMOVRAddr = Address.fromString(
  "0x6a1A771C7826596652daDC9145fEAaE62b1cd07f"
);
export const MFAMAddr = Address.fromString(
  "0xbb8d88bcd9749636bc4d2be22aac4bb3b01a58f1"
);
export const WELLAddr = Address.fromString(
  "0x511aB53F793683763E5a8829738301368a2411E3"
);
export const GLMRAddr = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);
export const mGLMRAddr = Address.fromString(
  "0x091608f4e4a15335145be0A279483C0f8E4c7955"
);
export const SolarBeamMfamMovrPairAddr = Address.fromString(
  "0xE6Bfc609A2e58530310D6964ccdd236fc93b4ADB"
);

export const SolarBeamMfamMovrPairStartBlock = 1512356;

export const moonriverNativeToken = new TokenData(
  Address.fromString("0x0000000000000000000000000000000000000000"),
  "MOVR",
  "MOVR",
  18
);

export const moonriverNativeCToken = new TokenData(
  Address.fromString("0x6a1A771C7826596652daDC9145fEAaE62b1cd07f"),
  "Moonwell MOVR",
  "mMOVR",
  cTokenDecimals
);

export const moonbeamNativeToken = new TokenData(
  Address.fromString("0x0000000000000000000000000000000000000000"),
  "GLMR",
  "GLMR",
  18
);

export const moonbeamNativeCToken = new TokenData(
  Address.fromString("0x091608f4e4a15335145be0A279483C0f8E4c7955"),
  "Moonwell GLMR",
  "mGLMR",
  cTokenDecimals
);
