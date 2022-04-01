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

export const MEGA_FACTORY_ADDRESS = '0xE1EC9151Eb8D9a3451B8F623CE8b62632a6D4f4D'

export const BIGDECIMAL_ZERO = BigDecimal.fromString('0')

export const BIGINT_ZERO = BigInt.fromString('0')

export const DEFAULT_DECIMALS = 18

export const ETH_MAINNET_CALCULATIONS_CURVE_ADDRESS = ''

export const ETH_MAINNET_CALCULATIONS_SUSHI_ADDRESS = ''

export const USDC_DENOMINATOR = BigInt.fromString("1000000");

export const SECONDS_PER_DAY = 60 * 60 * 24
