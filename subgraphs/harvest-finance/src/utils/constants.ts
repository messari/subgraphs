import { BigDecimal, BigInt, Address } from '@graphprotocol/graph-ts'

export namespace constants {
  export const BIG_INT_ZERO = BigInt.zero()
  export const BIG_INT_TEN = BigInt.fromI32(10)
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

  export const FARM_ADDRESS = Address.fromString(
    '0xa0246c9032bc3a600820415ae600c6388619a14d'
  )

  export const MEGAFACTORY_CONTRACT_ADDRESS = Address.fromString(
    '0xe1ec9151eb8d9a3451b8f623ce8b62632a6d4f4d'
  )

  export const REWARD_TOKEN_TYPE_DEPOSIT = 'DEPOSIT'
  export const REWARD_TOKEN_TYPE_BORROW = 'BORROW'

  export const FEE_TYPE_PERFORMANCE = 'PERFORMANCE_FEE'

  export const MIGRATION_STRATEGIES = [
    '0xf328f799a9c719f446e05385eb64c8a29d3b0674', // WETH
    '0xa3347ce982fde100caab13fd603b42a014c95550', // Dai
    '0x1e716d6a2afe986f534611e5aa03fa95036f9964', // USDC
    '0x0a558a65a3b7c9a5c05c520fb55b17bcab9432e0', // USDT
    '0xc898445efe22dd43ed62e8accbbb4a5670926a74', // renBTC
    '0xc439e9f952600ed8f3e87d94b08dec91c03d3290', // WETH-DAI-LP
    '0x6c91cea46f54897a039998ad5578e7066fcb2fa3', // WETH-USDC-LP
    '0xb1eb7afe51f1663f07cd3961171e89f43f67f7c5', // WETH-USDT-LP
    '0x4a892b63409e222b6ea4af69dff8e1626a4e535c', // WETH-WBTC-LP
  ]
}
