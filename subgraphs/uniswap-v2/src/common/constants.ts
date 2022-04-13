import { BigDecimal, BigInt } from '@graphprotocol/graph-ts';


////////////////////////
///// Schema Enums /////
////////////////////////

export namespace Network {
  export const AVALANCHE = "AVALANCHE"
  export const AURORA = "AURORA"
  export const BSC = "BSC"
  export const CELO = "CELO"
  export const CRONOS = "CRONOS"
  export const ETHEREUM = "ETHEREUM"
  export const FANTOM = "FANTOM"
  export const HARMONY = "HARMONY"
  export const MOONBEAM = "MOONBEAM"
  export const MOONRIVER = "MOONRIVER"
  export const OPTIMISM = "OPTIMISM"
  export const POLYGON = "POLYGON"
  export const XDAI = "XDAI"
}

export namespace ProtocolType {
  export const EXCHANGE = "EXCHANGE"
  export const LENDING = "LENDING"
  export const YIELD = "YIELD"
  export const BRIDGE = "BRIDGE"
  export const GENERIC = "GENERIC"
}

export namespace LiquidityPoolFeeType {
  export const FIXED_TRADING_FEE = "FIXED_TRADING_FEE"
  export const TIERED_TRADING_FEE = "TIERED_TRADING_FEE"
  export const DYNAMIC_TRADING_FEE = "DYNAMIC_TRADING_FEE"
  export const FIXED_LP_FEE = "FIXED_LP_FEE"
  export const DYNAMIC_LP_FEE = "DYNAMIC_LP_FEE"
  export const FIXED_PROTOCOL_FEE = "FIXED_PROTOCOL_FEE"
  export const DYNAMIC_PROTOCOL_FEE = "DYNAMIC_PROTOCOL_FEE"
}

export namespace RewardTokenType {
  export const DEPOSIT = "DEPOSIT"
  export const BORROW = "BORROW"
}

export namespace HelperStoreType {
  export const ETHER = 'ETHER'
  export const USERS = 'USERS'
  // Pool addresses are also stored in the HelperStore
}

export namespace TransferType {
  export const MINT = 'MINT'
  export const BURN = 'BURN'
  // Pool addresses are also stored in the HelperStore
}

export const DEFAULT_DECIMALS = 18;
export const USDC_DECIMALS = 6;
export const USDC_DENOMINATOR = BigDecimal.fromString("1000000");
export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TWO = BigInt.fromI32(2);
export const BIGINT_HUNDRED = BigInt.fromI32(100);
export const BIGINT_THOUSAND = BigInt.fromI32(1000)
export const BIGINT_MAX = BigInt.fromString(
  '115792089237316195423570985008687907853269984665640564039457584007913129639935'
);

export const INT_NEGATIVE_ONE = -1 as i32
export const INT_ZERO = 0 as i32
export const INT_ONE = 1 as i32
export const INT_TWO = 2 as i32
export const INT_FOUR = 4 as i32

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export const BIGDECIMAL_TWO = new BigDecimal(BIGINT_TWO);
export const BIGDECIMAL_HUNDRED = new BigDecimal(BIGINT_HUNDRED);


export const MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));
export const DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const SECONDS_PER_DAY = 60 * 60 * 24;
export const MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export const MS_PER_YEAR = DAYS_PER_YEAR.times(
  new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000))
);

export const TRADING_FEE = BigDecimal.fromString("3")
export const LP_FEE_TO_OFF = BigDecimal.fromString("3")
export const LP_FEE_TO_ON = BigDecimal.fromString("2.5")
export const PROTOCOL_FEE_TO_OFF = BigDecimal.fromString("0")
export const PROTOCOL_FEE_TO_ON = BigDecimal.fromString("0.5")


// minimum liquidity required to count towards tracked volume for pairs with small # of Lps
export let MINIMUM_USD_THRESHOLD_NEW_PAIRS = BigDecimal.fromString('400000')

// minimum liquidity for price to get tracked
export let MINIMUM_LIQUIDITY_THRESHOLD_ETH = BigDecimal.fromString('1')

///////
//////////////
///////

export const FACTORY_ADDRESS = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const NATIVE_TOKEN = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' // WETH

export const STABLE_ORACLE_POOLS: string[] = [
  '0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc', // USDC/wETH created 10008355
  '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11', // DAI/wETH created block 10042267
  '0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852' // USDT/wETH created block 10093341
]

// token where amounts should contribute to tracked volume and liquidity
export let WHITELIST: string[] = [
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
  '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
  '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
  '0x0000000000085d4780b73119b644ae5ecd22b376', // TUSD
  '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643', // cDAI
  '0x39aa39c021dfbae8fac545936693ac917d5e7563', // cUSDC
  '0x86fadb80d8d2cff3c3680819e4da99c10232ba0f', // EBASE
  '0x57ab1ec28d129707052df4df418d58a2d46d5f51', // sUSD
  '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', // MKR
  '0xc00e94cb662c3520282e6f5717214004a7f26888', // COMP
  '0x514910771af9ca656af840dff83e8264ecf986ca', //LINK
  '0x960b236a07cf122663c4303350609a66a7b288c0', //ANT
  '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f', //SNX
  '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e', //YFI
  '0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8', // yCurv
  '0x853d955acef822db058eb8505911ed77f175b99e', // FRAX
  '0xa47c8bf37f92abed4a126bda807a7b7498661acd', // WUST
  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // UNI
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' // WBTC
]

export let STABLE_COINS: string[] = [
  '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
  '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
  '0x0000000000085d4780b73119b644ae5ecd22b376', // TUSD
  '0x956f47f50a910163d8bf957cf5846d573e7f87ca', // FEI
  '0x4dd28568d05f09b02220b09c2cb307bfd837cb95'
]
