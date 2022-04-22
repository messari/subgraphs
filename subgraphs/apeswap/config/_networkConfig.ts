import { Address, BigDecimal, Bytes, dataSource, log } from "@graphprotocol/graph-ts";
import { Factory } from "../generated/Factory/Factory";
import { FeeSwitch, SchemaNetwork, SubgraphNetwork } from "../src/common/constants";
import { RewardIntervalType } from "../src/common/rewards";
import { toBytesArray, toPercentage } from "../src/common/utils/utils";

let PROTOCOL_NAME_TEMP: string;
let PROTOCOL_SLUG_TEMP: string;
let NETWORK_TEMP: string; // The deployed network(e.g BSC or Polygon )

let FACTORY_ADDRESS_TEMP: string; // factory address of the protocol in the network
let FACTORY_CONTRACT_TEMP: Factory; // Factory Contract of protocol in the network

// Fees in percentage
let TRADING_FEE_TEMP: BigDecimal; // trading fee of the protocol in the network
let FEE_ON_OFF_TEMP: string;
let PROTOCOL_FEE_TO_ON_TEMP: BigDecimal; // protocol fee of the protocol in the network when protocol fee is on
let LP_FEE_TO_ON_TEMP: BigDecimal; // supply fee of the protocol in the network when protocol fee is off
let PROTOCOL_FEE_TO_OFF_TEMP: BigDecimal; // protocol fee of the protocol in the network when protocol fee is on
let LP_FEE_TO_OFF_TEMP: BigDecimal; // supply fee of the protocol in the network when protocol fee is off

let REWARD_INTERVAL_TYPE_TEMP: string;

let NATIVE_TOKEN_TEMP: string; // Address of wrapped native token
let WHITELIST_TOKENS_TEMP: string[]; // A tokens whose amounts should contribute to tracked volume and liquidity
let STABLE_COINS_TEMP: string[]; // A list of stable coins
let STABLE_ORACLE_POOLS_TEMP: string[]; // A list of [stable coin / native token] oracle pools

if (dataSource.network() == SubgraphNetwork.POLYGON) {
  PROTOCOL_NAME_TEMP = "Apeswap";
  PROTOCOL_SLUG_TEMP = "apeswap";
  NETWORK_TEMP = SchemaNetwork.POLYGON;

  FACTORY_ADDRESS_TEMP = "0xCf083Be4164828f00cAE704EC15a36D711491284";
  FACTORY_CONTRACT_TEMP = Factory.bind(Address.fromString(FACTORY_ADDRESS_TEMP));

  TRADING_FEE_TEMP = BigDecimal.fromString("2");
  PROTOCOL_FEE_TO_ON_TEMP = BigDecimal.fromString("1.5");
  LP_FEE_TO_ON_TEMP = BigDecimal.fromString("0.5");
  PROTOCOL_FEE_TO_OFF_TEMP = BigDecimal.fromString("0.0");
  LP_FEE_TO_OFF_TEMP = BigDecimal.fromString("2");
  FEE_ON_OFF_TEMP = FeeSwitch.ON;

  REWARD_INTERVAL_TYPE_TEMP = RewardIntervalType.BLOCK;

  NATIVE_TOKEN_TEMP = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
  WHITELIST_TOKENS_TEMP = [
    "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WMATIC
    "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", // DAI
    "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // USDC
    "0xa649325aa7c5093d12d6f98eb4378deae68ce23f", // BNB
    "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // WETH
    "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6", // WBTC
    "0x5d47bAbA0d66083C52009271faF3F50DCc01023C", // BANANA
  ];
  STABLE_COINS_TEMP = [
    "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", // DAI
    "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // USDC
  ];
  STABLE_ORACLE_POOLS_TEMP = [
    "0xd32f3139a214034a0f9777c87ee0a064c1ff6ae2", // WMATIC/DAI
    "0x65d43b64e3b31965cd5ea367d4c2b94c03084797", // WMATIC/USDT
    "0x019011032a7ac3a87ee885b6c08467ac46ad11cd", // WMATIC/USDC
  ];
} else {
  PROTOCOL_NAME_TEMP = "Apeswap";
  PROTOCOL_SLUG_TEMP = "apeswap";
  NETWORK_TEMP = SchemaNetwork.BSC;

  FACTORY_ADDRESS_TEMP = "0xCf083Be4164828f00cAE704EC15a36D711491284";
  FACTORY_CONTRACT_TEMP = Factory.bind(Address.fromString(FACTORY_ADDRESS_TEMP));

  TRADING_FEE_TEMP = BigDecimal.fromString("2");
  PROTOCOL_FEE_TO_ON_TEMP = BigDecimal.fromString("0.5");
  LP_FEE_TO_ON_TEMP = BigDecimal.fromString("1.5");
  PROTOCOL_FEE_TO_OFF_TEMP = BigDecimal.fromString("0.0");
  LP_FEE_TO_OFF_TEMP = BigDecimal.fromString("2");
  FEE_ON_OFF_TEMP = FeeSwitch.ON;

  REWARD_INTERVAL_TYPE_TEMP = RewardIntervalType.TIMESTAMP;

  NATIVE_TOKEN_TEMP = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";
  WHITELIST_TOKENS_TEMP = [
    "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c", // WBNB
    "0xe9e7cea3dedca5984780bafc599bd69add087d56", // BUSD
    "0x55d398326f99059ff775485246999027b3197955", // USDT
    "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", // USDC
    "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3", // DAI
    "0x4bd17003473389a42daf6a0a729f6fdb328bbbd7", // VAI
    "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c", // BTCB
    "0x2170ed0880ac9a755fd29b2688956bd959f933f8", // WETH
    "0x250632378e573c6be1ac2f97fcdf00515d0aa91b", // BETH
    "0x603c7f932ed1fc6575303d8fb018fdcbb0f39a95", // BANANA
    "0xdDb3Bd8645775F59496c821E4F55A7eA6A6dc299", // GNANA
  ];
  STABLE_COINS_TEMP = [
    "0xe9e7cea3dedca5984780bafc599bd69add087d56", // BUSD
    "0x55d398326f99059ff775485246999027b3197955", // USDT
    "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", // USDC
    "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3", // DAI
  ];
  STABLE_ORACLE_POOLS_TEMP = [
    "0x51e6d27fa57373d8d4c256231241053a70cb1d93", // BUSD/WBNB created block 4857769
    "0xf3010261b58b2874639ca2e860e9005e3be5de0b", // DAI/WBNB created block 481116
    "0x20bcc3b8a0091ddac2d0bc30f68e6cbb97de59cd", // USDT/WBNB created block 648115
  ];
}

export namespace NetworkConfigs {
  export const PROTOCOL_NAME = PROTOCOL_NAME_TEMP;
  export const PROTOCOL_SLUG = PROTOCOL_SLUG_TEMP;
  export const NETWORK = NETWORK_TEMP;

  export const FACTORY_ADDRESS = FACTORY_ADDRESS_TEMP;
  export const FACTORY_CONTRACT = FACTORY_CONTRACT_TEMP;

  export const TRADING_FEE = TRADING_FEE_TEMP;
  export const PROTOCOL_FEE_TO_ON = PROTOCOL_FEE_TO_ON_TEMP;
  export const LP_FEE_TO_ON = LP_FEE_TO_ON_TEMP;
  export const PROTOCOL_FEE_TO_OFF = PROTOCOL_FEE_TO_OFF_TEMP;
  export const LP_FEE_TO_OFF = LP_FEE_TO_OFF_TEMP;
  export const FEE_ON_OFF = FEE_ON_OFF_TEMP;

  export const REWARD_INTERVAL_TYPE = REWARD_INTERVAL_TYPE_TEMP;

  export const NATIVE_TOKEN = NATIVE_TOKEN_TEMP;
  export const WHITELIST_TOKENS = WHITELIST_TOKENS_TEMP;
  export const STABLE_COINS = STABLE_COINS_TEMP;
  export const STABLE_ORACLE_POOLS = STABLE_ORACLE_POOLS_TEMP;
}
