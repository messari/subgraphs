import { BigDecimal, BigInt, Address } from '@graphprotocol/graph-ts'

export namespace constants {
  export const BIG_INT_ZERO = BigInt.zero()
  export const BIG_DECIMAL_ZERO = BigDecimal.zero()
  export const SECONDS_PER_HOUR = 60 * 60
  export const SECONDS_PER_DAY = 60 * 60 * 24
  export const MAX_BPS = BigInt.fromI32(10000)
  export const DEFAULT_DECIMALS = BigInt.fromI32(18)

  export const CONTROLLER_ADDRESS = Address.fromString(
    '0x222412af183bceadefd72e4cb1b71f1889953b1c'
  )

  export const PROTOCOL_ID = CONTROLLER_ADDRESS

  export const CHAIN_LINK_CONTRACT_ADDRESS = Address.fromString(
    '0x47fb2585d2c56fe188d0e6ec628a38b74fceeedf'
  )

  export const YEARN_LENS_CONTRACT_ADDRESS = Address.fromString(
    '0x83d95e0d5f402511db06817aff3f9ea88224b030'
  )

  export const UNISWAP_ROUTER_CONTRACT_ADDRESS = Address.fromString(
    '0x7a250d5630b4cf539739df2c5dacb4c659f2488d'
  )

  export const CHAIN_LINK_USD_ADDRESS = Address.fromString(
    '0x0000000000000000000000000000000000000348'
  )

  export const USDC_ADDRESS = Address.fromString(
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
  )

  export const WETH_ADDRESS = Address.fromString(
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
  )
}
