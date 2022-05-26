import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

// The network names corresponding to the Network enum in the schema.
// They also correspond to the ones in `dataSource.network()` after converting to lower case.
// See below for a complete list:
// https://thegraph.com/docs/en/hosted-service/what-is-hosted-service/#supported-networks-on-the-hosted-service
export namespace Network {
  export const ARBITRUM_ONE = "ARBITRUM_ONE";
  export const AVALANCHE = "AVALANCHE";
  export const AURORA = "AURORA";
  export const BSC = "BSC"; // aka BNB Chain
  export const CELO = "CELO";
  export const MAINNET = "MAINNET"; // Ethereum mainnet
  export const FANTOM = "FANTOM";
  export const FUSE = "FUSE";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const NEAR_MAINNET = "NEAR_MAINNET";
  export const OPTIMISM = "OPTIMISM";
  export const MATIC = "MATIC"; // aka Polygon
  export const XDAI = "XDAI"; // aka Gnosis Chain
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

export namespace Protocol {
  export const NAME = "Stake DAO";
  export const SLUG = "stake-dao";
  export const SCHEMA_VERSION = "1.2.1";
  export const SUBGRAPH_VERSION = "1.2.0";
  export const METHODOLOGY_VERSION = "1.0.0";
  export const NETWORK = Network.MAINNET;
  export const TYPE = ProtocolType.YIELD;
}

export const SECONDS_PER_HOUR = 60 * 60;
export const SECONDS_PER_DAY = 60 * 60 * 24;
export const DEFAULT_PERFORMANCE_FEE = BigInt.fromI32(1500);
export const DEFAULT_WITHDRAWAL_FEE = BigInt.fromI32(50);

export const BASE_PARAMS = BigInt.fromString('1000000000');
export const BASE_TOKENS = BigInt.fromString('1000000000000000000');

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGINT_HUNDRED = BigInt.fromI32(100);
export const BIGINT_SECONDS_PER_DAY = BigInt.fromI32(SECONDS_PER_DAY);

export const DENOMINATOR = BigDecimal.fromString("10000");
export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export const BIGDECIMAL_HUNDRED = BigDecimal.fromString("100");

export const ETHEREUM_PROTOCOL_ID =
  "0x29D3782825432255041Db2EAfCB7174f5273f08A";

export const USDC_DECIMALS = 6;
export const DEFAULT_DECIMALS = BigInt.fromI32(18);
export const USDC_DENOMINATOR = BigDecimal.fromString("1000000");
export const ZERO_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);
export const ANGLE_USDC_VAULT_ADDRESS = Address.fromString(
  "0xf3c2bdfCCb75CAFdA3D69d807c336bede956563f"
);
export const STABLE_MASTER_ADDRESS = Address.fromString(
  "0x5adDc89785D75C86aB939E9e15bfBBb7Fc086A87"
);
export const POOL_MANAGER_ADDRESS = Address.fromString(
  "0xe9f183FC656656f1F17af1F2b0dF79b8fF9ad8eD"
);

export const ZERO_ADDRESS_STRING = "0x0000000000000000000000000000000000000000";
