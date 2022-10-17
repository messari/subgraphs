import { Address } from "@graphprotocol/graph-ts";
import { cTokenDecimals } from "../../../src/constants";
import { TokenData } from "../../../src/mapping";

//////////////////////////////
/////     Addresses      /////
//////////////////////////////

export const comptrollerAddr = Address.fromString(
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

export const BROKEN_PRICE_MARKETS = [
  Address.fromString("0xc9011e629c9d0b8b1e4a2091e123fbb87b3a792c"), // auPLY market
  Address.fromString("0x8888682e24dd4df7b7ff2b91fccb575737e433bf"), // auAURORA market
  Address.fromString("0x6ea6c03061bddce23d4ec60b6e6e880c33d24dca"), // auTRI market
  Address.fromString("0x5ccad065400341db391fd3a4b7f50087b678d7cc"), // auUSN market
];
