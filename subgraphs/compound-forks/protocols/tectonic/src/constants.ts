import { Address } from "@graphprotocol/graph-ts";
import { cTokenDecimals } from "../../../src/constants";
import { TokenData } from "../../../src/mapping";

//////////////////////////////
/////     Addresses      /////
//////////////////////////////

export let comptrollerAddr = Address.fromString(
  "0xb3831584acb95ED9cCb0C11f677B5AD01DeaeEc0"
);

export const nativeToken = new TokenData(
  Address.fromString("0x0000000000000000000000000000000000000000"),
  "Cronos",
  "CRO",
  18
);

export const nativeCToken = new TokenData(
  Address.fromString("0xeAdf7c01DA7E93FdB5f16B0aa9ee85f978e89E95"),
  "Tectonic CRO",
  "tCRO",
  cTokenDecimals
);
