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

export const PROTOCOL_ID = '0x222412af183BCeAdEFd72e4Cb1b71f1889953b1C'

export const BIGDECIMAL_ZERO = BigDecimal.fromString('0')

export const DEFAULT_DECIMALS = 18
