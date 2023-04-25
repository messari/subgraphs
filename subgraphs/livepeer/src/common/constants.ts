import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

////////////////////
///// Versions /////
////////////////////

export const PROTOCOL_NAME = "Livepeer";
export const PROTOCOL_SLUG = "livpeer";

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

export namespace TransactionType {
  export const DEPOSIT = "DEPOSIT";
  export const WITHDRAW = "WITHDRAW";
  export const REFRESH = "REFRESH";
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
export const BIGDECIMAL_ONE = BigDecimal.fromString("1");
export const BIGDECIMAL_TEN = BigDecimal.fromString("10");

export const USDC_ADDRESS = Address.fromString(
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
);

export const BIGINT_NEGATIVE_ONE = BigInt.fromString("-1");
export const BIG_DECIMAL_SECONDS_PER_DAY = BigDecimal.fromString("86400");
export const FEE_DENOMINATOR_BIGINT = BIGINT_TEN.pow(10);
export const FEE_DENOMINATOR = BigDecimal.fromString("10000000000");

export const LIVEPEER_PLATFORM_ID = "livepeer";
export const PROTOCOL_ID = "0x35bcf3c30594191d53231e4ff333e8a770453e40";

export const ROUND_MANAGER_ADDRESS = Address.fromString(
  "0xdd6f56dcC28D3F5f27084381fE8Df634985cc39f"
);
export const BONDING_MANAGER_ADDRESS = Address.fromString(
  "0x35bcf3c30594191d53231e4ff333e8a770453e40"
);
export const LPT_ADDRESS = Address.fromString(
  "0x289ba1701c2f088cf0faf8b3705246331cb8a839"
);

export const MINTER_ADDRESS = Address.fromString(
  "0xc20de37170b45774e6cd3d2304017fc962f27252"
);

export const WETH_ADDRESS = Address.fromString(
  "0x82af49447d8a07e3bd95bd0d56f35241523fbab1"
);

export const WETH_DECIMALS = 18;
export const UNISWAP_V3_LPT_ETH_POOL_ADDRESS = Address.fromString(
  "4fd47e5102dfbf95541f64ed6fe13d4ed26d2546"
);
export const UNISWAP_V3_DAI_ETH_POOL_ADDRESS = Address.fromString(
  "a961f0473da4864c5ed28e00fcc53a3aab056c1b"
);

export const QI92 = BigDecimal.fromString(
  "6277101735386680763835789423207666416102355444464034512896"
); // 2 ** 192
