import { Address } from "@graphprotocol/graph-ts";
import { cTokenDecimals } from "../../src/constants";
import { TokenData } from "../../src/mapping";

//////////////////////////////
/////     Addresses      /////
//////////////////////////////

export let comptrollerAddr = Address.fromString(
  "0x7De56Bd8b37827c51835e162c867848fE2403a48"
);

export const nativeToken = new TokenData(
  Address.fromString("0x0000000000000000000000000000000000000000"),
  "Cronos",
  "CRO",
  18
);

export const tCROToken = new TokenData(
  Address.fromString("0xeAdf7c01DA7E93FdB5f16B0aa9ee85f978e89E95"),
  "Tectonic CRO",
  "tCRO",
  cTokenDecimals
);


export const tETHToken = new TokenData(
  Address.fromString("0x543F4Db9BD26C9Eb6aD4DD1C33522c966C625774"),
  "Tectonic WETH",
  "tWETH",
  cTokenDecimals
);

export const tWBTCToken = new TokenData(
  Address.fromString("0x67fD498E94d95972a4A2a44AccE00a000AF7Fe00"),
  "tectonic WBTC",
  "tWBTC",
  cTokenDecimals
);

export const tUSDCToken = new TokenData(
  Address.fromString("0xB3bbf1bE947b245Aef26e3B6a9D777d7703F4c8e"),
  "tectonic USDC",
  "tUSDC",
  cTokenDecimals
);

export const tUSDTToken = new TokenData(
  Address.fromString("0xA683fdfD9286eeDfeA81CF6dA14703DA683c44E5"),
  "tectonic USDT",
  "tUSDT",
  cTokenDecimals
);

export const tDAIToken = new TokenData(
  Address.fromString("0xE1c4c56f772686909c28C319079D41adFD6ec89b"),
  "tectonic DAI",
  "tDAI",
  cTokenDecimals
);

export const tTONICToken = new TokenData(
  Address.fromString("0xfe6934FDf050854749945921fAA83191Bccf20Ad"),
  "tectonic TONIC",
  "tTONIC",
  cTokenDecimals
);
