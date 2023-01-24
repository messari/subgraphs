import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'

////////////////////////
///// Schema Enums /////
////////////////////////

// The network names corresponding to the Network enum in the schema.
// They also correspond to the ones in `dataSource.network()` after converting to lower case.
// See below for a complete list:
// https://thegraph.com/docs/en/hosted-service/what-is-hosted-service/#supported-networks-on-the-hosted-service
export namespace Network {
	export const ARBITRUM_ONE = 'ARBITRUM_ONE'
	export const AVALANCHE = 'AVALANCHE'
	export const AURORA = 'AURORA'
	export const BSC = 'BSC' // aka BNB Chain
	export const CELO = 'CELO'
	export const MAINNET = 'MAINNET' // Ethereum mainnet
	export const FANTOM = 'FANTOM'
	export const FUSE = 'FUSE'
	export const MOONBEAM = 'MOONBEAM'
	export const MOONRIVER = 'MOONRIVER'
	export const NEAR_MAINNET = 'NEAR_MAINNET'
	export const OPTIMISM = 'OPTIMISM'
	export const MATIC = 'MATIC' // aka Polygon
	export const XDAI = 'XDAI' // aka Gnosis Chain

	// other networks
	export const UBIQ = 'UBIQ'
	export const SONGBIRD = 'SONGBIRD'
	export const ELASTOS = 'ELASTOS'
	export const KARDIACHAIN = 'KARDIACHAIN'
	export const CRONOS = 'CRONOS'
	export const RSK = 'RSK'
	export const TELOS = 'TELOS'
	export const XDC = 'XDC'
	export const ZYX = 'ZYX'
	export const CSC = 'CSC'
	export const SYSCOIN = 'SYSCOIN'
	export const GOCHAIN = 'GOCHAIN'
	export const ETHEREUMCLASSIC = 'ETHEREUMCLASSIC'
	export const OKEXCHAIN = 'OKEXCHAIN'
	export const HOO = 'HOO'
	export const METER = 'METER'
	export const NOVA_NETWORK = 'NOVA_NETWORK'
	export const TOMOCHAIN = 'TOMOCHAIN'
	export const VELAS = 'VELAS'
	export const THUNDERCORE = 'THUNDERCORE'
	export const HECO = 'HECO'
	export const XDAIARB = 'XDAIARB'
	export const ENERGYWEB = 'ENERGYWEB'
	export const HPB = 'HPB'
	export const BOBA = 'BOBA'
	export const KUCOIN = 'KUCOIN'
	export const SHIDEN = 'SHIDEN'
	export const THETA = 'THETA'
	export const SX = 'SX'
	export const CANDLE = 'CANDLE'
	export const ASTAR = 'ASTAR'
	export const CALLISTO = 'CALLISTO'
	export const WANCHAIN = 'WANCHAIN'
	export const METIS = 'METIS'
	export const ULTRON = 'ULTRON'
	export const STEP = 'STEP'
	export const DOGECHAIN = 'DOGECHAIN'
	export const RONIN = 'RONIN'
	export const KAVA = 'KAVA'
	export const IOTEX = 'IOTEX'
	export const XLC = 'XLC'
	export const NAHMII = 'NAHMII'
	export const TOMBCHAIN = 'TOMBCHAIN'
	export const CANTO = 'CANTO'
	export const KLAYTN = 'KLAYTN'
	export const EVMOS = 'EVMOS'
	export const SMARTBCH = 'SMARTBCH'
	export const BITGERT = 'BITGERT'
	export const FUSION = 'FUSION'
	export const OHO = 'OHO'
	export const ARB_NOVA = 'ARB_NOVA'
	export const OASIS = 'OASIS'
	export const REI = 'REI'
	export const REICHAIN = 'REICHAIN'
	export const GODWOKEN = 'GODWOKEN'
	export const POLIS = 'POLIS'
	export const KEKCHAIN = 'KEKCHAIN'
	export const VISION = 'VISION'
	export const HARMONY = 'HARMONY'
	export const PALM = 'PALM'
	export const CURIO = 'CURIO'

	export const UNKNOWN_NETWORK = 'UNKNOWN_NETWORK'
}
export type Network = string

export namespace ProtocolType {
	export const EXCHANGE = 'EXCHANGE'
	export const LENDING = 'LENDING'
	export const YIELD = 'YIELD'
	export const BRIDGE = 'BRIDGE'
	export const GENERIC = 'GENERIC'
}

export namespace VaultFeeType {
	export const MANAGEMENT_FEE = 'MANAGEMENT_FEE'
	export const PERFORMANCE_FEE = 'PERFORMANCE_FEE'
	export const DEPOSIT_FEE = 'DEPOSIT_FEE'
	export const WITHDRAWAL_FEE = 'WITHDRAWAL_FEE'
}

export namespace LiquidityPoolFeeType {
	export const FIXED_TRADING_FEE = 'FIXED_TRADING_FEE'
	export const TIERED_TRADING_FEE = 'TIERED_TRADING_FEE'
	export const DYNAMIC_TRADING_FEE = 'DYNAMIC_TRADING_FEE'
	export const FIXED_LP_FEE = 'FIXED_LP_FEE'
	export const DYNAMIC_LP_FEE = 'DYNAMIC_LP_FEE'
	export const FIXED_PROTOCOL_FEE = 'FIXED_PROTOCOL_FEE'
	export const DYNAMIC_PROTOCOL_FEE = 'DYNAMIC_PROTOCOL_FEE'
}

export namespace RewardTokenType {
	export const DEPOSIT = 'DEPOSIT'
	export const BORROW = 'BORROW'
}
export type RewardTokenType = string

export namespace LendingType {
	export const CDP = 'CDP'
	export const POOLED = 'POOLED'
}

export namespace RiskType {
	export const GLOBAL = 'GLOBAL'
	export const ISOLATED = 'ISOLATED'
}

export namespace InterestRateType {
	export const STABLE = 'STABLE'
	export const VARIABLE = 'VARIABLE'
	export const FIXED_TERM = 'FIXED_TERM'
}

export namespace InterestRateSide {
	export const LENDER = 'LENDER'
	export const BORROWER = 'BORROWER'
}

export namespace UsageType {
	export const DEPOSIT = 'DEPOSIT'
	export const WITHDRAW = 'WITHDRAW'
	export const SWAP = 'SWAP'
}

//////////////////////////////
///// Ethereum Addresses /////
//////////////////////////////

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
export const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

////////////////////////
///// Type Helpers /////
////////////////////////

export const DEFAULT_DECIMALS = 18

export const USDC_DECIMALS = 6
export const USDC_DENOMINATOR = BigDecimal.fromString('1000000')

export const BIGINT_ZERO = BigInt.fromI32(0)
export const BIGINT_ONE = BigInt.fromI32(1)
export const BIGINT_TWO = BigInt.fromI32(2)
export const BIGINT_HUNDRED = BigInt.fromI32(100)
export const BIGINT_THOUSAND = BigInt.fromI32(1000)
export const BIGINT_TEN_TO_EIGHTEENTH = BigInt.fromString('10').pow(18)
export const BIGINT_MINUS_ONE = BigInt.fromI32(-1)
export const BIGINT_MAX = BigInt.fromString(
	'115792089237316195423570985008687907853269984665640564039457584007913129639935'
)

export const INT_NEGATIVE_ONE = -1 as i32
export const INT_ZERO = 0 as i32
export const INT_ONE = 1 as i32
export const INT_TWO = 2 as i32
export const INT_FOUR = 4 as i32

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO)
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE)
export const BIGDECIMAL_TWO = new BigDecimal(BIGINT_TWO)
export const BIGDECIMAL_HUNDRED = new BigDecimal(BIGINT_HUNDRED)
export const BIGDECIMAL_MINUS_ONE = new BigDecimal(BIGINT_MINUS_ONE)

export const MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255))

/////////////////////
///// Date/Time /////
/////////////////////

export const SECONDS_PER_DAY = 60 * 60 * 24 // 86400
export const SECONDS_PER_HOUR = 60 * 60 // 3600
export const SECONDS_PER_DAY_BI = BigInt.fromI32(SECONDS_PER_DAY)
export const SECONDS_PER_HOUR_BI = BigInt.fromI32(SECONDS_PER_HOUR)
export const MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000))
export const DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365))
export const MS_PER_YEAR = DAYS_PER_YEAR.times(
	new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000))
)

////////////////
///// Misc /////
////////////////

export const ETH_SYMBOL = 'ETH'
export const ETH_NAME = 'Ether'

export namespace XdaiBridge {
	export const USDC = '0x25D8039bB044dC227f741a9e381CA4cEAE2E6aE8'
	export const USDT = ' 0xFD5a186A7e8453Eb867A360526c5d987A00ACaC2'
	export const MATIC = ' 0x7ac71c29fEdF94BAc5A5C9aB76E1Dd12Ea885CCC'
	export const DAI = ' 0x0460352b91D7CF42B0E1C1c30f06B602D9ef2238'
	export const ETH = ' 0xD8926c12C0B2E5Cd40cFdA49eCaFf40252Af491B'
	export const WBTC = ' 0x07C592684Ee9f71D58853F9387579332d471b6Ca'
	export const HOP = ' 0x6F03052743CD99ce1b29265E377e320CD24Eb632'
}
export namespace XdaiAmm {
	export const USDC = '0x5C32143C8B198F392d01f8446b754c181224ac26'
	export const USDT = ' 0x3Aa637D6853f1d9A9354FE4301Ab852A88b237e7'
	export const MATIC = ' 0xaa30D6bba6285d0585722e2440Ff89E23EF68864'
	export const DAI = ' 0x24afDcA4653042C6D08fb1A754b2535dAcF6Eb24'
	export const ETH = ' 0x4014DC015641c08788F15bD6eB20dA4c47D936d8'
	export const WBTC = ' 0xb07c6505e1E41112494123e40330c5Ac09817CFB'
}

export namespace XdaiToken {
	export const USDC = '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83'
	export const USDT = ' 0x4ECaBa5870353805a9F068101A40E0f32ed605C6'
	export const MATIC = ' 0x7122d7661c4564b7C6Cd4878B06766489a6028A2'
	export const DAI = ' 0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'
	export const ETH = ' 0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1'
	export const WBTC = ' 0x8e5bBbb09Ed1ebdE8674Cda39A0c169401db4252'
	export const HOP = ' 0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'
}

export namespace MainnetToken {
	export const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
	export const USDT = ' 0xdAC17F958D2ee523a2206206994597C13D831ec7'
	export const MATIC = ' 0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0'
	export const DAI = ' 0x6B175474E89094C44Da98b954EedeAC495271d0F'
	export const ETH = ZERO_ADDRESS
	export const WBTC = ' 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
	export const sUSD = ' 0x57Ab1ec28D129707052df4dF418D58a2D46d5f51'
	export const SNX = ' 0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f'
	export const HOP = ' 0x6F03052743CD99ce1b29265E377e320CD24Eb632'
}

export namespace MainnetBridge {
	export const USDC = '0x3666f603Cc164936C1b87e207F36BEBa4AC5f18a'
	export const USDT = ' 0x3E4a3a4796d16c0Cd582C382691998f7c06420B6'
	export const MATIC = ' 0x22B1Cbb8D98a01a3B71D034BB899775A76Eb1cc2'
	export const DAI = ' 0x3d4Cc8A61c7528Fd86C55cfe061a78dCBA48EDd1'
	export const ETH = ' 0xb8901acB165ed027E32754E0FFe830802919727f'
	export const WBTC = ' 0xb98454270065A31D71Bf635F6F7Ee6A518dFb849'
	export const sUSD = ' 0x36443fC70E073fe9D50425f82a3eE19feF697d62'
	export const SNX = ' 0x893246FACF345c99e4235E5A7bbEE7404c988b96'
	export const HOP = ' 0x914f986a44AcB623A277d6Bd17368171FCbe4273'
}

export namespace ArbitrumBridge {
	export const USDC = '0x0e0E3d2C5c292161999474247956EF542caBF8dd'
	export const USDT = ' 0x72209Fe68386b37A40d6bCA04f78356fd342491f'
	export const MATIC = ' 0x7ac71c29fEdF94BAc5A5C9aB76E1Dd12Ea885CCC'
	export const DAI = ' 0x7aC115536FE3A185100B2c4DE4cb328bf3A58Ba6'
	export const ETH = ' 0x3749C4f034022c39ecafFaBA182555d4508caCCC'
	export const WBTC = ' 0x3E4a3a4796d16c0Cd582C382691998f7c06420B6'
	export const HOP = ' 0x25FB92E505F752F730cAD0Bd4fa17ecE4A384266'
}
export namespace ArbitrumAmm {
	export const USDC = '0x10541b07d8Ad2647Dc6cD67abd4c03575dade261'
	export const USDT = ' 0x18f7402B673Ba6Fb5EA4B95768aABb8aaD7ef18a'
	export const MATIC = ' 0xaa30D6bba6285d0585722e2440Ff89E23EF68864'
	export const DAI = ' 0xa5A33aB9063395A90CCbEa2D86a62EcCf27B5742'
	export const ETH = ' 0x652d27c0F72771Ce5C76fd400edD61B406Ac6D97'
	export const WBTC = ' 0x7191061D5d4C60f598214cC6913502184BAddf18'
}

export namespace ArbitrumToken {
	export const USDC = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'
	export const USDT = ' 0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'
	export const MATIC = ' 0x7122d7661c4564b7C6Cd4878B06766489a6028A2'
	export const DAI = ' 0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'
	export const ETH = ' 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
	export const WBTC = ' 0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f'
	export const HOP = ' 0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'
}

export namespace OptimismBridge {
	export const USDC = '0xa81D244A1814468C734E5b4101F7b9c0c577a8fC'
	export const USDT = ' 0x46ae9BaB8CEA96610807a275EBD36f8e916b5C61'
	export const DAI = ' 0x7191061D5d4C60f598214cC6913502184BAddf18'
	export const ETH = ' 0x83f6244Bd87662118d96D9a6D44f09dffF14b30E'
	export const WBTC = ' 0xB1ea9FeD58a317F81eEEFC18715Dd323FDEf45c4'
	export const sUSD = ' 0x33Fe5bB8DA466dA55a8A32D6ADE2BB104E2C5201'
	export const SNX = ' 0x16284c7323c35F4960540583998C98B1CfC581a7'
	export const HOP = ' 0x03D7f750777eC48d39D080b020D83Eb2CB4e3547'
}
export namespace OptimismAmm {
	export const USDC = '0x3c0FFAca566fCcfD9Cc95139FEF6CBA143795963'
	export const USDT = ' 0xeC4B41Af04cF917b54AEb6Df58c0f8D78895b5Ef'
	export const DAI = ' 0xF181eD90D6CfaC84B8073FdEA6D34Aa744B41810'
	export const ETH = ' 0xaa30D6bba6285d0585722e2440Ff89E23EF68864'
	export const sUSD = ' 0x8d4063E82A4Db8CdAed46932E1c71e03CA69Bede'
	export const SNX = ' 0x1990BC6dfe2ef605Bfc08f5A23564dB75642Ad73'
	export const WBTC = ' 0x46fc3Af3A47792cA3ED06fdF3D657145A675a8D8'
}

export namespace OptimismToken {
	export const USDC = '0x7F5c764cBc14f9669B88837ca1490cCa17c31607'
	export const USDT = ' 0x94b008aA00579c1307B0EF2c499aD98a8ce58e58'
	export const DAI = ' 0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'
	export const ETH = ' 0x4200000000000000000000000000000000000006'
	export const WBTC = ' 0x68f180fcCe6836688e9084f035309E29Bf0A2095'
	export const sUSD = ' 0x8c6f28f2F1A3C87F0f938b96d27520d9751ec8d9'
	export const SNX = ' 0x8700dAec35aF8Ff88c16BdF0418774CB3D7599B4'
	export const HOP = ' 0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'
}

export namespace PolygonBridge {
	export const USDC = '0x25D8039bB044dC227f741a9e381CA4cEAE2E6aE8'
	export const USDT = ' 0x6c9a1ACF73bd85463A46B0AFc076FBdf602b690B'
	export const DAI = ' 0xEcf268Be00308980B5b3fcd0975D47C4C8e1382a'
	export const ETH = ' 0xb98454270065A31D71Bf635F6F7Ee6A518dFb849'
	export const WBTC = ' 0x91Bd9Ccec64fC22475323a0E55d58F7786587905'
	export const MATIC = ' 0x553bC791D746767166fA3888432038193cEED5E2'
	export const HOP = ' 0x58c61AeE5eD3D748a1467085ED2650B697A66234'
}
export namespace PolygonAmm {
	export const USDC = '0x5C32143C8B198F392d01f8446b754c181224ac26'
	export const USDT = ' 0xB2f7d27B21a69a033f85C42d5EB079043BAadC81'
	export const DAI = ' 0x25FB92E505F752F730cAD0Bd4fa17ecE4A384266'
	export const ETH = ' 0x266e2dc3C4c59E42AA07afeE5B09E964cFFe6778'
	export const WBTC = ' 0x4e9840f3C1ff368a10731D15c11516b9Fe7E1898'
	export const MATIC = ' 0x3d4Cc8A61c7528Fd86C55cfe061a78dCBA48EDd1'
	export const HOP = ' 0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'
}

export namespace PolygonToken {
	export const USDC = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
	export const USDT = ' 0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
	export const DAI = ' 0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'
	export const ETH = ' 0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'
	export const WBTC = ' 0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6'
	export const MATIC = ' 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
	export const HOP = ' 0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC'
}
