import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
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

export const TONICAddress = "0xDD73dEa10ABC2Bff99c60882EC5b2B81Bb1Dc5B2";

export const tTONICAddress = "0xfe6934FDf050854749945921fAA83191Bccf20Ad";

export const RATE_IN_SECONDS = 86400;
export const RATE_IN_SECONDS_BD = BigDecimal.fromString(
  RATE_IN_SECONDS.toString()
);

export const CRONOS_BLOCKSPERDAY = RATE_IN_SECONDS_BD.div(
  BigDecimal.fromString("5.7")
);

export const ORACLE_ADDRESS = "0x4B377121d968Bf7a62D51B96523d59506e7c2BF0";

export const WCROUSDC_ADDRESS = "0xa68466208F1A3Eb21650320D2520ee8eBA5ba623";
