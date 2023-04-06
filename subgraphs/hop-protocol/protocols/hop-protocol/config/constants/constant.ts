import { Address } from '@graphprotocol/graph-ts'

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export namespace XdaiBridge {
	export const USDC = '0x25D8039bB044dC227f741a9e381CA4cEAE2E6aE8'.toLowerCase()
	export const USDT = '0xFD5a186A7e8453Eb867A360526c5d987A00ACaC2'.toLowerCase()
	export const MATIC = '0x7ac71c29fEdF94BAc5A5C9aB76E1Dd12Ea885CCC'.toLowerCase()
	export const DAI = '0x0460352b91D7CF42B0E1C1c30f06B602D9ef2238'.toLowerCase()
	export const ETH = '0xD8926c12C0B2E5Cd40cFdA49eCaFf40252Af491B'.toLowerCase()
}
export namespace XdaiAmm {
	export const USDC = '0x5C32143C8B198F392d01f8446b754c181224ac26'.toLowerCase()
	export const USDT = '0x3Aa637D6853f1d9A9354FE4301Ab852A88b237e7'.toLowerCase()
	export const MATIC = '0xaa30D6bba6285d0585722e2440Ff89E23EF68864'.toLowerCase()
	export const DAI = '0x24afDcA4653042C6D08fb1A754b2535dAcF6Eb24'.toLowerCase()
	export const ETH = '0x4014DC015641c08788F15bD6eB20dA4c47D936d8'.toLowerCase()
}

export namespace XdaiToken {
	export const USDC = '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83'.toLowerCase()
	export const USDT = '0x4ECaBa5870353805a9F068101A40E0f32ed605C6'.toLowerCase()
	export const MATIC = '0x7122d7661c4564b7C6Cd4878B06766489a6028A2'.toLowerCase()
	export const DAI = '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'.toLowerCase()
	export const ETH = '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1'.toLowerCase()
}

export namespace XdaiHtoken {
	export const USDC = '0x9ec9551d4A1a1593b0ee8124D98590CC71b3B09D'.toLowerCase()
	export const USDT = '0x91f8490eC27cbB1b2FaEdd29c2eC23011d7355FB'.toLowerCase()
	export const MATIC = '0xE38faf9040c7F09958c638bBDB977083722c5156'.toLowerCase()
	export const DAI = '0xB1ea9FeD58a317F81eEEFC18715Dd323FDEf45c4'.toLowerCase()
	export const ETH = '0xc46F2004006d4C770346f60a7BaA3f1Cc67dFD1c'.toLowerCase()
}
export namespace XdaiRewardToken {
	export const USDC_A = '0x5D13179c5fa40b87D53Ff67ca26245D3D5B2F872'.toLowerCase()
	export const USDC_B = '0x636A7ee78faCd079DaBC8f81EDA1D09AA9D440A7'.toLowerCase()
	export const USDT_A = '0x2C2Ab81Cf235e86374468b387e241DF22459A265'.toLowerCase()
	export const USDT_B = '0x3d4Cc8A61c7528Fd86C55cfe061a78dCBA48EDd1'.toLowerCase()
	export const DAI_A = '0x12a3a66720dD925fa93f7C895bC20Ca9560AdFe7'.toLowerCase()
	export const DAI_B = '0xBF7a02d963b23D84313F07a04ad663409CEE5A92'.toLowerCase()
	export const ETH_A = '0xC61bA16e864eFbd06a9fe30Aab39D18B8F63710a'.toLowerCase()
	export const ETH_B = '0x712F0cf37Bdb8299D0666727F73a5cAbA7c1c24c'.toLowerCase()
}
export namespace MainnetToken {
	export const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'.toLowerCase()
	export const USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7'.toLowerCase()
	export const MATIC = '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0'.toLowerCase()
	export const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'.toLowerCase()
	export const ETH = ZERO_ADDRESS.toLowerCase()
	export const SNX = '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f'.toLowerCase()
}

export namespace MainnetBridge {
	export const USDC = '0x3666f603Cc164936C1b87e207F36BEBa4AC5f18a'.toLowerCase()
	export const USDT = '0x3E4a3a4796d16c0Cd582C382691998f7c06420B6'.toLowerCase()
	export const MATIC = '0x22B1Cbb8D98a01a3B71D034BB899775A76Eb1cc2'.toLowerCase()
	export const DAI = '0x3d4Cc8A61c7528Fd86C55cfe061a78dCBA48EDd1'.toLowerCase()
	export const ETH = '0xb8901acB165ed027E32754E0FFe830802919727f'.toLowerCase()
	export const SNX = '0x893246FACF345c99e4235E5A7bbEE7404c988b96'.toLowerCase()
}

export namespace ArbitrumBridge {
	export const USDC = '0x0e0E3d2C5c292161999474247956EF542caBF8dd'.toLowerCase()
	export const USDT = '0x72209Fe68386b37A40d6bCA04f78356fd342491f'.toLowerCase()
	export const DAI = '0x7aC115536FE3A185100B2c4DE4cb328bf3A58Ba6'.toLowerCase()
	export const ETH = '0x3749C4f034022c39ecafFaBA182555d4508caCCC'.toLowerCase()
}
export namespace ArbitrumAmm {
	export const USDC = '0x10541b07d8Ad2647Dc6cD67abd4c03575dade261'.toLowerCase()
	export const USDT = '0x18f7402B673Ba6Fb5EA4B95768aABb8aaD7ef18a'.toLowerCase()
	export const DAI = '0xa5A33aB9063395A90CCbEa2D86a62EcCf27B5742'.toLowerCase()
	export const ETH = '0x652d27c0F72771Ce5C76fd400edD61B406Ac6D97'.toLowerCase()
}

export namespace ArbitrumToken {
	export const USDC = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'.toLowerCase()
	export const USDT = '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'.toLowerCase()
	export const DAI = '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'.toLowerCase()
	export const ETH = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'.toLowerCase()
}

export namespace ArbitrumHtoken {
	export const USDC = '0x0ce6c85cF43553DE10FC56cecA0aef6Ff0DD444d'.toLowerCase()
	export const USDT = '0x12e59C59D282D2C00f3166915BED6DC2F5e2B5C7'.toLowerCase()
	export const DAI = '0x46ae9BaB8CEA96610807a275EBD36f8e916b5C61'.toLowerCase()
	export const ETH = '0xDa7c0de432a9346bB6e96aC74e3B61A36d8a77eB'.toLowerCase()
}

export namespace ArbitrumRewardToken {
	export const USDC = '0xb0CabFE930642AD3E7DECdc741884d8C3F7EbC70'.toLowerCase()
	export const USDT = '0x9Dd8685463285aD5a94D2c128bda3c5e8a6173c8'.toLowerCase()
	export const DAI = '0xd4D28588ac1D9EF272aa29d4424e3E2A03789D1E'.toLowerCase()
	export const ETH = '0x755569159598f3702bdD7DFF6233A317C156d3Dd'.toLowerCase()
}

export namespace OptimismBridge {
	export const USDC = '0xa81D244A1814468C734E5b4101F7b9c0c577a8fC'.toLowerCase()
	export const USDT = '0x46ae9BaB8CEA96610807a275EBD36f8e916b5C61'.toLowerCase()
	export const DAI = '0x7191061D5d4C60f598214cC6913502184BAddf18'.toLowerCase()
	export const ETH = '0x83f6244Bd87662118d96D9a6D44f09dffF14b30E'.toLowerCase()
	export const SNX = '0x16284c7323c35F4960540583998C98B1CfC581a7'.toLowerCase()
}
export namespace OptimismAmm {
	export const USDC = '0x3c0FFAca566fCcfD9Cc95139FEF6CBA143795963'.toLowerCase()
	export const USDT = '0xeC4B41Af04cF917b54AEb6Df58c0f8D78895b5Ef'.toLowerCase()
	export const DAI = '0xF181eD90D6CfaC84B8073FdEA6D34Aa744B41810'.toLowerCase()
	export const ETH = '0xaa30D6bba6285d0585722e2440Ff89E23EF68864'.toLowerCase()
	export const SNX = '0x1990BC6dfe2ef605Bfc08f5A23564dB75642Ad73'.toLowerCase()
}

export namespace OptimismToken {
	export const USDC = '0x7F5c764cBc14f9669B88837ca1490cCa17c31607'.toLowerCase()
	export const USDT = '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58'.toLowerCase()
	export const DAI = '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'.toLowerCase()
	export const ETH = '0x4200000000000000000000000000000000000006'.toLowerCase()
	export const SNX = '0x8700dAec35aF8Ff88c16BdF0418774CB3D7599B4'.toLowerCase()
}

export namespace OptimismHtoken {
	export const USDC = '0x25D8039bB044dC227f741a9e381CA4cEAE2E6aE8'.toLowerCase()
	export const USDT = '0x2057C8ECB70Afd7Bee667d76B4CD373A325b1a20'.toLowerCase()
	export const DAI = '0x56900d66D74Cb14E3c86895789901C9135c95b16'.toLowerCase()
	export const ETH = '0xE38faf9040c7F09958c638bBDB977083722c5156'.toLowerCase()
	export const SNX = '0x13B7F51BD865410c3AcC4d56083C5B56aB38D203'.toLowerCase()
}

export namespace OptimismRewardToken {
	export const USDC = '0xf587B9309c603feEdf0445aF4D3B21300989e93a'.toLowerCase()
	export const USDT = '0xAeB1b49921E0D2D96FcDBe0D486190B2907B3e0B'.toLowerCase()
	export const DAI = '0x392B9780cFD362bD6951edFA9eBc31e68748b190'.toLowerCase()
	export const ETH = '0x95d6A95BECfd98a7032Ed0c7d950ff6e0Fa8d697'.toLowerCase()
	export const SNX_A = '0x25a5A48C35e75BD2EFf53D94f0BB60d5A00E36ea'.toLowerCase()
	export const SNX_B = '0x09992Dd7B32f7b35D347DE9Bdaf1919a57d38E82'.toLowerCase()
}

export namespace PolygonBridge {
	export const USDC = '0x25D8039bB044dC227f741a9e381CA4cEAE2E6aE8'.toLowerCase()
	export const USDT = '0x6c9a1ACF73bd85463A46B0AFc076FBdf602b690B'.toLowerCase()
	export const DAI = '0xEcf268Be00308980B5b3fcd0975D47C4C8e1382a'.toLowerCase()
	export const ETH = '0xb98454270065A31D71Bf635F6F7Ee6A518dFb849'.toLowerCase()
	export const MATIC = '0x553bC791D746767166fA3888432038193cEED5E2'.toLowerCase()
}
export namespace PolygonAmm {
	export const USDC = '0x5C32143C8B198F392d01f8446b754c181224ac26'.toLowerCase()
	export const USDT = '0xB2f7d27B21a69a033f85C42d5EB079043BAadC81'.toLowerCase()
	export const DAI = '0x25FB92E505F752F730cAD0Bd4fa17ecE4A384266'.toLowerCase()
	export const ETH = '0x266e2dc3C4c59E42AA07afeE5B09E964cFFe6778'.toLowerCase()
	export const MATIC = '0x3d4Cc8A61c7528Fd86C55cfe061a78dCBA48EDd1'.toLowerCase()
}

export namespace PolygonToken {
	export const USDC = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'.toLowerCase()
	export const USDT = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'.toLowerCase()
	export const DAI = '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'.toLowerCase()
	export const ETH = '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'.toLowerCase()
	export const MATIC = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'.toLowerCase()
}

export namespace PolygonHtoken {
	export const USDC = '0x9ec9551d4A1a1593b0ee8124D98590CC71b3B09D'.toLowerCase()
	export const USDT = '0x9F93ACA246F457916E49Ec923B8ed099e313f763'.toLowerCase()
	export const DAI = '0xb8901acB165ed027E32754E0FFe830802919727f'.toLowerCase()
	export const ETH = '0x1fDeAF938267ca43388eD1FdB879eaF91e920c7A'.toLowerCase()
	export const MATIC = '0x712F0cf37Bdb8299D0666727F73a5cAbA7c1c24c'.toLowerCase()
}
export namespace PolygonRewardToken {
	export const USDC = '0x7811737716942967Ae6567B26a5051cC72af550E'.toLowerCase()
	export const USDT = '0x297E5079DF8173Ae1696899d3eACD708f0aF82Ce'.toLowerCase()
	export const DAI = '0xd6dC6F69f81537Fe9DEcc18152b7005B45Dc2eE7'.toLowerCase()
	export const ETH = '0xAA7b3a4A084e6461D486E53a03CF45004F0963b7'.toLowerCase()
}

export const priceTokens = [
	OptimismToken.USDC,
	OptimismToken.USDT,
	OptimismToken.DAI,
	OptimismHtoken.USDT,
	OptimismHtoken.USDC,
	OptimismHtoken.DAI,

	XdaiToken.USDC,
	XdaiHtoken.USDC,
	XdaiToken.USDT,
	XdaiHtoken.USDT,
	XdaiToken.DAI,
	XdaiHtoken.DAI,

	PolygonToken.USDC,
	PolygonToken.USDT,
	PolygonHtoken.USDC,
	PolygonHtoken.USDT,
	PolygonToken.DAI,
	PolygonHtoken.DAI,

	ArbitrumToken.USDT,
	ArbitrumToken.USDC,
	ArbitrumHtoken.USDT,
	ArbitrumHtoken.USDC,
	ArbitrumToken.DAI,
	ArbitrumHtoken.DAI,
]

export const MESSENGER_ADDRESSES = [
	'0x25ace71c97B33Cc4729CF772ae268934F7ab5fA1'.toLowerCase(), //OPTIMISM_L1
	'0x4200000000000000000000000000000000000007'.toLowerCase(), //OPTIMISM_L2
	'0x4C36d2919e407f0Cc2Ee3c993ccF8ac26d9CE64e'.toLowerCase(), //XDAI_L1
	'0x75Df5AF045d91108662D8080fD1FEFAd6aA0bb59'.toLowerCase(), //XDAI_L2
	'0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f'.toLowerCase(), //ARBITRUM_L1
]
export const OPTIMISM_GENESIS_HASHES = [
	'0x9168732d683634ce7155a8f6cbc6a1798582ccfa830a4351939d7343cbef675f', //ETH
	'0xb164734917a3ab5987544d99f6a5875a95bbb30d57c30dfec8db8d13789490ee', //USDC
	'0xa392dd41af7be095e026578a0c756e949fbef19a0ca5da6da4cf7ea409fd52f6', //USDT
	'0x657e0c1d2500f62f3027c59bd24bf1495e4ecb99ab50739b3d44cdc64a96a289', //DAI
	'0xb496953b1c04dd8e6ea5bb009b613870afd7848d56d1f56d7ebbb076bd0916cc', //SNX
	'0xee86691a2a4854a472734e98c72c2a8763a7927ba0019d4b4c58d56bd2b3d9bd', //SUSD
]

export const XDAI_L2_SIGNATURE =
	'0x5df9cc3eb93d8a9a481857a3b70a8ca966e6b80b25cf0ee2cce180ec5afa80a1' //XDAI_L2

export const OPTIMISM_L1_SIGNATURE =
	'0xcb0f7ffd78f9aee47a248fae8db181db6eee833039123e026dcbff529522e52a' //OPTIMISM_L1

export const OPTIMISM_L2_SIGNATURE =
	'0x4641df4a962071e12719d8c8c8e5ac7fc4d97b927346a3d7a335b1f7517e133c' //OPTIMISM_L2

export const XDAI_L1_SIGNATURE =
	'0x27333edb8bdcd40a0ae944fb121b5e2d62ea782683946654a0f5e607a908d578' //XDAI_L1

export const ARBITRUM_L1_SIGNATURE =
	'0xff64905f73a67fb594e0f940a8075a860db489ad991e032f48c81123eb52d60b' //ARBITRUM_L1

export const MESSENGER_EVENT_SIGNATURES = [
	ARBITRUM_L1_SIGNATURE,
	XDAI_L1_SIGNATURE,
	OPTIMISM_L1_SIGNATURE,
	OPTIMISM_L2_SIGNATURE,
	XDAI_L2_SIGNATURE,
]
export namespace RewardTokens {
	export const HOP = '0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'.toLowerCase()
	export const OP = '0x4200000000000000000000000000000000000042'.toLowerCase()
	export const GNO = '0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb'.toLowerCase()
}
export const GNO_REWARDS = [
	XdaiRewardToken.DAI_A,
	XdaiRewardToken.USDC_A,
	XdaiRewardToken.USDT_A,
]
export const HOP_REWARDS = [
	ArbitrumRewardToken.ETH,
	ArbitrumRewardToken.DAI,
	ArbitrumRewardToken.USDC,
	ArbitrumRewardToken.USDT,
	OptimismRewardToken.DAI,
	OptimismRewardToken.SNX_A,
	OptimismRewardToken.ETH,
	OptimismRewardToken.USDC,
	OptimismRewardToken.USDT,
	PolygonRewardToken.ETH,
	PolygonRewardToken.USDC,
	PolygonRewardToken.USDT,
	PolygonRewardToken.DAI,
	XdaiRewardToken.DAI_B,
	XdaiRewardToken.USDC_B,
	XdaiRewardToken.ETH_B,
	XdaiRewardToken.USDT_B,
]
export const OP_REWARDS = [OptimismRewardToken.SNX_B]
