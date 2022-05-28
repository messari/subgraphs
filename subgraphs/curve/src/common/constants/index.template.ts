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
export const NATIVE_TOKEN = '{{ native_token }}'
export const NATIVE_TOKEN_ADDRESS = Address.fromString(NATIVE_TOKEN)
export const ADDRESS_ZERO = Address.fromString('0x0000000000000000000000000000000000000000')

export const THREE_CRV_TOKEN = '{{ three_crv_token }}'
export const THREE_CRV_ADDRESS = Address.fromString(THREE_CRV_TOKEN)

export const WETH_TOKEN = '{{ weth_token }}'
export const WBTC_TOKEN = '{{ wbtc_token }}'
export const USDT_TOKEN = '{{ usdt_token }}'
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

export const SUSHI_FACTORY = '{{ unifork_1_factory }}'
export const SUSHI_FACTORY_ADDRESS = Address.fromString(SUSHI_FACTORY)

export const UNI_FACTORY = '{{ unifork_2_factory }}'
export const UNI_FACTORY_ADDRESS = Address.fromString(UNI_FACTORY)
export const UNI_V3_FACTORY = '{{ uni_v3_factory }}'
export const UNI_V3_FACTORY_ADDRESS = Address.fromString(UNI_V3_FACTORY)
export const UNI_V3_QUOTER = '{{ uni_v3_quoter }}'
export const UNI_V3_QUOTER_ADDRESS = Address.fromString(UNI_V3_QUOTER)

export const CURVE_REGISTRY = Address.fromString('0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5')
export const CURVE_REGISTRY_V2 = Address.fromString('0x4AacF35761d06Aa7142B9326612A42A2b9170E33')
export const CURVE_FACTORY_V1 = Address.fromString('0x0959158b6040d32d04c301a72cbfd6b39e21c9ae')
export const CURVE_FACTORY_V1_2 = Address.fromString('0xb9fc157394af804a3578134a6585c0dc9cc990d4')
export const CURVE_FACTORY_V2 = Address.fromString('0xf18056bbd320e96a48e3fbf8bc061322531aac99')

export const TRIPOOL_ADDRESS = Address.fromString('0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7')

export const TRICRYPTO2_POOL = '{{ tricrypto2_pool }}'
export const TRICRYPTO2_POOL_ADDRESS = Address.fromString(TRICRYPTO2_POOL)
// Pools that are v2 but were originally added to v1 registry
export const EURT_USD_POOL = Address.fromString('0x9838eCcC42659FA8AA7daF2aD134b53984c9427b')
export const EURS_USDC_POOL = Address.fromString('0x98a7F18d4E56Cfe84E3D081B40001B3d5bD3eB8B')
export const TRICRYPTO_V1_POOL = Address.fromString('0x80466c64868E1ab14a1Ddf27A676C3fcBE638Fe5')
export const EARLY_V2_POOLS = [TRICRYPTO2_POOL_ADDRESS, EURS_USDC_POOL, EURT_USD_POOL]

export const CATCHUP_BLOCK = BigInt.fromI32({{ catchup_block }})
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

export const CATCHUP_POOLS = [{{# catchup_pools }}Address.fromString("{{ . }}"), {{/ catchup_pools }}]
export const CATCHUP_LP_TOKENS = [{{# catchup_lp_tokens }}Address.fromString("{{ . }}"), {{/ catchup_lp_tokens }}]
export const CATCHUP_GAUGES = [{{# catchup_gauges }}Address.fromString("{{ . }}"), {{/ catchup_gauges }}]
export const CATCHUP_START_BLOCKS = [{{# catchup_start_blocks }}BigInt.fromI32({{ . }}), {{/ catchup_start_blocks }}]
export const CATCHUP_START_TIMES = [{{# catchup_start_times }}BigInt.fromI32({{ . }}), {{/ catchup_start_times }}]
export const CATCHUP_POOL_TYPES = [{{# catchup_pool_types }}"{{ . }}", {{/ catchup_pool_types }}]
export const CATCHUP_REGISTRIES = [{{# catchup_registries }}Address.fromString("{{ . }}"), {{/ catchup_registries }}]

export const ASSET_TYPES = new Map<string, i32>()
{{# catchup_asset_types }}
ASSET_TYPES.set("{{asset}}".toLowerCase(), {{asset_type}})
{{/ catchup_asset_types }}

//export const CATCHUP_ASSET_TYPES = [{{# catchup_asset_types }}"{{ . }}", {{/ catchup_asset_types }}]
export const GAUGE_CONTROLLER = Address.fromString("0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB")

export const CURVE_TOKEN = Address.fromString("{{curveToken}}")

export const CTOKEN_DECIMALS = 8;

export const LP_TOKEN_POOL_MAP = new Map<string, Address>()
LP_TOKEN_POOL_MAP.set("0x445FE580eF8d70FF569aB36e80c647af338db351".toLowerCase(),Address.fromString("0xE7a24EF0C5e95Ffb0f6684b813A78F2a3AD7D171"))