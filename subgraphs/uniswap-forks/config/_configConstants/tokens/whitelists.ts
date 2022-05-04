
import { Network, Protocol } from "../../../src/common/constants"
import { Network_StringListMap, Protocol_Network_StringListMap } from "../types";

const APESWAP_WHITELISTS: Network_StringListMap = {
    [Network.BSC]: [
        "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WMATIC
        "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", // DAI
        "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT
        "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // USDC
        "0xa649325aa7c5093d12d6f98eb4378deae68ce23f", // BNB
        "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // WETH
        "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6", // WBTC
        "0x5d47bAbA0d66083C52009271faF3F50DCc01023C", // BANANA
      ],
    [Network.MATIC]: [
        "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WMATIC
        "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", // DAI
        "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT
        "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // USDC
        "0xa649325aa7c5093d12d6f98eb4378deae68ce23f", // BNB
        "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // WETH
        "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6", // WBTC
        "0x5d47bAbA0d66083C52009271faF3F50DCc01023C", // BANANA
      ]
}

const SUSHISWAP_WHITELISTS: Network_StringListMap = {
    [Network.MAINNET]: [
        "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
        "0x6b175474e89094c44da98b954eedeac495271d0f",
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "0x383518188c0c6d7730d91b2c03a03c837814a899",
        "0xdac17f958d2ee523a2206206994597c13d831ec7",
        "0x0000000000085d4780b73119b644ae5ecd22b376",
        "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643",
        "0x57ab1ec28d129707052df4df418d58a2d46d5f51",
        "0x514910771af9ca656af840dff83e8264ecf986ca",
        "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e",
        "0x8798249c2e607446efb7ad49ec89dd1865ff4272",
        "0x1456688345527be1f37e9e627da0837d6f08c925",
        "0x3449fc1cd036255ba1eb19d65ff4ba2b8903a69a",
        "0x2ba592f78db6436527729929aaf6c908497cb200",
        "0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0",
        "0xa1faa113cbe53436df28ff0aee54275c13b40975",
        "0xdb0f18081b505a7de20b18ac41856bcb4ba86a1a",
        "0x04fa0d235c4abf4bcf4787af4cf447de572ef828",
        "0x3155ba85d5f96b2d030a4966af206230e46849cb",
        "0x87d73e916d7057945c9bcd8cdd94e42a6f47f776",
        "0xdfe66b14d37c77f4e9b180ceb433d1b164f0281d",
        "0xad32a8e6220741182940c5abf610bde99e737b2d",
        "0xafcE9B78D409bF74980CACF610AFB851BF02F257",
        "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2"
      ],
    [Network.MATIC]: [
        "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
        "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
        "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
        "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
        "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
        "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
        "0x0b3f868e0be5597d5db7feb59e1cadbb0fdda50a",
        "0xd6df932a45c0f255f85145f286ea0b292b21c90b",
        "0x104592a158490a9228070e0a8e5343b499e125d0",
        "0x2f800db0fdb5223b3c3f354886d907a671414a7f",
        "0x45c32fa6df82ead1e2ef74d17b76547eddfaff89",
        "0x34d4ab47bee066f361fa52d792e69ac7bd05ee23",
        "0xe8377a076adabb3f9838afb77bee96eac101ffb1",
        "0x61daecab65ee2a1d5b6032df030f3faa3d116aa7",
        "0xd3f07ea86ddf7baebefd49731d7bbd207fedc53b"
      ],
    [Network.FANTOM]: [
        "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83",
        "0xad84341756bf337f5a0164515b1f6f993d194e1f",
        "0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e",
        "0x74b23882a30290451a17c44f4f05243b6b58c76d",
        "0x04068da6c83afcfa0e13ba15a6696662335d5b75"
      ],
    [Network.BSC]: [
        "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
        "0x2170ed0880ac9a755fd29b2688956bd959f933f8",
        "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c",
        "0x55d398326f99059ff775485246999027b3197955",
        "0xe9e7cea3dedca5984780bafc599bd69add087d56",
        "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3",
        "0xf16e81dce15b08f326220742020379b855b87df9"
    ],
    [Network.XDAI]: [
        "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1",
        "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
        "0x8e5bbbb09ed1ebde8674cda39a0c169401db4252",
        "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83",
        "0x4ecaba5870353805a9f068101a40e0f32ed605c6",
        "0x82dfe19164729949fd66da1a37bc70dd6c4746ce",
        "0x44fa8e6f47987339850636f88629646662444217",
        "0xfe7ed09c4956f7cdb54ec4ffcb9818db2d7025b8"
      ],
    [Network.ARBITRUM_ONE]: [
        "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
        "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
        "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
        "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8"
      ],
    [Network.AVALANCHE]: [
        "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",
        "0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab",
        "0x50b7545627a5162f82a992c33b87adc75187b218",
        "0x130966628846bfd36ff31a822705796e8cb8c18d",
        "0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664",
        "0xc7198437980c041c805a1edcba50c1ce5db95118",
        "0xd586e7f844cea2f87f50152665bcbc2c279d8d70",
        "0x37b608519f91f70f2eeb0e5ed9af4061722e4f76",
        "0xb54f16fb19478766a268f172c9480f8da1a7c9c3",
        "0xce1bffbd5374dac86a2893119683f4911a2f7814"
      ],
    [Network.MOONRIVER]: [
        "0x639a647fbe20b6c8ac19e48e2de44ea792c62c5c",
        "0xf50225a84382c74cbdea10b0c176f71fc3de0c4d",
        "0xe6a991ffa8cfe62b0bf6bf72959a3d4f11b2e0f5",
        "0x1a93b23281cc1cde4c4741353f3064709a16197d",
        "0xb44a9b6905af7c801311e8f4e76932ee959c663c",
        "0xe3f5a90f9cb311505cd691a46596599aa1a0ad7d",
        "0x80a16016cc4a2e6a2caca8a4a498b1699ff0f844",
        "0x0cae51e1032e8461f4806e26332c030e34de3adb"
      ],
    [Network.CELO]: [
        "0x471ece3750da237f93b8e339c536989b8978a438",
        "0x765de816845861e75a25fca122bb6898b8b1282a",
        "0xef4229c8c3250c675f21bcefa42f58efbff6002a",
        "0x88eec49252c8cbc039dcdb394c0c2ba2f1637ea0",
        "0x90ca507a5d4458a4c6c6249d186b6dcb02a5bccd",
        "0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73",
        "0xbaab46e28388d2779e6e31fd00cf0e5ad95e327b"
      ],
    [Network.FUSE]: [
        "0x0be9e53fd7edac9f859882afdda116645287c629",
        "0xa722c13135930332eb3d749b2f0906559d2c5b99",
        "0x33284f95ccb7b948d9d352e1439561cf83d8d00d",
        "0x620fd5fa44be6af63715ef4e65ddfa0387ad13f5",
        "0x94ba7a27c7a95863d1bdc7645ac2951e0cca06ba",
        "0xfadbbf8ce7d5b7041be672561bba99f79c532e10",
        "0x249be57637d8b013ad64785404b24aebae9b098b" 
      ],
    [Network.MOONBEAM]: [
        "0xacc15dc74880c9944775448304b263d191c6077f",
        "0x8f552a71efe5eefc207bf75485b356a0b3f01ec9",
        "0x1dc78acda13a8bc4408b207c9e48cdbc096d95e0",
        "0x8e70cd5b4ff3f62659049e74b6649c6603a0e594",
        "0x30d2a9f5fdf90ace8c17952cbb4ee48a55d916a7",
        "0xc234a67a4f840e61ade794be47de455361b52413",
        "0x085416975fe14c2a731a97ec38b9bf8135231f62",
        "0x322e86852e492a7ee17f28a78c663da38fb33bfb"
      ],
  }

const UNISWAP_WHITELISTS: Network_StringListMap = {
    [Network.MAINNET]: [
        "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
        "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
        "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT
        "0x0000000000085d4780b73119b644ae5ecd22b376", // TUSD
        "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643", // cDAI
        "0x39aa39c021dfbae8fac545936693ac917d5e7563", // cUSDC
        "0x86fadb80d8d2cff3c3680819e4da99c10232ba0f", // EBASE
        "0x57ab1ec28d129707052df4df418d58a2d46d5f51", // sUSD
        "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2", // MKR
        "0xc00e94cb662c3520282e6f5717214004a7f26888", // COMP
        "0x514910771af9ca656af840dff83e8264ecf986ca", //LINK
        "0x960b236a07cf122663c4303350609a66a7b288c0", //ANT
        "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f", //SNX
        "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e", //YFI
        "0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8", // yCurv
        "0x853d955acef822db058eb8505911ed77f175b99e", // FRAX
        "0xa47c8bf37f92abed4a126bda807a7b7498661acd", // WUST
        "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984", // UNI
        "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", // WBTC
      ]
}

export const _WHITELISTS: Protocol_Network_StringListMap = {
    [Protocol.APESWAP]: APESWAP_WHITELISTS,
    [Protocol.SUSHISWAP]: SUSHISWAP_WHITELISTS,
    [Protocol.UNISWAP_V2]: UNISWAP_WHITELISTS,
}