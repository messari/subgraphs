import { Address } from "@graphprotocol/graph-ts";
import { cTokenDecimals } from "../../src/constants";
import { TokenData } from "../../src/mapping";

//////////////////////////////
/////     Addresses      /////
//////////////////////////////

export let comptrollerAddr = Address.fromString(
  "0x6De54724e128274520606f038591A00C5E94a1F6"
);

export const nativeToken = new TokenData(
  Address.fromString("0x0000000000000000000000000000000000000000"),
  "Ether",
  "ETH",
  18
);

export const nativeCToken = new TokenData(
  Address.fromString("0x4E8fE8fd314cFC09BDb0942c5adCC37431abDCD0"),
  "Bastion Ether",
  "cETH",
  cTokenDecimals
);
