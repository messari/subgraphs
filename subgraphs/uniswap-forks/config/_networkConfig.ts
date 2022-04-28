import { Address, BigDecimal, Bytes, dataSource, log } from "@graphprotocol/graph-ts";
import { Factory } from "../generated/Factory/Factory";
import { FeeSwitch, Network } from "../src/common/constants";
import { RewardIntervalType } from "../src/common/rewards";
import { toBytesArray } from "../src/common/utils/utils";

export namespace Protocol {
  export const APESWAP = "Apeswap";
  export const UNISWAPV2 = "Uniswap V2";
}

// Choose which protocol you are indexing. The deployed network will already be determined
let PROTOCOL_NAME_TEMP = Protocol.UNISWAPV2;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
let REWARD_TOKENS_TEMP: string[]; // Address of reward token
let WHITELIST_TOKENS_TEMP: string[]; // A tokens whose amounts should contribute to tracked volume and liquidity
let STABLE_COINS_TEMP: string[]; // A list of stable coins
let STABLE_ORACLE_POOLS_TEMP: string[]; // A list of [stable coin / native token] oracle pools
let UNTRACKED_PAIRS_TEMP: string[]; // rebass tokens, dont count in tracked volume

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
if (PROTOCOL_NAME_TEMP == Protocol.UNISWAPV2 && dataSource.network() == Network.MAINNET.toLowerCase()) {
  PROTOCOL_SLUG_TEMP = "uniswap-v2";
  NETWORK_TEMP = Network.MAINNET;

  FACTORY_ADDRESS_TEMP = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
  FACTORY_CONTRACT_TEMP = Factory.bind(Address.fromString(FACTORY_ADDRESS_TEMP));

  TRADING_FEE_TEMP = BigDecimal.fromString("3");
  PROTOCOL_FEE_TO_ON_TEMP = BigDecimal.fromString("0.5");
  LP_FEE_TO_ON_TEMP = BigDecimal.fromString("2.5");
  PROTOCOL_FEE_TO_OFF_TEMP = BigDecimal.fromString("0.0");
  LP_FEE_TO_OFF_TEMP = BigDecimal.fromString("3");
  FEE_ON_OFF_TEMP = FeeSwitch.OFF;

  NATIVE_TOKEN_TEMP = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
  REWARD_TOKENS_TEMP = [];
  WHITELIST_TOKENS_TEMP = [
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
    "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
    "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT
    "0x0000000000085d4780b73119b644ae5ecd22b376", // TUSD
    "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643", // cDAI
    "0x39aa39c021dfbae8fac545936693ac917d5e7563", // cUSDC
    "0x86fadb80d8d2cff3c3680819e4da99c10232ba0f", // EBASE
    "0x57ab1ec28d129707052df4df418d58a2d46d5f51", // sUSD
    "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2", // MKR
    "0xc00e94cb662c3520282e6f5717214004a7f26888", // COMP
    "0x514910771af9ca656af840dff83e8264ecf986ca", //LINK
    "0x960b236a07cf122663c4303350609a66a7b288c0", //ANT
    "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f", //SNX
    "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e", //YFI
    "0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8", // yCurv
    "0x853d955acef822db058eb8505911ed77f175b99e", // FRAX
    "0xa47c8bf37f92abed4a126bda807a7b7498661acd", // WUST
    "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984", // UNI
    "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", // WBTC
  ];
  STABLE_COINS_TEMP = [
    "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
    "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT
    "0x0000000000085d4780b73119b644ae5ecd22b376", // TUSD
    "0x956f47f50a910163d8bf957cf5846d573e7f87ca", // FEI
    "0x4dd28568d05f09b02220b09c2cb307bfd837cb95",
  ];

  STABLE_ORACLE_POOLS_TEMP = [
    "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc", // USDC/wETH created 10008355
    "0xa478c2975ab1ea89e8196811f51a7b7ade33eb11", // DAI/wETH created block 10042267
    "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852", // USDT/wETH created block 10093341
  ];
  UNTRACKED_PAIRS_TEMP = ["0x9ea3b5b4ec044b70375236a281986106457b20ef"];
} else if (PROTOCOL_NAME_TEMP == Protocol.APESWAP && dataSource.network() == Network.MATIC.toLowerCase()) {
  PROTOCOL_SLUG_TEMP = "apeswap";
  NETWORK_TEMP = Network.MATIC;

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
  REWARD_TOKENS_TEMP = ["0x603c7f932ED1fc6575303D8Fb018fDCBb0f39a95"];
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
} else if (PROTOCOL_NAME_TEMP == Protocol.APESWAP && dataSource.network() == Network.BSC.toLowerCase()) {
  PROTOCOL_SLUG_TEMP = "apeswap";
  NETWORK_TEMP = Network.BSC;

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
  REWARD_TOKENS_TEMP = ["0x5d47bAbA0d66083C52009271faF3F50DCc01023C"];
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
  export const REWARD_TOKENS = REWARD_TOKENS_TEMP;
  export const WHITELIST_TOKENS = WHITELIST_TOKENS_TEMP;
  export const STABLE_COINS = STABLE_COINS_TEMP;
  export const STABLE_ORACLE_POOLS = STABLE_ORACLE_POOLS_TEMP;
  export const UNTRACKED_PAIRS = UNTRACKED_PAIRS_TEMP;
}
