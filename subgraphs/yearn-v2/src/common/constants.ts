import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

////////////////////////
///// Schema Enums /////
////////////////////////
export namespace Network {
  export const ARBITRUM = "ARBITRUM_ONE";
  export const AVALANCHE = "AVALANCHE";
  export const AURORA = "AURORA";
  export const BSC = "BINANCE_SMART_CHAIN";
  export const CELO = "CELO";
  export const CRONOS = "CRONOS";
  export const ETHEREUM = "ETHEREUM";
  export const FANTOM = "FANTOM";
  export const HARMONY = "HARMONY_SHARD_0";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const OPTIMISM = "OPTIMISTIC_ETHEREUM";
  export const POLYGON = "POLYGON_POS";
  export const XDAI = "XDAI";
}

export namespace ProtocolType {
  export const EXCHANGE = "EXCHANGE";
  export const LENDING = "LENDING";
  export const YIELD = "YIELD";
  export const BRIDGE = "BRIDGE";
  export const GENERIC = "GENERIC";
}

export namespace VaultFeeType {
  export const MANAGEMENT_FEE = "MANAGEMENT_FEE";
  export const PERFORMANCE_FEE = "PERFORMANCE_FEE";
  export const DEPOSIT_FEE = "DEPOSIT_FEE";
  export const WITHDRAWAL_FEE = "WITHDRAWAL_FEE";
}

export namespace RewardTokenType {
  export const DEPOSIT = "DEPOSIT";
  export const BORROW = "BORROW";
}

export const SECONDS_PER_DAY = 60 * 60 * 24;
export const BIGINT_ONE = BigInt.fromI32(1);
export const DEFAULT_MANAGEMENT_FEE = BigInt.fromI32(0);
export const DEFAULT_PERFORMANCE_FEE = BigInt.fromI32(1500);
export const DEFAULT_WITHDRAWAL_FEE = BigInt.fromI32(50);

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGINT_HUNDRED = BigInt.fromI32(100);
export const BIGDECIMAL_HUNDRED = BigDecimal.fromString("100");
export const ETHEREUM_PROTOCOL_ID =
  "0xe15461b18ee31b7379019dc523231c57d1cbc18c";

export const USDC_DECIMALS = 6;
export const DEFAULT_DECIMALS = BigInt.fromI32(18);
export const USDC_DENOMINATOR = BigDecimal.fromString("1000000");
export const ZERO_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);
export const ZERO_ADDRESS_STRING = "0x0000000000000000000000000000000000000000";

export const ETH_MAINNET_REGISTRY_ADDRESS =
  "0xe15461b18ee31b7379019dc523231c57d1cbc18c";

export const ETH_MAINNET_NETWORK = "mainnet";
export const FTM_MAINNET_NETWORK = "fantom";
export const ARB_MAINNET_NETWORK = "arbitrum";

// Oracle Fantom https://ftmscan.com/address/0x57aa88a0810dfe3f9b71a9b179dd8bf5f956c46a#code
export const ETH_MAINNET_USDC_ORACLE_ADDRESS =
  "0x83d95e0d5f402511db06817aff3f9ea88224b030";
export const ETH_MAINNET_CALCULATIONS_CURVE_ADDRESS =
  "0x25BF7b72815476Dd515044F9650Bf79bAd0Df655";
export const ETH_MAINNET_CALCULATIONS_SUSHI_SWAP_ADDRESS =
  "0x8263e161A855B644f582d9C164C66aABEe53f927";

export const FTM_MAINNET_CALCULATIONS_SPOOKY_SWAP_ADDRESS =
  "0x1007eD6fdFAC72bbea9c719cf1Fa9C355D248691";
export const FTM_MAINNET_USDC_ORACLE_ADDRESS =
  "0x57AA88A0810dfe3f9b71a9b179Dd8bF5F956C46A";
export const FTM_MAINNET_CALCULATIONS_SUSHI_SWAP_ADDRESS =
  "0xec7Ac8AC897f5082B2c3d4e8D2173F992A097F24";

export const ARB_MAINNET_USDC_ORACLE_ADDRESS =
  "0x043518AB266485dC085a1DB095B8d9C2Fc78E9b9";
export const ARB_MAINNET_CALCULATIONS_SUSHI_SWAP_ADDRESS =
  "0x5EA7E501c9A23F4A76Dc7D33a11D995B13a1dD25";
"115792089237316195423570985008687907853269984665640564039457584007913129639935";
