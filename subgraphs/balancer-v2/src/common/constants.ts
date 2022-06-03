import { BigDecimal, BigInt, Address, dataSource } from "@graphprotocol/graph-ts";

////////////////////////
///// Schema Enums /////
////////////////////////

// The network names corresponding to the Network enum in the schema.
// They also correspond to the ones in `dataSource.network()` after converting to lower case.
// See below for a complete list:
// https://thegraph.com/docs/en/hosted-service/what-is-hosted-service/#supported-networks-on-the-hosted-service
export namespace Network {
  export const ARBITRUM_ONE = "ARBITRUM_ONE";
  export const AVALANCHE = "AVALANCHE";
  export const AURORA = "AURORA";
  export const BSC = "BSC"; // aka BNB Chain
  export const CELO = "CELO";
  export const MAINNET = "MAINNET"; // Ethereum mainnet
  export const FANTOM = "FANTOM";
  export const FUSE = "FUSE";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const NEAR_MAINNET = "NEAR_MAINNET";
  export const OPTIMISM = "OPTIMISM";
  export const MATIC = "MATIC"; // aka Polygon
  export const XDAI = "XDAI"; // aka Gnosis Chain
}

export namespace ProtocolType {
  export const EXCHANGE = "EXCHANGE";
  export const LENDING = "LENDING";
  export const YIELD = "YIELD";
  export const BRIDGE = "BRIDGE";
  export const GENERIC = "GENERIC";
}

export namespace VaultFeeType {
  export const MANAGEMENT_FEE = "MANAGEMENT_FEE";
  export const PERFORMANCE_FEE = "PERFORMANCE_FEE";
  export const DEPOSIT_FEE = "DEPOSIT_FEE";
  export const WITHDRAWAL_FEE = "WITHDRAWAL_FEE";
}

export namespace LiquidityPoolFeeType {
  export const FIXED_TRADING_FEE = "FIXED_TRADING_FEE";
  export const TIERED_TRADING_FEE = "TIERED_TRADING_FEE";
  export const DYNAMIC_TRADING_FEE = "DYNAMIC_TRADING_FEE";
  export const FIXED_PROTOCOL_FEE = "FIXED_PROTOCOL_FEE";
  export const DYNAMIC_PROTOCOL_FEE = "DYNAMIC_PROTOCOL_FEE";
}

export namespace RewardTokenType {
  export const DEPOSIT = "DEPOSIT";
  export const BORROW = "BORROW";
}
//////////////////////////////
///// Ethereum Addresses /////
//////////////////////////////

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

////////////////////////
///// Type Helpers /////
////////////////////////

export const DEFAULT_DECIMALS = 18;

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TWO = BigInt.fromI32(2);
export const BIGINT_THOUSAND = BigInt.fromI32(1000);

export const INT_ZERO = 0 as i32;
export const INT_ONE = 1 as i32;

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export const BIGDECIMAL_TWO = new BigDecimal(BIGINT_TWO);

/////////////////////
///// Date/Time /////
/////////////////////

export const SECONDS_PER_DAY = 60 * 60 * 24; // 86400
export const SECONDS_PER_HOUR = 60 * 60;

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export let VAULT_ADDRESS = Address.fromString("0xBA12222222228d8Ba445958a75a0704d566BF2C8");
export let FEE_COLLECTOR_ADDRESS = Address.fromString("0xce88686553686da562ce7cea497ce749da109f9f");
export let WETH: Address = Address.fromString("0x82aF49447D8a07e3bd95BD0d56f35241523fBab1");
export let WMATIC: Address = Address.fromString("0x0000000000000000000000000000000000000000");
export let WBTC: Address = Address.fromString("0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f");
export let USDC: Address = Address.fromString("0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8");
export let USDT: Address = Address.fromString("0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9");
export let BAL: Address = Address.fromString("0x040d1EdC9569d4Bab2D15287Dc5A4F10F56a56B8");
export let DAI: Address = Address.fromString("0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1");

export let USD_STABLE_ASSETS: Address[] = [USDC, DAI, USDT];
export let BASE_ASSETS: Address[] = [WETH, WMATIC, WBTC, BAL];
