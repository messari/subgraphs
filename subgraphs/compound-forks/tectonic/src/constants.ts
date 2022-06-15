import { Address } from "@graphprotocol/graph-ts";
import { cTokenDecimals } from "../../src/constants";
import { TokenData } from "../../src/mapping";

//////////////////////////////
/////     Addresses      /////
//////////////////////////////

export let comptrollerAddr = Address.fromString(
  "0x7De56Bd8b37827c51835e162c867848fE2403a48"
);


// should be CRO
export const nativeToken = new TokenData(
  Address.fromString("0x0000000000000000000000000000000000000000"),
  "Ether",
  "ETH",
  18
);


// Should be tCRO (should it be other t Tokens?)
export const nativeCToken = new TokenData(
  Address.fromString("0x4E8fE8fd314cFC09BDb0942c5adCC37431abDCD0"),
  "Bastion Ether",
  "cETH",
  cTokenDecimals
);
