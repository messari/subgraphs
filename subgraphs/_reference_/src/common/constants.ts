import { BigDecimal, BigInt } from '@graphprotocol/graph-ts';

////////////////////////
///// Schema Enums /////
////////////////////////

export namespace Network {
  export const ARBITRUM = "ARBITRUM"
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

export namespace VaultFeeType {
  export const MANAGEMENT_FEE = "MANAGEMENT_FEE"
  export const PERFORMANCE_FEE = "PERFORMANCE_FEE"
  export const DEPOSIT_FEE = "DEPOSIT_FEE"
  export const WITHDRAWLAL_FEE = "WITHDRAWLAL_FEE"
}

export namespace RewardTokenType {
  export const DEPOSIT = "DEPOSIT"
  export const BORROW = "BORROW"
}

//////////////////////////////
///// Ethereum Addresses /////
//////////////////////////////

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const UNISWAP_V2_FACTORY = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'

export const WETH_ADDRESS   = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
export const USDC_WETH_PAIR = '0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc' // created 10008355
export const DAI_WETH_PAIR  = '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11' // created block 10042267
export const USDT_WETH_PAIR = '0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852' // created block 10093341

////////////////////////
///// Type Helpers /////
////////////////////////

export const DEFAULT_DECIMALS = 18

export const USDC_DECIMALS    = 6
export const USDC_DENOMINATOR = BigDecimal.fromString("1000000")

export const BIGINT_ZERO     = BigInt.fromI32(0)
export const BIGINT_ONE      = BigInt.fromI32(1)
export const BIGINT_TWO      = BigInt.fromI32(2)
export const BIGINT_THOUSAND = BigInt.fromI32(1000)
export const BIGINT_MAX      = BigInt.fromString(
  '115792089237316195423570985008687907853269984665640564039457584007913129639935'
);

export const INT_ZERO = 0 as i32
export const INT_ONE  = 1 as i32
export const INT_TWO  = 2 as i32

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_ONE  = new BigDecimal(BIGINT_ONE);
export const BIGDECIMAL_TWO  = new BigDecimal(BIGINT_TWO);

export const MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));

/////////////////////
///// Date/Time /////
/////////////////////

export const SECONDS_PER_DAY = 60 * 60 * 24 // 86400
export const MS_PER_DAY      = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000))
export const DAYS_PER_YEAR   = new BigDecimal(BigInt.fromI32(365))
export const MS_PER_YEAR     = DAYS_PER_YEAR.times(
  new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000))
)

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export const FACTORY_ADDRESS = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
