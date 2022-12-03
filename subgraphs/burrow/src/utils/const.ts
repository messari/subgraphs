import { BigInt, BigDecimal, TypedMap } from '@graphprotocol/graph-ts';

export const BI_ZERO = BigInt.fromString('0')
export const BI_ONE = BigInt.fromString('1')

export const BD_ZERO = BigDecimal.fromString('0')
export const BD_ONE = BigDecimal.fromString('1')
export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'

export const BI_BD = (n: BigInt): BigDecimal => BigDecimal.fromString(n.toString());
export const BD = (n: string): BigDecimal => BigDecimal.fromString(n);

export const BIGDECIMAL_ONE = BD('1');
export const BIGDECIMAL_TWO = BD('2');
export const BIGDECIMAL_THREE = BD('3');
export const BIGDECIMAL_TWELVE = BD('12');
export const BIGDECIMAL_SIX = BD('6');
export const BIGDECIMAL_100 = BD('100');

export const assets = new TypedMap<string, TokenMetadata>()

class TokenMetadata {
    constructor(
    public name: string,
    public symbol: string,
    public decimals: number,
    public extraDecimals: number,
    ){}
}

assets.set('meta-pool.near', new TokenMetadata(
    'Staked NEAR',
    'stNEAR',
    24,
    0
))

assets.set('usn', new TokenMetadata(
    'USN Stablecoin',
    'USN',
    18,
    0
))

assets.set('token.burrow.near', new TokenMetadata(
    'Burrow',
    'BRRR',
    18,
    0
))

assets.set('wrap.near', new TokenMetadata(
    'Wrapped Near',
    'wNEAR',
    24,
    0
))

assets.set('dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near', new TokenMetadata(
    'Tether USD',
    'USDT',
    6,
    12
))

assets.set('a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near', new TokenMetadata(
    'USD Coin',
    'USDC',
    6,
    12
))

assets.set('6b175474e89094c44da98b954eedeac495271d0f.factory.bridge.near', new TokenMetadata(
    'DAI Stablecoin',
    'DAI',
    18,
    0
))

assets.set('2260fac5e5542a773aa44fbcfedf7c193bc2c599.factory.bridge.near', new TokenMetadata(
    'Wrapped BTC',
    'wBTC',
    8,
    10
))

assets.set('aurora', new TokenMetadata(
    'Ethereum',
    'ETH',
    18,
    0
))

assets.set('linear-protocol.near', new TokenMetadata(
    'LiNEAR',
    'liNEAR',
    24,
    0
))

assets.set('4691937a7508860f876c9c0a2a617e7d9e945d4b.factory.bridge.near', new TokenMetadata(
    'Wootrade Network',
    'WOO',
    18,
    0
))

assets.set('aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near', new TokenMetadata(
    'Aurora',
    'AURORA',
    18,
    0
))

assets.set('meta-token.near', new TokenMetadata(
    'Meta Token',
    'META',
    18,
    0
))

// v2-nearx.stader-labs.near
assets.set('v2-nearx.stader-labs.near', new TokenMetadata(
    'Stader NearX',
    'NEARX',
    18,
    0
))

// wrapped near
assets.set('c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.factory.bridge.near', new TokenMetadata(
    'Wrapped Ether',
    'WETH',
    18,
    0
))

// chainlink 
assets.set('514910771af9ca656af840dff83e8264ecf986ca.factory.bridge.near', new TokenMetadata(
    'Chainlink',
    'LINK',
    18,
    0
))

// ref
assets.set('token.v2.ref-finance.near', new TokenMetadata(
    'Ref Finance',
    'REF',
    18,
    0
))

// skyward
assets.set('token.skyward.near', new TokenMetadata(
    'Skyward Finance',
    'SKYWARD',
    18,
    0
))

// octopus
assets.set('f5cfbc74057c610c8ef151a439252680ac68c6dc.factory.bridge.near', new TokenMetadata(
    'Octopus',
    'OCT',
    18,
    0
))