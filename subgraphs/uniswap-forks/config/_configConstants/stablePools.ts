import { Network, Protocol } from "../../src/common/constants";
import { Network_StringListMap, Protocol_Network_StringListMap } from "./types";

const APESWAP_STABLE_POOLS: Network_StringListMap = {
    [Network.MATIC]: [
        "0x51e6d27fa57373d8d4c256231241053a70cb1d93", // BUSD/WBNB created block 4857769
        "0xf3010261b58b2874639ca2e860e9005e3be5de0b", // DAI/WBNB created block 481116
        "0x20bcc3b8a0091ddac2d0bc30f68e6cbb97de59cd", // USDT/WBNB created block 648115
      ],
    [Network.MATIC]: [
        "0xd32f3139a214034a0f9777c87ee0a064c1ff6ae2", // WMATIC/DAI
        "0x65d43b64e3b31965cd5ea367d4c2b94c03084797", // WMATIC/USDT
        "0x019011032a7ac3a87ee885b6c08467ac46ad11cd", // WMATIC/USDC
      ]
    }

const SUSHISWAP_STABLE_POOLS: Network_StringListMap = {
    [Network.MAINNET]: [
        "0x397ff1542f962076d0bfe58ea045ffa2d347aca0", // wETH/USDC
        "0x06da0fd433c1a5d7a4faa01111c044910a184553", // wETH/USDT
        "0xc3d03e4f041fd4cd388c549ee2a29a9e5075882f", // wETH/DAI
      ],
    [Network.MATIC]: [
        "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // wETH/USDC
        "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", // wETH/USDT
        "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", // wETH/DAI
      ],
    [Network.FANTOM]: [
        "0xa48869049e36f8bfe0cc5cf655632626988c0140", // wETH/USDC
        "0xd019dd7c760c6431797d6ed170bffb8faee11f99", // wETH/USDT
        "0xd32f2eb49e91aa160946f3538564118388d6246a", // wETH/DAI
      ],
    [Network.BSC]: [
        "0xc7632b7b2d768bbb30a404e13e1de48d1439ec21", // wETH/USDC
        "0x2905817b020fd35d9d09672946362b62766f0d69", // wETH/USDT
        "0xe6cf29055e747e95c058f64423d984546540ede5", // wETH/DAI
    ],
    [Network.XDAI]: [
        "0xa227c72a4055a9dc949cae24f54535fe890d3663", // wETH/USDC
        "0x6685c047eab042297e659bfaa7423e94b4a14b9e", // wETH/USDT
      ],
    [Network.ARBITRUM_ONE]: [
        "0x905dfcd5649217c42684f23958568e533c711aa3", // wETH/USDC
        "0xcb0e5bfa72bbb4d16ab5aa0c60601c438f04b4ad", // wETH/USDT
      ],
    [Network.AVALANCHE]: [
        "0x4ed65dab34d5fd4b1eb384432027ce47e90e1185", // wETH/USDC
        "0x09657b445df5bf0141e3ef0f5276a329fc01de01", // wETH/USDT
        "0x55cf10bfbc6a9deaeb3c7ec0dd96d3c1179cb948", // wETH/DAI
      ],
    [Network.MOONRIVER]: [
        "0xb1fdb392fcb3886aea012d5ce70d459d2c77ac08", // wETH/USDC
        "0xb0a594e76a876de40a7fda9819e5c4ec6d9fd222", // wETH/USDT
        "0xc6ca9c83c07a7a3a5461c817ea5210723508a9fd", // wETH/DAI
      ],
    [Network.CELO]: [
        "0x93887e0fa9f6c375b2765a6fe885593f16f077f9", // wETH/USDC
        "0xc77398cfb7b0f7ab42bafc02abc20a69ce8cef7f", // wETH/USDT
        "0xccd9d850ef40f19566cd8df950765e9a1a0b9ef2", // wETH/DAI
      ],
    [Network.FUSE]: [
        "0xba9ca720e314f42e17e80991c1d0affe47387108", // wETH/USDC
        "0xadf3924f44d0ae0242333cde32d75309b30a0fcc", // wETH/USDT
        "0x44f5b873d6b2a2ee8309927e22f3359c7f23d428", // wETH/DAI
      ],
    [Network.MOONBEAM]: [
        "0x6853f323508ba1c33a09c4e956ecb9044cc1a801", // wETH/USDC
        "0x499a09c00911d373fda6c28818d95fa8ca148a60", // wETH/USDT
        "0xa8581e054e239fd7b2fa6db9298b941591f52dbe", // wETH/DAI
      ],
    }

const UNISWAP_STABLE_POOLS: Network_StringListMap = {
    [Network.MAINNET]: [
        "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc", // wETH/USDC created 10008355
        "0xa478c2975ab1ea89e8196811f51a7b7ade33eb11", // wETH/DAI created block 10042267
        "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852", // wETH/USDT created block 10093341
      ]
    }

export const _STABLE_POOLS: Protocol_Network_StringListMap = {
    [Protocol.APESWAP]: APESWAP_STABLE_POOLS,
    [Protocol.SUSHISWAP]: SUSHISWAP_STABLE_POOLS,
    [Protocol.UNISWAP_V2]: UNISWAP_STABLE_POOLS,
}