import { BigDecimal, BigInt, Address, dataSource } from "@graphprotocol/graph-ts";

////////////////////////
///// Schema Enums /////
////////////////////////

// The enum values are derived from Coingecko slugs (converted to uppercase
// and replaced hyphens with underscores for Postgres enum compatibility)
export namespace Network {
  export const ARBITRUM = "ARBITRUM_ONE";
  export const AVALANCHE = "AVALANCHE";
  export const AURORA = "AURORA";
  export const BSC = "BINANCE_SMART_CHAIN";
  export const CELO = "CELO";
  export const CRONOS = "CRONOS";
  export const ETHEREUM = "ETHEREUM";
  export const FANTOM = "FANTOM";
  export const HARMONY = "HARMONY_SHARD_0";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const OPTIMISM = "OPTIMISTIC_ETHEREUM";
  export const POLYGON = "POLYGON_POS";
  export const XDAI = "XDAI";
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
export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

////////////////////////
///// Type Helpers /////
////////////////////////

export const DEFAULT_DECIMALS = 18;

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TWO = BigInt.fromI32(2);
export const BIGINT_THOUSAND = BigInt.fromI32(1000);
export const BIGINT_MAX = BigInt.fromString(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935",
);

export const INT_ZERO = 0 as i32;
export const INT_ONE = 1 as i32;
export const INT_TWO = 2 as i32;

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export const BIGDECIMAL_TWO = new BigDecimal(BIGINT_TWO);

export const MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));

/////////////////////
///// Date/Time /////
/////////////////////

export const SECONDS_PER_DAY = 60 * 60 * 24; // 86400
export const MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export const DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const MS_PER_YEAR = DAYS_PER_YEAR.times(new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000)));

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export class AddressByNetwork {
  public mainnet: string;
  public polygon: string;
  public arbitrum: string;
}

let network = dataSource.network();

let vaultAddressByNetwork: AddressByNetwork = {
  mainnet: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
  polygon: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
  arbitrum: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
};

let wethAddressByNetwork: AddressByNetwork = {
  mainnet: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  polygon: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
  arbitrum: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
};

let wMaticAddressByNetwork: AddressByNetwork = {
  mainnet: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
  polygon: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
  arbitrum: "0x0000000000000000000000000000000000000000",
};

let wbtcAddressByNetwork: AddressByNetwork = {
  mainnet: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  polygon: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
  arbitrum: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
};

let usdcAddressByNetwork: AddressByNetwork = {
  mainnet: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  polygon: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
  arbitrum: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
};

let usdtAddressByNetwork: AddressByNetwork = {
  mainnet: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  polygon: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
  arbitrum: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
};

let balAddressByNetwork: AddressByNetwork = {
  mainnet: "0xba100000625a3754423978a60c9317c58a424e3D",
  polygon: "0x9a71012b13ca4d3d0cdc72a177df3ef03b0e76a3",
  arbitrum: "0x040d1EdC9569d4Bab2D15287Dc5A4F10F56a56B8",
};

let daiAddressByNetwork: AddressByNetwork = {
  mainnet: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  polygon: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
  arbitrum: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
};

function forNetwork(addressByNetwork: AddressByNetwork, network: string): Address {
  if (network === "polygon") {
    return Address.fromString(addressByNetwork.polygon);
  } else if (network === "arbitrum") {
    return Address.fromString(addressByNetwork.arbitrum);
  }
  return Address.fromString(addressByNetwork.mainnet);
}

export let VAULT_ADDRESS = forNetwork(vaultAddressByNetwork, network);
export let WETH: Address = forNetwork(wethAddressByNetwork, network);
export let WMATIC: Address = forNetwork(wMaticAddressByNetwork, network);
export let WBTC: Address = forNetwork(wbtcAddressByNetwork, network);
export let USDC: Address = forNetwork(usdcAddressByNetwork, network);
export let USDT: Address = forNetwork(usdtAddressByNetwork, network);
export let BAL: Address = forNetwork(balAddressByNetwork, network);
export let DAI: Address = forNetwork(daiAddressByNetwork, network);

export let USD_STABLE_ASSETS: Address[] = [USDC, DAI, USDT];
export let BASE_ASSETS: Address[] = [WETH, WMATIC, WBTC, BAL];
export let PRICING_ASSETS: Address[] = USD_STABLE_ASSETS.concat(BASE_ASSETS);
