import { BigDecimal, BigInt } from "@graphprotocol/graph-ts"

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

export const PROTOCOL_ID = '0xc803737D3E12CC4034Dde0B2457684322100Ac38'

export const DEFAULT_DECIMALS = 18

export const BIGDECIMAL_ZERO = BigDecimal.fromString('0')

export const BIGINT_ZERO = BigInt.fromString('0')

export const USDC_DENOMINATOR = BigDecimal.fromString('6')

export const ETH_MAINNET_USDC_ORACLE_ADDRESS = "0x83d95e0d5f402511db06817aff3f9ea88224b030"

export const SECONDS_PER_DAY = 60 * 60 * 24
