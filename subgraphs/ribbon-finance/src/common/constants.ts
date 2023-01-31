import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

////////////////////
///// Versions /////
////////////////////

export const PROTOCOL_NAME = "Ribbon Finance";
export const PROTOCOL_SLUG = "ribbon-finance";
export const PROTOCOL_SCHEMA_VERSION = "1.3.0";
export const PROTOCOL_SUBGRAPH_VERSION = "1.0.0";
export const PROTOCOL_METHODOLOGY_VERSION = "1.0.0";

////////////////////////
///// Schema Enums /////
////////////////////////

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

export namespace NULL {
  export const TYPE_STRING = "0x0000000000000000000000000000000000000000";
  export const TYPE_ADDRESS = Address.fromString(TYPE_STRING);
}



export const SECONDS_PER_HOUR = 60 * 60;
export const SECONDS_PER_DAY = 60 * 60 * 24;
export const MAX_BPS = BigInt.fromI32(10000);
export const DEFAULT_DECIMALS = BigInt.fromI32(18);

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGINT_HUNDRED = BigInt.fromI32(100);

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_HUNDRED = BigDecimal.fromString("100");
export const BIGDECIMAL_NEGATIVE_ONE = BigDecimal.fromString("-1");


export const PANCAKE_FACTORY_ADDRESS = Address.fromString(
  "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73"
);
export const WBNB_ADDRESS = Address.fromString(
  "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
);
export const BUSD_ADDRESS = Address.fromString(
  "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"
);
export const USDC_ADDRESS = Address.fromString(
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
);
export const BBTC_ADDRESS = Address.fromString(
  "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c"
);
export const EPS_ADDRESS = Address.fromString(
  "0xA7f552078dcC247C2684336020c03648500C6d9F"
);
export const EPX_ADDRESS = Address.fromString(
  "0xaf41054c1487b0e5e2b9250c0332ecbce6ce9d71"
);

export const TRICRYPTO_LP_TOKEN = Address.fromString(
  "0xaF4dE8E872131AE328Ce21D909C74705d3Aaf452"
);

export const POOL_FEE = BigDecimal.fromString("0.0004");
export const ADMIN_FEE = BigDecimal.fromString("0.5");

export namespace PoolType {
  export const LENDING = "LENDING";
  export const PLAIN = "PLAIN";
  export const METAPOOL = "METAPOOL";
  export const BASEPOOL = "BASEPOOL";
}

export const BIGINT_NEGATIVE_ONE = BigInt.fromString("-1");

export const BIG_DECIMAL_SECONDS_PER_DAY = BigDecimal.fromString("86400");

export const FEE_DENOMINATOR_BIGINT = BIGINT_TEN.pow(10);
export const FEE_DENOMINATOR = BigDecimal.fromString("10000000000");

export const DEFAULT_POOL_FEE = BigInt.fromString("4000000");
export const DEFAULT_ADMIN_FEE = BigInt.fromString("5000000000");

export const MARGIN_POOL = Address.fromString(
  "0x5934807cC0654d46755eBd2848840b616256C6Ef"
);
export const ETH_CALL_V2_CONTRACT = Address.fromString(
  "0x25751853Eab4D0eB3652B5eB6ecB102A2789644B"
);

export const RBN_TOKEN = Address.fromString(
  "0x6123b0049f904d730db3c36a31167d9d4121fa6b"
);
export const ETH_AVERAGE_BLOCK_PER_HOUR = BigInt.fromString("92000");

export const GAUGE_CONTROLLER_ADDRESS = Address.fromString(
  "0x0cb9cc35cEFa5622E8d25aF36dD56DE142eF6415"
);
export const RIBBON_PLATFORM_ID = "ribbon";
export const PROTOCOL_ID = "0x25751853Eab4D0eB3652B5eB6ecB102A2789644B";