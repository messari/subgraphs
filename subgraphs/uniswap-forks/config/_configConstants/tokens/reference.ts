import { Network, Protocol } from "../../../src/common/constants";
import { Network_StringMap, Protocol_Network_StringMap } from "../types";

const APESWAP_REFERENCE_TOKEN: Network_StringMap = {
    [Network.BSC]: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    [Network.MATIC]: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
  }

const SUSHISWAP_REFERENCE_TOKEN: Network_StringMap = {
    [Network.MAINNET]: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    [Network.ARBITRUM_ONE]: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    [Network.BSC]: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    [Network.FANTOM]: '0x74b23882a30290451A17c44f4F05243b6b58C76d',
    [Network.MATIC]: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    [Network.XDAI]: '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1',
    [Network.AVALANCHE]: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
    [Network.CELO]: '0x122013fd7dF1C6F636a5bb8f03108E876548b455',
    [Network.MOONRIVER]: '0x639A647fbe20b6c8ac19E48E2de44ea792c62c5C',
    [Network.FUSE]: '0xa722c13135930332Eb3d749B2F0906559D2C5b99',
    [Network.MOONBEAM]: '0x30D2a9F5FDf90ACe8c17952cbb4eE48a55D916A7',
  }
  
const UNISWAP_REFERENCE_TOKEN: Network_StringMap = {
    [Network.MAINNET]: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
}

export const _REFERENCE_TOKEN: Protocol_Network_StringMap = {
    [Protocol.APESWAP]: APESWAP_REFERENCE_TOKEN,
    [Protocol.SUSHISWAP]: SUSHISWAP_REFERENCE_TOKEN,
    [Protocol.UNISWAP_V2]: UNISWAP_REFERENCE_TOKEN,
}