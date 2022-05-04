import { Network, Protocol } from "../../../src/common/constants";
import { Network_StringListMap, Protocol_Network_StringListMap } from "./../types";

const APESWAP_UNTRACKED_PAIRS: Network_StringListMap = {
    [Network.MATIC]: [],
    [Network.MATIC]: []
    }

const SUSHISWAP_UNTRACKED_PAIRS: Network_StringListMap = {
    [Network.MAINNET]: [],
    [Network.MATIC]: [],
    [Network.FANTOM]: [],
    [Network.BSC]: [],
    [Network.XDAI]: [],
    [Network.ARBITRUM_ONE]: [],
    [Network.AVALANCHE]: [],
    [Network.MOONRIVER]: [],
    [Network.CELO]: [],
    [Network.FUSE]: [],
    [Network.MOONBEAM]: [],
    }

const UNISWAP_UNTRACKED_PAIRS: Network_StringListMap = {
    [Network.MAINNET]: ["0x9ea3b5b4ec044b70375236a281986106457b20ef"]
    }

export const _UNTRACKED_PAIRS: Protocol_Network_StringListMap = {
    [Protocol.APESWAP]: APESWAP_UNTRACKED_PAIRS,
    [Protocol.SUSHISWAP]: SUSHISWAP_UNTRACKED_PAIRS,
    [Protocol.UNISWAP_V2]: UNISWAP_UNTRACKED_PAIRS,
}