import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

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
export const DEFAULT_PERFORMANCE_FEE = BigInt.fromI32(1500);
export const DEFAULT_WITHDRAWAL_FEE = BigInt.fromI32(50);

export const ZERO_ADDRESS_STRING = ("0x0");
export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGINT_HUNDRED = BigInt.fromI32(100);
export const BIGDECIMAL_HUNDRED = BigDecimal.fromString("100");

export const ETHEREUM_PROTOCOL_ID =
  "0x29D3782825432255041Db2EAfCB7174f5273f08A";
export const ETH_MAINNET_CALCULATIONS_SUSHI_ADDRESS =
  "0x8263e161A855B644f582d9C164C66aABEe53f927";
export const ZERO_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);

// Yearn registry contract
export const USDC_DECIMALS = 6;
export const DEFAULT_DECIMALS = BigInt.fromI32(18);
export const USDC_DENOMINATOR = BigInt.fromString("1000000");
export const DEFAULT_DECIMALS_BIGINT = BigInt.fromString("1000000000000000000");
export const MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));
export const DAYS_PER_YEAR = BigInt.fromI32(365);
export const MS_PER_DAY = BigInt.fromI32(24 * 60 * 60 * 1000);
export const MS_PER_YEAR = DAYS_PER_YEAR.times(
  BigInt.fromI32(24 * 60 * 60 * 1000)
);
