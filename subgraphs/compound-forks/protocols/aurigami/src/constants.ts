import { Address } from "@graphprotocol/graph-ts";
import { cTokenDecimals } from "../../../src/constants";
import { TokenData } from "../../../src/mapping";

//////////////////////////////
/////     Addresses      /////
//////////////////////////////

export let comptrollerAddr = Address.fromString(
  "0x817af6cfAF35BdC1A634d6cC94eE9e4c68369Aeb"
);

export const nativeToken = new TokenData(
  Address.fromString("0x0000000000000000000000000000000000000000"),
  "Ether",
  "ETH",
  18
);

export const nativeCToken = new TokenData(
  Address.fromString("0xca9511B610bA5fc7E311FDeF9cE16050eE4449E9"),
  "Aurigami Ether",
  "auETH",
  cTokenDecimals
);
