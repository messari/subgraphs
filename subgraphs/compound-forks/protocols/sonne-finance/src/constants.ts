import { Address } from "@graphprotocol/graph-ts";
import { cTokenDecimals } from "../../../src/constants";
import { TokenData } from "../../../src/mapping";

export const DEFAULT_DECIMALS = 18;
export const USDC_DECIMALS = 6;

//////////////////////////////
/////     Addresses      /////
//////////////////////////////

export const comptrollerAddr = Address.fromString(
  "0x60CF091cD3f50420d50fD7f707414d0DF4751C58"
);
export const nativeToken = new TokenData(
  Address.fromString("0x4200000000000000000000000000000000000042"),
  "Optimism",
  "OP",
  18
);
export const nativeCToken = new TokenData(
  Address.fromString("0x8cD6b19A07d754bF36AdEEE79EDF4F2134a8F571"),
  "Sonne Optimism",
  "soOP",
  cTokenDecimals
);

export const SONNE_ADDRESS = Address.fromString(
  "0x1DB2466d9F5e10D7090E7152B68d62703a2245F0"
);
export const SONNE_USDC_LP = Address.fromString(
  "0xc899C4D73ED8dF2eAd1543AB915888B0Bf7d57a2"
);
