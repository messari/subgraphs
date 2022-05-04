import { BigDecimal } from "@graphprotocol/graph-ts";
import { Network, Protocol } from "../../src/common/constants";
import { Network_StringMap, Network_BigDecimalMap, Protocol_Network_StringMap, Protocol_Network_BigDecimalMap } from "./types";

// APESWAP FEES
const APESWAP_TRADING_FEE: Network_BigDecimalMap = {
    [Network.BSC]: BigDecimal.fromString("2"),
    [Network.MATIC]: BigDecimal.fromString("2"),
}

const APESWAP_PROTOCOL_FEE_TO_ON: Network_BigDecimalMap = {
    [Network.BSC]: BigDecimal.fromString("0.5"),
    [Network.MATIC]: BigDecimal.fromString("1.5"),
}

const APESWAP_PROTOCOL_FEE_TO_OFF: Network_BigDecimalMap = {
    [Network.BSC]: BigDecimal.fromString("0.0"),
    [Network.MATIC]: BigDecimal.fromString("0.0"),
}

const APESWAP_LP_FEE_TO_ON: Network_BigDecimalMap = {
    [Network.BSC]: BigDecimal.fromString("1.5"),
    [Network.MATIC]: BigDecimal.fromString("0.5"),
}

const APESWAP_LP_FEE_TO_OFF: Network_BigDecimalMap = {
    [Network.BSC]: BigDecimal.fromString("2"),
    [Network.MATIC]: BigDecimal.fromString("2"),
}

const APESWAP_FEE_SWITCH: Network_StringMap = {
    [Network.BSC]: "ON",
    [Network.MATIC]: "ON",
}

// SUSHISWAP FEES
const SUSHISWAP_TRADING_FEE: Network_BigDecimalMap = {
    [Network.ARBITRUM_ONE]: BigDecimal.fromString("3"),
    [Network.AVALANCHE]: BigDecimal.fromString("3"),
    [Network.BSC]: BigDecimal.fromString("3"),
    [Network.CELO]: BigDecimal.fromString("3"),
    [Network.FANTOM]: BigDecimal.fromString("3"),
    [Network.FUSE]: BigDecimal.fromString("3"),
    [Network.MAINNET]: BigDecimal.fromString("3"),
    [Network.MATIC]: BigDecimal.fromString("3"),
    [Network.MOONBEAM]: BigDecimal.fromString("3"),
    [Network.MOONRIVER]: BigDecimal.fromString("3"),
    [Network.XDAI]: BigDecimal.fromString("3"),
}

const SUSHISWAP_PROTOCOL_FEE_TO_ON: Network_BigDecimalMap = {
    [Network.ARBITRUM_ONE]: BigDecimal.fromString("0.5"),
    [Network.AVALANCHE]: BigDecimal.fromString("0.5"),
    [Network.BSC]: BigDecimal.fromString("0.5"),
    [Network.CELO]: BigDecimal.fromString("0.5"),
    [Network.FANTOM]: BigDecimal.fromString("0.5"),
    [Network.FUSE]: BigDecimal.fromString("0.5"),
    [Network.MAINNET]: BigDecimal.fromString("0.5"),
    [Network.MATIC]: BigDecimal.fromString("0.5"),
    [Network.MOONBEAM]: BigDecimal.fromString("0.5"),
    [Network.MOONRIVER]: BigDecimal.fromString("0.5"),
    [Network.XDAI]: BigDecimal.fromString("0.5"),
}

const SUSHISWAP_PROTOCOL_FEE_TO_OFF: Network_BigDecimalMap = {
    [Network.ARBITRUM_ONE]: BigDecimal.fromString("0.0"),
    [Network.AVALANCHE]: BigDecimal.fromString("0.0"),
    [Network.BSC]: BigDecimal.fromString("0.0"),
    [Network.CELO]: BigDecimal.fromString("0.0"),
    [Network.FANTOM]: BigDecimal.fromString("0.0"),
    [Network.FUSE]: BigDecimal.fromString("0.0"),
    [Network.MAINNET]: BigDecimal.fromString("0.0"),
    [Network.MATIC]: BigDecimal.fromString("0.0"),
    [Network.MOONBEAM]: BigDecimal.fromString("0.0"),
    [Network.MOONRIVER]: BigDecimal.fromString("0.0"),
    [Network.XDAI]: BigDecimal.fromString("0.0"),
}

const SUSHISWAP_LP_FEE_TO_ON: Network_BigDecimalMap = {
    [Network.ARBITRUM_ONE]: BigDecimal.fromString("2.5"),
    [Network.AVALANCHE]: BigDecimal.fromString("2.5"),
    [Network.BSC]: BigDecimal.fromString("2.5"),
    [Network.CELO]: BigDecimal.fromString("2.5"),
    [Network.FANTOM]: BigDecimal.fromString("2.5"),
    [Network.FUSE]: BigDecimal.fromString("2.5"),
    [Network.MAINNET]: BigDecimal.fromString("2.5"),
    [Network.MATIC]: BigDecimal.fromString("2.5"),
    [Network.MOONBEAM]: BigDecimal.fromString("2.5"),
    [Network.MOONRIVER]: BigDecimal.fromString("2.5"),
    [Network.XDAI]: BigDecimal.fromString("2.5"),
}

const SUSHISWAP_LP_FEE_TO_OFF: Network_BigDecimalMap = {
    [Network.ARBITRUM_ONE]: BigDecimal.fromString("3"),
    [Network.AVALANCHE]: BigDecimal.fromString("3"),
    [Network.BSC]: BigDecimal.fromString("3"),
    [Network.CELO]: BigDecimal.fromString("3"),
    [Network.FANTOM]: BigDecimal.fromString("3"),
    [Network.FUSE]: BigDecimal.fromString("3"),
    [Network.MAINNET]: BigDecimal.fromString("3"),
    [Network.MATIC]: BigDecimal.fromString("3"),
    [Network.MOONBEAM]: BigDecimal.fromString("3"),
    [Network.MOONRIVER]: BigDecimal.fromString("3"),
    [Network.XDAI]: BigDecimal.fromString("3"),
}

const SUSHISWAP_FEE_SWITCH: Network_StringMap = {
    [Network.ARBITRUM_ONE]: "ON",
    [Network.AVALANCHE]: "ON",
    [Network.BSC]: "ON",
    [Network.CELO]: "ON",
    [Network.FANTOM]: "ON",
    [Network.FUSE]: "ON",
    [Network.MAINNET]: "ON",
    [Network.MATIC]: "ON",
    [Network.MOONBEAM]: "ON",
    [Network.MOONRIVER]: "ON",
    [Network.XDAI]: "ON",
}

// UNISWAP FEES
const UNISWAP_TRADING_FEE: Network_BigDecimalMap = {
    [Network.MAINNET]: BigDecimal.fromString("3"),
}

const UNISWAP_PROTOCOL_FEE_TO_ON: Network_BigDecimalMap = {
    [Network.MAINNET]: BigDecimal.fromString("0.5"),
}

const UNISWAP_PROTOCOL_FEE_TO_OFF: Network_BigDecimalMap = {
    [Network.MAINNET]: BigDecimal.fromString("0.0"),
}

const UNISWAP_LP_FEE_TO_ON: Network_BigDecimalMap = {
    [Network.MAINNET]: BigDecimal.fromString("2.5"),
}

const UNISWAP_LP_FEE_TO_OFF: Network_BigDecimalMap = {
    [Network.MAINNET]: BigDecimal.fromString("3"),
}

const UNISWAP_FEE_SWITCH: Network_StringMap = {
    [Network.MAINNET]: "OFF",
}


export const _TRADING_FEE: Protocol_Network_BigDecimalMap = {
    [Protocol.APESWAP]: APESWAP_TRADING_FEE,
    [Protocol.SUSHISWAP]: SUSHISWAP_TRADING_FEE,
    [Protocol.UNISWAP_V2]: UNISWAP_TRADING_FEE,
}
export const _PROTOCOL_FEE_TO_ON: Protocol_Network_BigDecimalMap = {
    [Protocol.APESWAP]: APESWAP_PROTOCOL_FEE_TO_ON,
    [Protocol.SUSHISWAP]: SUSHISWAP_PROTOCOL_FEE_TO_ON,
    [Protocol.UNISWAP_V2]: UNISWAP_PROTOCOL_FEE_TO_ON,
}
export const _PROTOCOL_FEE_TO_OFF: Protocol_Network_BigDecimalMap = {
    [Protocol.APESWAP]: APESWAP_PROTOCOL_FEE_TO_OFF,
    [Protocol.SUSHISWAP]: SUSHISWAP_PROTOCOL_FEE_TO_OFF,
    [Protocol.UNISWAP_V2]: UNISWAP_PROTOCOL_FEE_TO_OFF,
}
export const _LP_FEE_TO_ON: Protocol_Network_BigDecimalMap = {
    [Protocol.APESWAP]: APESWAP_LP_FEE_TO_ON,
    [Protocol.SUSHISWAP]: SUSHISWAP_LP_FEE_TO_ON,
    [Protocol.UNISWAP_V2]: UNISWAP_LP_FEE_TO_ON,
}
export const _LP_FEE_TO_OFF: Protocol_Network_BigDecimalMap = {
    [Protocol.APESWAP]: APESWAP_LP_FEE_TO_OFF,
    [Protocol.SUSHISWAP]: SUSHISWAP_LP_FEE_TO_OFF,
    [Protocol.UNISWAP_V2]: UNISWAP_LP_FEE_TO_OFF,
}
export const _FEE_SWITCH: Protocol_Network_StringMap = {
    [Protocol.APESWAP]: APESWAP_FEE_SWITCH,
    [Protocol.SUSHISWAP]: SUSHISWAP_FEE_SWITCH,
    [Protocol.UNISWAP_V2]: UNISWAP_FEE_SWITCH,
}

