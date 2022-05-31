import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const CURVE_PLATFORM_ID = 'Curve'

export const BIG_DECIMAL_1E6 = BigDecimal.fromString('1e6')
export const BIG_DECIMAL_1E8 = BigDecimal.fromString('1e8')
export const BIG_DECIMAL_1E18 = BigDecimal.fromString('1e18')
export const BIG_DECIMAL_ZERO = BigDecimal.fromString('0')
export const BIG_DECIMAL_ONE = BigDecimal.fromString('1')
export const BIG_DECIMAL_TWO = BigDecimal.fromString('2')


export const BIG_INT_ZERO = BigInt.fromString('0')
export const BIG_INT_ONE = BigInt.fromString('1')

export const NATIVE_PLACEHOLDER_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
export const NATIVE_PLACEHOLDER = Address.fromString(NATIVE_PLACEHOLDER_ADDRESS)
export const NATIVE_TOKEN = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
export const NATIVE_TOKEN_ADDRESS = Address.fromString(NATIVE_TOKEN)
export const ADDRESS_ZERO = Address.fromString('0x0000000000000000000000000000000000000000')

export const THREE_CRV_TOKEN = '0x6c3f90f043a72fa612cbac8115ee7e52bde6e490'
export const THREE_CRV_ADDRESS = Address.fromString(THREE_CRV_TOKEN)

export const WETH_TOKEN = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
export const WBTC_TOKEN = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'
export const USDT_TOKEN = '0xdac17f958d2ee523a2206206994597c13d831ec7'
export const WETH_ADDRESS = Address.fromString(WETH_TOKEN)
export const USDT_ADDRESS = Address.fromString(USDT_TOKEN)
export const WBTC_ADDRESS = Address.fromString(WBTC_TOKEN)
export const FXS_TOKEN = '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0'
export const CVXFXS_TOKEN = '0xfeef77d3f69374f66429c91d732a244f074bdf74'
export const RKP3R_TOKEN = '0xEdB67Ee1B171c4eC66E6c10EC43EDBbA20FaE8e9'
export const RKP3R_ADDRESS = Address.fromString(RKP3R_TOKEN)

// for Forex and EUR pool, map lp token to Chainlink price feed
export const EURT_LP_TOKEN = '0xfd5db7463a3ab53fd211b4af195c5bccc1a03890'
export const EURS_LP_TOKEN = '0x194ebd173f6cdace046c53eacce9b953f28411d1'
export const EURN_LP_TOKEN = '0x3fb78e61784c9c637d560ede23ad57ca1294c14a'

// Fixed forex proper
export const EUR_LP_TOKEN = '0x19b080fe1ffa0553469d20ca36219f17fcf03859'
export const JPY_LP_TOKEN = '0x8818a9bb44fbf33502be7c15c500d0c783b73067'
export const KRW_LP_TOKEN = '0x8461a004b50d321cb22b7d034969ce6803911899'
export const GBP_LP_TOKEN = '0xd6ac1cb9019137a896343da59dde6d097f710538'
export const AUD_LP_TOKEN = '0x3f1b0278a9ee595635b61817630cc19de792f506'
export const CHF_LP_TOKEN = '0x9c2c8910f113181783c249d8f6aa41b51cde0f0c'

export const CURVE_DEPLOYER_ADDRESS = '0xC447FcAF1dEf19A583F97b3620627BF69c05b5fB'
export const METAPOOL_FACTORY_ADDRESS = '0x0959158b6040D32d04c301A72CBFD6b39E21c9AE'

// Mixed USDT-forex (USDT-Forex) pools
export const EURS_USDC_LP_TOKEN = '0x3d229e1b4faab62f621ef2f6a610961f7bd7b23b'
export const EURT_USDT_LP_TOKEN = '0x3b6831c0077a1e44ed0a21841c3bc4dc11bce833'


// On chains like avalanche, pools use aave synthetics instead of the wrapped tokens
export const SIDECHAIN_SUBSTITUTES = new Map<string, Address>()
SIDECHAIN_SUBSTITUTES.set('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase(), NATIVE_TOKEN_ADDRESS)
// avalanche
SIDECHAIN_SUBSTITUTES.set('0x686bef2417b6dc32c50a3cbfbcc3bb60e1e9a15d', WBTC_ADDRESS)
SIDECHAIN_SUBSTITUTES.set('0x53f7c5869a859f0aec3d334ee8b4cf01e3492f21', WETH_ADDRESS)
// polygon
SIDECHAIN_SUBSTITUTES.set('0x5c2ed810328349100a66b82b78a1791b101c9d61', WBTC_ADDRESS)
SIDECHAIN_SUBSTITUTES.set('0x28424507fefb6f7f8e9d3860f56504e4e5f5f390', WETH_ADDRESS)

// handle wrapped tokens and synths in v2 pools
export const SYNTH_TOKENS = new Map<string, Address>()
SYNTH_TOKENS.set(CVXFXS_TOKEN, Address.fromString(FXS_TOKEN))


// Some metapools don't implement the `base_pool` method, so the graph has no way
// of knowing that they're metapools without a manual mapping
// We can track whether a pool is metapool or not on deployment via the factory
// but not for metapools that are added to the registry (metapools deployed by
// the deployer "manually" or factory metapools deployed before the factory
// contract was indexed on the address indexer)
export const UNKNOWN_METAPOOLS = new Map<string, Address>()
// Fantom
UNKNOWN_METAPOOLS.set(
  '0x92d5ebf3593a92888c25c0abef126583d4b5312e',
  Address.fromString('0x27E611FD27b276ACbd5Ffd632E5eAEBEC9761E40')
)
// Arbitrum
UNKNOWN_METAPOOLS.set(
  '0x30df229cefa463e991e29d42db0bae2e122b2ac7',
  Address.fromString('0x7f90122BF0700F9E7e1F688fe926940E8839F353')
)
// Mainnet
UNKNOWN_METAPOOLS.set(
  '0xd632f22692fac7611d2aa1c0d552930d43caed3b',
  Address.fromString('0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7')
)
UNKNOWN_METAPOOLS.set(
  '0x43b4fdfd4ff969587185cdb6f0bd875c5fc83f8c',
  Address.fromString('0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7')
)
UNKNOWN_METAPOOLS.set(
  '0x87650d7bbfc3a9f10587d7778206671719d9910d',
  Address.fromString('0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7')
)


// Early lending pools have no distinctive features in their ABI
// And since we can not rely on calls to determine when one is added
// We have to keep a manual registry
export const LENDING_POOLS = [
  // MAINNET
  Address.fromString('0x83f252f036761a1e3d10daca8e16d7b21e3744d7'),
  Address.fromString('0x06364f10b501e868329afbc005b3492902d6c763'),
  Address.fromString('0x2dded6da1bf5dbdf597c45fcfaa3194e53ecfeaf'),
  Address.fromString('0x45f783cce6b7ff23b2ab2d70e416cdb7d6055f51'),
  Address.fromString('0x52ea46506b9cc5ef470c5bf89f17dc28bb35d85c'),
  Address.fromString('0x79a8c46dea5ada233abaffd40f3a0a2b1e5a4f27'),
  Address.fromString('0xa2b47e3d5c44877cca798226b7b8118f9bfb7a56'),
  Address.fromString('0xa5407eae9ba41422680e2e00537571bcc53efbfd'),
  Address.fromString('0xdebf20617708857ebe4f679508e7b7863a8a8eee'),
  Address.fromString('0xeb16ae0052ed37f479f7fe63849198df1765a733'),
  Address.fromString('0x8925d9d9b4569d737a48499def3f67baa5a144b9'),
  // FANTOM
  Address.fromString('0x4fc8d635c3cb1d0aa123859e2b2587d0ff2707b1'),
  // Matic 
  Address.fromString('0x445fe580ef8d70ff569ab36e80c647af338db351')
]

// some v2 pools can have Forex : Crypto pairs for which we need
// a rate. We use oracles when available.
export const POLYGON_EURT_TOKEN = '0x7bdf330f423ea880ff95fc41a280fd5ecfd3d09f'
export const POLYGON_JJPY_TOKEN = '0x8343091F2499FD4b6174A46D067A920a3b851FF9'.toLowerCase()
export const POLYGON_JPYC_TOKEN = '0x6AE7Dfc73E0dDE2aa99ac063DcF7e8A63265108c'.toLowerCase()
export const ARBI_EURS_TOKEN = '0xD22a58f79e9481D1a88e00c343885A588b34b68B'.toLowerCase()
export const ARBI_FXEUR_TOKEN = '0x116172B2482c5dC3E6f445C16Ac13367aC3FCd35'.toLowerCase()
export const FOREX_TOKENS = [
  POLYGON_EURT_TOKEN,
  POLYGON_JJPY_TOKEN,
  POLYGON_JPYC_TOKEN,
  ARBI_EURS_TOKEN,
  ARBI_FXEUR_TOKEN,
]

// we also have the problem for v1 pools, but with both assets
export const POLYGON_2JPY_LP_TOKEN = '0xe8dcea7fb2baf7a9f4d9af608f06d78a687f8d9a'
export const ARBI_EURS_FXEUR_LP_TOKEN = '0xb0D2EB3C2cA3c6916FAb8DCbf9d9c165649231AE'.toLowerCase()
export const FOREX_ORACLES = new Map<string, Address>()
FOREX_ORACLES.set(EURT_USDT_LP_TOKEN, Address.fromString('0xb49f677943BC038e9857d61E7d053CaA2C1734C1'))
FOREX_ORACLES.set(EURS_USDC_LP_TOKEN, Address.fromString('0xb49f677943BC038e9857d61E7d053CaA2C1734C1'))
FOREX_ORACLES.set(EURT_LP_TOKEN, Address.fromString('0xb49f677943BC038e9857d61E7d053CaA2C1734C1'))
FOREX_ORACLES.set(EURS_LP_TOKEN, Address.fromString('0xb49f677943BC038e9857d61E7d053CaA2C1734C1'))
FOREX_ORACLES.set(EURN_LP_TOKEN, Address.fromString('0xb49f677943BC038e9857d61E7d053CaA2C1734C1'))
FOREX_ORACLES.set(EUR_LP_TOKEN, Address.fromString('0xb49f677943BC038e9857d61E7d053CaA2C1734C1'))
FOREX_ORACLES.set(ARBI_EURS_FXEUR_LP_TOKEN, Address.fromString('0xA14d53bC1F1c0F31B4aA3BD109344E5009051a84'))
FOREX_ORACLES.set(KRW_LP_TOKEN, Address.fromString('0x01435677FB11763550905594A16B645847C1d0F3'))
FOREX_ORACLES.set(JPY_LP_TOKEN, Address.fromString('0xBcE206caE7f0ec07b545EddE332A47C2F75bbeb3'))
FOREX_ORACLES.set(POLYGON_2JPY_LP_TOKEN, Address.fromString('0xD647a6fC9BC6402301583C91decC5989d8Bc382D'))
FOREX_ORACLES.set(GBP_LP_TOKEN, Address.fromString('0x5c0Ab2d9b5a7ed9f470386e82BB36A3613cDd4b5'))
FOREX_ORACLES.set(AUD_LP_TOKEN, Address.fromString('0x77F9710E7d0A19669A13c055F62cd80d313dF022'))
FOREX_ORACLES.set(CHF_LP_TOKEN, Address.fromString('0x449d117117838fFA61263B61dA6301AA2a88B13A'))
FOREX_ORACLES.set(POLYGON_EURT_TOKEN, Address.fromString('0x73366Fe0AA0Ded304479862808e02506FE556a98'))
FOREX_ORACLES.set(POLYGON_JPYC_TOKEN, Address.fromString('0xD647a6fC9BC6402301583C91decC5989d8Bc382D'))
FOREX_ORACLES.set(POLYGON_JJPY_TOKEN, Address.fromString('0xD647a6fC9BC6402301583C91decC5989d8Bc382D'))
FOREX_ORACLES.set(ARBI_EURS_TOKEN, Address.fromString('0xA14d53bC1F1c0F31B4aA3BD109344E5009051a84'))
FOREX_ORACLES.set(ARBI_FXEUR_TOKEN, Address.fromString('0xA14d53bC1F1c0F31B4aA3BD109344E5009051a84'))

export const SUSHI_FACTORY = '0xc0aee478e3658e2610c5f7a4a2e1777ce9e4f2ac'
export const SUSHI_FACTORY_ADDRESS = Address.fromString(SUSHI_FACTORY)

export const UNI_FACTORY = '0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f'
export const UNI_FACTORY_ADDRESS = Address.fromString(UNI_FACTORY)
export const UNI_V3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984'
export const UNI_V3_FACTORY_ADDRESS = Address.fromString(UNI_V3_FACTORY)
export const UNI_V3_QUOTER = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'
export const UNI_V3_QUOTER_ADDRESS = Address.fromString(UNI_V3_QUOTER)

export const CURVE_REGISTRY = Address.fromString('0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5')
export const CURVE_REGISTRY_V2 = Address.fromString('0x4AacF35761d06Aa7142B9326612A42A2b9170E33')
export const CURVE_FACTORY_V1 = Address.fromString('0x0959158b6040d32d04c301a72cbfd6b39e21c9ae')
export const CURVE_FACTORY_V1_2 = Address.fromString('0xb9fc157394af804a3578134a6585c0dc9cc990d4')
export const CURVE_FACTORY_V2 = Address.fromString('0xf18056bbd320e96a48e3fbf8bc061322531aac99')

export const TRIPOOL_ADDRESS = Address.fromString('0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7')

export const TRICRYPTO2_POOL = '0xd51a44d3fae010294c616388b506acda1bfaae46'
export const TRICRYPTO2_POOL_ADDRESS = Address.fromString(TRICRYPTO2_POOL)
// Pools that are v2 but were originally added to v1 registry
export const EURT_USD_POOL = Address.fromString('0x9838eCcC42659FA8AA7daF2aD134b53984c9427b')
export const EURS_USDC_POOL = Address.fromString('0x98a7F18d4E56Cfe84E3D081B40001B3d5bD3eB8B')
export const TRICRYPTO_V1_POOL = Address.fromString('0x80466c64868E1ab14a1Ddf27A676C3fcBE638Fe5')
export const EARLY_V2_POOLS = [TRICRYPTO2_POOL_ADDRESS, EURS_USDC_POOL, EURT_USD_POOL]

export const CATCHUP_BLOCK = BigInt.fromI32(11153725)
export const CURVE_REGISTRY_V1 = Address.fromString('0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5')

export const METAPOOL_FACTORY = 'METAPOOL_FACTORY'
export const CRYPTO_FACTORY = 'CRYPTO_FACTORY'
export const STABLE_FACTORY = 'STABLE_FACTORY'
export const REGISTRY_V1 = 'REGISTRY_V1'
export const REGISTRY_V2 = 'REGISTRY_V2'
export const LENDING = 'LENDING'

export const CURVE_POOL_FEE = BigDecimal.fromString("0.0004");
export const CURVE_ADMIN_FEE = BigDecimal.fromString("0.5");

export const CURVE_REGISTRY_V1_AVAX = Address.fromString("0x8474DdbE98F5aA3179B3B3F5942D724aFcdec9f6")
export const TRYCRYPTO2_POOL_AVAX_GAUGE = Address.fromString("0x445FE580eF8d70FF569aB36e80c647af338db351")

export const CATCHUP_POOLS = [Address.fromString("0x06364f10B501e868329afBc005b3492902d6C763"), Address.fromString("0x0f9cb53Ebe405d49A0bbdBD291A65Ff571bC83e1"), Address.fromString("0x3E01dD8a5E1fb3481F0F589056b428Fc308AF0Fb"), Address.fromString("0x3eF6A01A0f81D6046290f3e2A8c5b843e738E604"), Address.fromString("0x45F783CCE6B7FF23B2ab2D70e416cdb7D6055f51"), Address.fromString("0x4CA9b3063Ec5866A4B82E437059D2C43d1be596F"), Address.fromString("0x4f062658EaAF2C1ccf8C8e36D6824CDf41167956"), Address.fromString("0x52EA46506B9CC5Ef470C5bf89f17Dc28bB35D85C"), Address.fromString("0x79a8C46DeA5aDa233ABaFFD40F3A0A2B1e5A4F27"), Address.fromString("0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714"), Address.fromString("0x8474DdbE98F5aA3179B3B3F5942D724aFcdec9f6"), Address.fromString("0x93054188d876f558f4a66B2EF1d97d16eDf0895B"), Address.fromString("0xA2B47E3D5c44877cca798226B7B8118F9BFb7A56"), Address.fromString("0xA5407eAE9Ba41422680e2e00537571bcC53efBfD"), Address.fromString("0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7"), Address.fromString("0xC18cC39da8b11dA8c3541C598eE022258F9744da"), Address.fromString("0xC25099792E9349C7DD09759744ea681C7de2cb66"), Address.fromString("0xE7a24EF0C5e95Ffb0f6684b813A78F2a3AD7D171"), ]
export const CATCHUP_LP_TOKENS = [Address.fromString("0xd905e2eaebe188fc92179b6350807d8bd91db0d8"), Address.fromString("0x4f3e8f405cf5afc05d68142f3783bdfe13811522"), Address.fromString("0x97e2768e8e73511ca874545dc5ff8067eb19b787"), Address.fromString("0x5b5cfe992adac0c9d48e05854b2d91c73a003858"), Address.fromString("0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8"), Address.fromString("0xb19059ebb43466c323583928285a49f558e572fd"), Address.fromString("0xd2967f45c4f384deea880f807be904762a3dea07"), Address.fromString("0x9fc689ccada600b6df723d9e47d84d76664a1f23"), Address.fromString("0x3b3ac5386837dc563660fb6a0937dfaa5924333b"), Address.fromString("0x075b1bb99792c9e1041ba13afef80c91a1e70fb3"), Address.fromString("0x1aef73d49dedc4b1778d0706583995958dc862e6"), Address.fromString("0x49849c98ae39fff122806c06791fa73784fb3675"), Address.fromString("0x845838df265dcd2c412a1dc9e959c7d08537f8a2"), Address.fromString("0xc25a3a3b969415c80451098fa907ec722572917f"), Address.fromString("0x6c3f90f043a72fa612cbac8115ee7e52bde6e490"), Address.fromString("0xc2ee6b0334c261ed60c72f6054450b61b8f18e35"), Address.fromString("0x64eda51d3ad40d56b9dfc5554e06f94e1dd786fd"), Address.fromString("0x6d65b498cb23deaba52db31c93da9bffb340fb8f"), ]
export const CATCHUP_GAUGES = [Address.fromString("0x64e3c23bfc40722d3b649844055f1d51c1ac041d"), Address.fromString("0xf98450b5602fa59cc66e1379dffb6fddc724cfc4"), Address.fromString("0xc2b1df84112619d190193e48148000e3990bf627"), Address.fromString("0x2db0e83599a91b508ac268a6197b8b14f5e72840"), Address.fromString("0xfa712ee4788c042e2b7bb55e6cb8ec569c4530c1"), Address.fromString("0x4c18e409dc8619bfb6a1cb56d114c3f592e0ae79"), Address.fromString("0xc5cfada84e902ad92dd40194f0883ad49639b023"), Address.fromString("0xbc89cd85491d81c6ad2954e6d0362ee29fca8f53"), Address.fromString("0x69fb7c45726cfe2badee8317005d3f94be838840"), Address.fromString("0x705350c4bcd35c9441419ddd5d2f097d7a55410f"), Address.fromString("0x5f626c30ec1215f4edcc9982265e8b1f411d1352"), Address.fromString("0xb1f2cdec61db658f091671f5f199635aef202cac"), Address.fromString("0x7ca5b0a2910b33e9759dc7ddb0413949071d7575"), Address.fromString("0xa90996896660decc6e997655e065b23788857849"), Address.fromString("0xbfcf63294ad7105dea65aa58f8ae5be2d9d0952a"), Address.fromString("0x4dc4a289a8e33600d8bd4cf5f6313e43a37adec7"), Address.fromString("0x6828bcf74279ee32f2723ec536c22c51eed383c6"), Address.fromString("0x0000000000000000000000000000000000000000"), ]
export const CATCHUP_START_BLOCKS = [BigInt.fromI32(10041041), BigInt.fromI32(11010514), BigInt.fromI32(11010305), BigInt.fromI32(11010070), BigInt.fromI32(9476468), BigInt.fromI32(10732328), BigInt.fromI32(11005604), BigInt.fromI32(9456293), BigInt.fromI32(9567295), BigInt.fromI32(10276641), BigInt.fromI32(11011940), BigInt.fromI32(10151385), BigInt.fromI32(9554040), BigInt.fromI32(9906598), BigInt.fromI32(10809473), BigInt.fromI32(11037531), BigInt.fromI32(11095928), BigInt.fromI32(11011556), ]
export const CATCHUP_START_TIMES = [BigInt.fromI32(1589148236), BigInt.fromI32(1602099761), BigInt.fromI32(1602097014), BigInt.fromI32(1602093743), BigInt.fromI32(1581620865), BigInt.fromI32(1598394762), BigInt.fromI32(1602032924), BigInt.fromI32(1581353158), BigInt.fromI32(1582828615), BigInt.fromI32(1592308622), BigInt.fromI32(1602119084), BigInt.fromI32(1590630643), BigInt.fromI32(1582652911), BigInt.fromI32(1587348844), BigInt.fromI32(1599414978), BigInt.fromI32(1602462378), BigInt.fromI32(1603235444), BigInt.fromI32(1602113863), ]
export const CATCHUP_POOL_TYPES = ["LENDING", "REGISTRY_V1", "REGISTRY_V1", "REGISTRY_V1", "LENDING", "REGISTRY_V1", "REGISTRY_V1", "LENDING", "LENDING", "REGISTRY_V1", "REGISTRY_V1", "REGISTRY_V1", "LENDING", "LENDING", "REGISTRY_V1", "REGISTRY_V1", "REGISTRY_V1", "REGISTRY_V1", ]
export const CATCHUP_REGISTRIES = [Address.fromString("0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5"), Address.fromString("0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5"), Address.fromString("0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5"), Address.fromString("0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5"), Address.fromString("0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5"), Address.fromString("0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5"), Address.fromString("0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5"), Address.fromString("0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5"), Address.fromString("0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5"), Address.fromString("0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5"), Address.fromString("0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5"), Address.fromString("0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5"), Address.fromString("0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5"), Address.fromString("0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5"), Address.fromString("0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5"), Address.fromString("0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5"), Address.fromString("0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5"), Address.fromString("0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5"), ]

export const ASSET_TYPES = new Map<string, i32>()
ASSET_TYPES.set("0x06364f10b501e868329afbc005b3492902d6c763".toLowerCase(), 0)
ASSET_TYPES.set("0x0f9cb53ebe405d49a0bbdbd291a65ff571bc83e1".toLowerCase(), 0)
ASSET_TYPES.set("0x3e01dd8a5e1fb3481f0f589056b428fc308af0fb".toLowerCase(), 0)
ASSET_TYPES.set("0x3ef6a01a0f81d6046290f3e2a8c5b843e738e604".toLowerCase(), 0)
ASSET_TYPES.set("0x45f783cce6b7ff23b2ab2d70e416cdb7d6055f51".toLowerCase(), 0)
ASSET_TYPES.set("0x4ca9b3063ec5866a4b82e437059d2c43d1be596f".toLowerCase(), 2)
ASSET_TYPES.set("0x4f062658eaaf2c1ccf8c8e36d6824cdf41167956".toLowerCase(), 0)
ASSET_TYPES.set("0x52ea46506b9cc5ef470c5bf89f17dc28bb35d85c".toLowerCase(), 0)
ASSET_TYPES.set("0x79a8c46dea5ada233abaffd40f3a0a2b1e5a4f27".toLowerCase(), 0)
ASSET_TYPES.set("0x7fc77b5c7614e1533320ea6ddc2eb61fa00a9714".toLowerCase(), 2)
ASSET_TYPES.set("0x8474ddbe98f5aa3179b3b3f5942d724afcdec9f6".toLowerCase(), 0)
ASSET_TYPES.set("0x93054188d876f558f4a66b2ef1d97d16edf0895b".toLowerCase(), 2)
ASSET_TYPES.set("0xa2b47e3d5c44877cca798226b7b8118f9bfb7a56".toLowerCase(), 4)
ASSET_TYPES.set("0xa5407eae9ba41422680e2e00537571bcc53efbfd".toLowerCase(), 0)
ASSET_TYPES.set("0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7".toLowerCase(), 0)
ASSET_TYPES.set("0xc18cc39da8b11da8c3541c598ee022258f9744da".toLowerCase(), 0)
ASSET_TYPES.set("0xc25099792e9349c7dd09759744ea681c7de2cb66".toLowerCase(), 2)
ASSET_TYPES.set("0xe7a24ef0c5e95ffb0f6684b813a78f2a3ad7d171".toLowerCase(), 4)

//export const CATCHUP_ASSET_TYPES = ["[object Object]", "[object Object]", "[object Object]", "[object Object]", "[object Object]", "[object Object]", "[object Object]", "[object Object]", "[object Object]", "[object Object]", "[object Object]", "[object Object]", "[object Object]", "[object Object]", "[object Object]", "[object Object]", "[object Object]", "[object Object]", ]
export const GAUGE_CONTROLLER = Address.fromString("0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB")

export const CURVE_TOKEN = Address.fromString("0xD533a949740bb3306d119CC777fa900bA034cd52")

export const CTOKEN_DECIMALS = 8;

export const LP_TOKEN_POOL_MAP = new Map<string, Address>()
LP_TOKEN_POOL_MAP.set("0x445fe580ef8d70ff569ab36e80c647af338db351",Address.fromString("0xE7a24EF0C5e95Ffb0f6684b813A78F2a3AD7D171"))

export const POOL_REGISTRY_ID_MAP = new Map<string, BigInt>()
POOL_REGISTRY_ID_MAP.set("0xf72beacc6fd334e14a7ddac25c3ce1eb8a827e10",BigInt.fromI32(8))
POOL_REGISTRY_ID_MAP.set("0xb0d2eb3c2ca3c6916fab8dcbf9d9c165649231ae",BigInt.fromI32(7))
POOL_REGISTRY_ID_MAP.set("0x065f44cd602cc6680e82e516125839b9bbbbe57e",BigInt.fromI32(6))
POOL_REGISTRY_ID_MAP.set("0x850c7cc8757ce1fa8ced709f297d842e12e61759",BigInt.fromI32(5))
POOL_REGISTRY_ID_MAP.set("0xaea2e71b631fa93683bcf256a8689dfa0e094fcd",BigInt.fromI32(4))
POOL_REGISTRY_ID_MAP.set("0x6041631c566eb8dc6258a75fa5370761d4873990",BigInt.fromI32(3))
POOL_REGISTRY_ID_MAP.set("0xf92c2a3c91bf869f77f9cb221c5ab1b1ada8a586",BigInt.fromI32(2))
POOL_REGISTRY_ID_MAP.set("0xe9dcf2d2a17ead11fab8b198578b20535370be6a",BigInt.fromI32(1))
POOL_REGISTRY_ID_MAP.set("0x30df229cefa463e991e29d42db0bae2e122b2ac7",BigInt.fromI32(0))

