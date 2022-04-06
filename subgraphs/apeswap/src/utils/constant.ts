import { BigDecimal, BigInt, Address, dataSource } from "@graphprotocol/graph-ts";
import { Factory } from "../../generated/Factory/Factory";

////////////////////////
///// Schema Enums /////
////////////////////////

export namespace Network {
  export const AVALANCHE = "AVALANCHE";
  export const AURORA = "AURORA";
  export const BSC = "BSC";
  export const CELO = "CELO";
  export const CRONOS = "CRONOS";
  export const ETHEREUM = "ETHEREUM";
  export const FANTOM = "FANTOM";
  export const HARMONY = "HARMONY";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const OPTIMISM = "OPTIMISM";
  export const POLYGON = "POLYGON";
  export const XDAI = "XDAI";
}

export namespace ProtocolType {
  export const EXCHANGE = "EXCHANGE";
  export const LENDING = "LENDING";
  export const YIELD = "YIELD";
  export const BRIDGE = "BRIDGE";
  export const GENERIC = "GENERIC";
}

export namespace RewardTokenType {
  export const DEPOSIT = "DEPOSIT";
  export const BORROW = "BORROW";
}

export namespace LiquidityPoolFeeType {
  export const TRADING_FEE = "TRADING_FEE";
  export const PROTOCOL_FEE = "PROTOCOL_FEE";
  export const TIERED_FEE = "TIERED_FEE";
  export const DYNAMIC_FEE = "DYNAMIC_FEE";
}

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
// export const FACTORY_ADDRESS = "0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6";
export const FACTORY_ADDRESS = dataSource.network() == "bsc" ? BSC.FACTORY_ADDRESS : POLYGON.FACTORY_ADDRESS;
export let factoryContract = Factory.bind(Address.fromString(FACTORY_ADDRESS));

export const DEFAULT_DECIMALS: i32 = 18;
export const USDC_DECIMALS: i32 = 6;
export const USD_DENOMINATOR = BigInt.fromI32(10 ** 18).toBigDecimal();
export const FEE_DENOMINATOR = BigInt.fromI32(10 ** 10);
export const FEE_DECIMALS = 10;
export let BIGINT_ZERO = BigInt.fromI32(0);
export let BIGINT_ONE = BigInt.fromI32(1);
export let BIGINT_MAX = BigInt.fromString(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935",
);
export let BIGDECIMAL_ZERO = BigDecimal.fromString("0");
export let BIGDECIMAL_ONE = BigDecimal.fromString("1");
export let MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));
export let DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const SECONDS_PER_DAY = 60 * 60 * 24;
export let MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export let MS_PER_YEAR = DAYS_PER_YEAR.times(new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000)));

export function toDecimal(value: BigInt, decimals: i32 = DEFAULT_DECIMALS): BigDecimal {
  let decimal = BigInt.fromI32(decimals);
  if (decimal == BIGINT_ZERO) {
    return value.toBigDecimal();
  }
  return value.toBigDecimal().div(exponentToBigDecimal(decimal));
}

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString("1");
  for (let i = BIGINT_ZERO; i.lt(decimals as BigInt); i = i.plus(BIGINT_ONE)) {
    bd = bd.times(BigDecimal.fromString("10"));
  }
  return bd;
}

// Converters
export function toBigInt(value: BigDecimal, decimals: i32 = DEFAULT_DECIMALS): BigInt {
  return value.times(getPrecision(decimals).toBigDecimal()).truncate(0).digits;
}

// Helpers
export function getPrecision(decimals: i32 = DEFAULT_DECIMALS): BigInt {
  return BigInt.fromI32(10).pow((<u8>decimals) as u8);
}

export function toPercentage(n: BigDecimal): BigDecimal {
  return n.div(BigDecimal.fromString("100"));
}

export namespace BSC {
  export const WBNB_ADDRESS = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";
  export const BUSD_WBNB_PAIR = "0x51e6d27fa57373d8d4c256231241053a70cb1d93"; // created block 4857769
  export const DAI_WBNB_PAIR = "0xf3010261b58b2874639ca2e860e9005e3be5de0b"; // created block 481116
  export const USDT_WBNB_PAIR = "0x20bcc3b8a0091ddac2d0bc30f68e6cbb97de59cd"; // created block 648115
  export const FACTORY_ADDRESS = "0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6";
  export const WHITELIST = [
    "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c", // WBNB
    "0xe9e7cea3dedca5984780bafc599bd69add087d56", // BUSD
    "0x55d398326f99059ff775485246999027b3197955", // USDT
    "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", // USDC
    "0x23396cf899ca06c4472205fc903bdb4de249d6fc", // UST
    "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3", // DAI
    "0x4bd17003473389a42daf6a0a729f6fdb328bbbd7", // VAI
    "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c", // BTCB
    "0x2170ed0880ac9a755fd29b2688956bd959f933f8", // WETH
    "0x250632378e573c6be1ac2f97fcdf00515d0aa91b", // BETH
    "0x603c7f932ed1fc6575303d8fb018fdcbb0f39a95", // BANANA
    "0xdDb3Bd8645775F59496c821E4F55A7eA6A6dc299", // GNANA
  ];
}

export namespace POLYGON {
  export const WMATIC_ADDRESS = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
  export const WMATIC_DAI_PAIR = "0xd32f3139a214034a0f9777c87ee0a064c1ff6ae2"; //
  export const WMATIC_USDT_PAIR = "0x65d43b64e3b31965cd5ea367d4c2b94c03084797";
  export const WMATIC_USDC_PAIR = "0x019011032a7ac3a87ee885b6c08467ac46ad11cd";
  export const FACTORY_ADDRESS = "0xCf083Be4164828f00cAE704EC15a36D711491284";
  export const WHITELIST = [
    "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WMATIC
    "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", // DAI
    "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // USDC
    "0xa649325aa7c5093d12d6f98eb4378deae68ce23f", // BNB
    "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // WETH
    "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6", // WBTC
    "0x5d47bAbA0d66083C52009271faF3F50DCc01023C", // BANANA
  ];
}
