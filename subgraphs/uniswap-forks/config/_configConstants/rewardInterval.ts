import { Network, Protocol } from "../../src/common/constants";
import { Network_StringMap, Protocol_Network_StringMap } from "./types";

const APESWAP_REWARD_INTERVAL: Network_StringMap = {
    [Network.BSC]: "TIMESTAMP",
    [Network.MATIC]: "BLOCK",
}

const SUSHISWAP_REWARD_INTERVAL: Network_StringMap = {
    [Network.MAINNET]: "BLOCK",
    [Network.MATIC]: "TIMESTAMP",
    [Network.FANTOM]: "TIMESTAMP",
    [Network.BSC]: "",
    [Network.XDAI]: "TIMESTAMP",
    [Network.ARBITRUM_ONE]: "TIMESTAMP",
    [Network.AVALANCHE]: "",
    [Network.CELO]: "TIMESTAMP",
    [Network.MOONRIVER]: "TIMESTAMP",
    [Network.FUSE]: "TIMESTAMP",
    [Network.MOONBEAM]: "TIMESTAMP",
}
const UNISWAP_REWARD_INTERVAL: Network_StringMap = {
}

export const _REWARD_INTERVAL: Protocol_Network_StringMap = {
    [Protocol.APESWAP]: APESWAP_REWARD_INTERVAL,
    [Protocol.SUSHISWAP]: SUSHISWAP_REWARD_INTERVAL,
    [Protocol.UNISWAP_V2]: UNISWAP_REWARD_INTERVAL,
}