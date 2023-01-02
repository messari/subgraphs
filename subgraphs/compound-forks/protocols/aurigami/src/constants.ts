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
export const PLY_TOKEN_ADDRESS = Address.fromString(
  "0x09c9d464b58d96837f8d8b6f4d9fe4ad408d3a4f"
);
export const AURORA_TOKEN_ADDRESS = Address.fromString(
  "0x8bec47865ade3b172a928df8f990bc7f2a3b9f79"
);
export const AURI_LENS_CONTRACT_ADDRESS = Address.fromString(
  "0xFfdFfBDB966Cb84B50e62d70105f2Dbf2e0A1e70"
);

// Markets with broken price oracles
export const PLY_MARKET = Address.fromString(
  "0xc9011e629c9d0b8b1e4a2091e123fbb87b3a792c"
);
export const AURORA_MARKET = Address.fromString(
  "0x8888682e24dd4df7b7ff2b91fccb575737e433bf"
);
export const TRI_MARKET = Address.fromString(
  "0x6ea6c03061bddce23d4ec60b6e6e880c33d24dca"
);
export const USN_MARKET = Address.fromString(
  "0x5ccad065400341db391fd3a4b7f50087b678d7cc"
);

// Trisolaris LP Pools to get the price of the above tokens

// PLY market / wNEAR/PLY LP > missing first 2 days
// reserve0 -> PLY
// reserve1 -> wNEAR
export const WNEAR_PLY_LP = Address.fromString(
  "0x044b6b0cd3bb13d2b9057781df4459c66781dce7"
);

// AURORA market / AURORA/ETH LP
// reserve0 -> AURORA
// reserve1 -> ETH
export const AURORA_ETH_LP = Address.fromString(
  "0x5eeC60F348cB1D661E4A5122CF4638c7DB7A886e"
);

// TRI market / TRI/USDT LP
// reserve0 -> USDT.e
// reserve1 -> TRI
export const TRI_USDT_LP = Address.fromString(
  "0x61C9E05d1Cdb1b70856c7a2c53fA9c220830633c"
);

// USN market / wNEAR/USN LP > missing first month
// reserve0 -> USN
// reserve1 -> wNEAR
export const WNEAR_USN_LP = Address.fromString(
  "0xA36DF7c571bEbA7B3fB89F25dFc990EAC75F525A"
);

// Helper market addresses
export const WNEAR_MARKET = Address.fromString(
  "0xae4fac24dcdae0132c6d04f564dcf059616e9423"
);
export const ETH_MARKET = Address.fromString(
  "0xca9511b610ba5fc7e311fdef9ce16050ee4449e9"
);
export const USDT_MARKET = Address.fromString(
  "0xad5a2437ff55ed7a8cad3b797b3ec7c5a19b1c54"
);
