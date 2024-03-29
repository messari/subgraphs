import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

// The network names corresponding to the Network enum in the schema.
// They also correspond to the ones in `dataSource.network()` after converting to lower case.
// See below for a complete list:
// https://thegraph.com/docs/en/hosted-service/what-is-hosted-service/#supported-networks-on-the-hosted-service
export namespace Network {
  export const ARBITRUM_ONE = "ARBITRUM_ONE";
  export const ARWEAVE_MAINNET = "ARWEAVE_MAINNET";
  export const AVALANCHE = "AVALANCHE";
  export const BOBA = "BOBA";
  export const AURORA = "AURORA";
  export const BSC = "BSC"; // aka BNB Chain
  export const CELO = "CELO";
  export const COSMOS = "COSMOS";
  export const CRONOS = "CRONOS";
  export const MAINNET = "MAINNET"; // Ethereum mainnet
  export const FANTOM = "FANTOM";
  export const FUSE = "FUSE";
  export const HARMONY = "HARMONY";
  export const JUNO = "JUNO";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const NEAR_MAINNET = "NEAR_MAINNET";
  export const OPTIMISM = "OPTIMISM";
  export const OSMOSIS = "OSMOSIS";
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

export namespace RewardIntervalType {
  export const BLOCK = "BLOCK";
  export const TIMESTAMP = "TIMESTAMP";
}

export namespace Protocol {
  export const NAME = "Badger DAO";
  export const SLUG = "badger-dao";
  export const SCHEMA_VERSION = "1.3.0";
  export const SUBGRAPH_VERSION = "1.1.0";
  export const METHODOLOGY_VERSION = "1.0.0";
}

export namespace NULL {
  export const TYPE_STRING = "0x0000000000000000000000000000000000000000";
  export const TYPE_ADDRESS = Address.fromString(TYPE_STRING);
}

export const DEFAULT_DECIMALS = 18;
export const SECONDS_PER_HOUR = 60 * 60;
export const SECONDS_PER_DAY = 60 * 60 * 24;

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_NEGATIVE_ONE = BigInt.fromI32(-1);

export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGINT_HUNDRED = BigInt.fromI32(100);

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_HUNDRED = BigDecimal.fromString("100");

export const MAX_BPS = BigDecimal.fromString("10000");
export const REWARDS_LOGGER_CACHING = BigInt.fromI32(20000);
export const ETH_AVERAGE_BLOCK_PER_HOUR = BigInt.fromI32(3756);

export const PROTOCOL_ID = "0x63cf44b2548e4493fd099222a1ec79f3344d9682";

export const BDIGG_VAULT_ADDRESS = Address.fromString(
  "0x7e7E112A68d8D2E221E11047a72fFC1065c38e1a"
);

export const CONTROLLER_ADDRESS = Address.fromString(
  "0x63cF44B2548e4493Fd099222A1eC79F3344D9682"
);

export const CVX_TOKEN_ADDRESS = Address.fromString(
  "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B"
);

export const BVECVX_VAULT_ADDRESS = Address.fromString(
  "0xfd05D3C7fe2924020620A8bE4961bBaA747e6305"
);

export const CRV_DAO_TOKEN = Address.fromString(
  "0xd533a949740bb3306d119cc777fa900ba034cd52"
);

export const DIGG_TOKEN_ADDRESS = Address.fromString(
  "0x798D1bE841a82a273720CE31c822C61a67a601C3"
);

export const REWARDS_LOGGER_ADDRESS = Address.fromString(
  "0x0A4F4e92C3334821EbB523324D09E321a6B0d8ec"
);
