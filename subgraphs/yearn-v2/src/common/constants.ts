import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts';

////////////////////////
///// Schema Enums /////
////////////////////////

// Using Coingecko slugs
export namespace Network {
  export const ARBITRUM = "arbitrum-one";
  export const AVALANCHE = "avalanche";
  export const AURORA = "aurora";
  export const BSC = "binance-smart-chain";
  export const CELO = "celo";
  export const CRONOS = "cronos";
  export const ETHEREUM = "ethereum";
  export const FANTOM = "fantom";
  export const HARMONY = "harmony-shard-0";
  export const MOONBEAM = "moonbeam";
  export const MOONRIVER = "moonriver";
  export const OPTIMISM = "optimistic-ethereum";
  export const POLYGON = "polygon-pos";
  export const XDAI = "xdai";
}

export namespace ProtocolType {
  export const EXCHANGE = "exchange";
  export const LENDING = "lending";
  export const YIELD = "yield";
  export const BRIDGE = "bridge";
  export const GENERIC = "generic";
}

export namespace VaultFeeType {
  export const MANAGEMENT_FEE = "management-fee";
  export const PERFORMANCE_FEE = "performance-fee";
  export const DEPOSIT_FEE = "deposit-fee";
  export const WITHDRAWLAL_FEE = "withdrawal-fee";
}

export namespace LiquidityPoolFeeType {
  export const TRADING_FEE = "trading-fee";
  export const PROTOCOL_FEE = "protocol-fee";
  export const TIERED_FEE = "tiered-fee";
  export const DYNAMIC_FEE = "dynamic-fee";
}

export namespace RewardTokenType {
  export const DEPOSIT = "deposit";
  export const BORROW = "borrow";
}

// Yearn registry contract
export const PROTOCOL_ID = "0xe15461b18ee31b7379019dc523231c57d1cbc18c"

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const DEFAULT_DECIMALS = 18;
export const USDC_DECIMALS = 6;
export const USDC_DENOMINATOR = BigDecimal.fromString("100000");
export let BIGINT_ZERO = BigInt.fromI32(0);
export let BIGINT_ONE = BigInt.fromI32(1);
export let BIGINT_MAX = BigInt.fromString(
  '115792089237316195423570985008687907853269984665640564039457584007913129639935'
);
export let BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export let MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));
export let DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const SECONDS_PER_DAY = 60 * 60 * 24;
export let MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export let MS_PER_YEAR = DAYS_PER_YEAR.times(
  new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000))
);

/////////////////
/////////////////
/////////////////

////////////

export const ETH_MAINNET_REGISTRY_ADDRESS = "0xe15461b18ee31b7379019dc523231c57d1cbc18c"

export const ETH_MAINNET_NETWORK = 'mainnet';
export const FTM_MAINNET_NETWORK = 'fantom';
export const ARB_MAINNET_NETWORK = 'arbitrum';

// Oracle Fantom https://ftmscan.com/address/0x57aa88a0810dfe3f9b71a9b179dd8bf5f956c46a#code
export const ETH_MAINNET_USDC_ORACLE_ADDRESS =
  '0x83d95e0d5f402511db06817aff3f9ea88224b030';
export const ETH_MAINNET_CALCULATIONS_CURVE_ADDRESS =
  '0x25BF7b72815476Dd515044F9650Bf79bAd0Df655';
export const ETH_MAINNET_CALCULATIONS_SUSHI_SWAP_ADDRESS =
  '0x8263e161A855B644f582d9C164C66aABEe53f927';

export const FTM_MAINNET_CALCULATIONS_SPOOKY_SWAP_ADDRESS =
  '0x1007eD6fdFAC72bbea9c719cf1Fa9C355D248691';
export const FTM_MAINNET_USDC_ORACLE_ADDRESS =
  '0x57AA88A0810dfe3f9b71a9b179Dd8bF5F956C46A';
export const FTM_MAINNET_CALCULATIONS_SUSHI_SWAP_ADDRESS =
  '0xec7Ac8AC897f5082B2c3d4e8D2173F992A097F24';

export const ARB_MAINNET_USDC_ORACLE_ADDRESS =
  '0x043518AB266485dC085a1DB095B8d9C2Fc78E9b9';
export const ARB_MAINNET_CALCULATIONS_SUSHI_SWAP_ADDRESS =
  '0x5EA7E501c9A23F4A76Dc7D33a11D995B13a1dD25';
  '115792089237316195423570985008687907853269984665640564039457584007913129639935'
