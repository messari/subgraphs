import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

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

// default usdc denominator
export const USDC_DENOMINATOR = BigInt.fromString("1000000");

// default no of decimals for tokens
export const DEFAULT_DECIMALS = 18;

// zero values
export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);

// no of seconds of a day
export const SECONDS_PER_DAY = 84600;

export const PROTOCOL_ID = Address.fromString("0xFda7eB6f8b7a9e9fCFd348042ae675d1d652454f");
export const PROTOCOL_NAME = "Badger DAO";
export const PROTOCOL_SLUG = "badger";
export const PROTOCOL_TYPE = ProtocolType.YIELD;
export const PROTOCOL_NETWORK = Network.ETHEREUM;

// null address
export const NULL_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000000");

// curve tokens price calculations
export const CALCULATIONS_CURVE_ADDRESS = Address.fromString("0x25BF7b72815476Dd515044F9650Bf79bAd0Df655");
