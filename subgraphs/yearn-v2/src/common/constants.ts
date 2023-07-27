import { Bytes, Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

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

export namespace NULL {
  export const TYPE_STRING = "0x0000000000000000000000000000000000000000";
  export const TYPE_ADDRESS = Address.fromString(TYPE_STRING);
}

export namespace Protocol {
  export const NAME = "Yearn v2";
  export const SLUG = "yearn-v2";
  export const NETWORK = Network.MAINNET;
}

export namespace VaultVersions {
  export const v0_3_0 = "0.3.0";
  export const v0_3_1 = "0.3.1";
  export const v0_3_2 = "0.3.2";
  export const v0_3_3 = "0.3.3";
  export const v0_3_5 = "0.3.5";
  export const v0_4_3 = "0.4.3";
}

export const DEFAULT_MANAGEMENT_FEE = BigInt.fromI32(200);
export const DEFAULT_PERFORMANCE_FEE = BigInt.fromI32(2000);
export const DEFAULT_WITHDRAWAL_FEE = BigInt.fromI32(50);

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGINT_HUNDRED = BigInt.fromI32(100);

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_HUNDRED = BigDecimal.fromString("100");
export const BIGDECIMAL_NEGATIVE_ONE = BigDecimal.fromString("-1");

export const USDC_DECIMALS = 6;
export const SECONDS_PER_HOUR = 60 * 60;
export const SECONDS_PER_DAY = 60 * 60 * 24;
export const DEFAULT_DECIMALS = BigInt.fromI32(18);
export const DEGRADATION_COEFFICIENT = BIGINT_TEN.pow(18);
export const USDC_DENOMINATOR = BigDecimal.fromString("1000000");
export const LOCKED_PROFIT_DEGRADATION = BigInt.fromString("46000000000000");

export const PROTOCOL_ID = "0xe15461b18ee31b7379019dc523231c57d1cbc18c";
export const YEARN_TREASURY_VAULT = Address.fromString(
  "0x93a62da5a14c80f265dabc077fcee437b1a0efde"
);

export const MAX_UINT256 = BigInt.fromI32(
  // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
  115792089237316195423570985008687907853269984665640564039457584007913129639935
);

export const MAX_UINT256_STR =
  "115792089237316195423570985008687907853269984665640564039457584007913129639935";

export const BLACKLISTED_TRANSACTION: Bytes[] = [
  Bytes.fromHexString(
    "0xc0ce9effb23616906fb04c5400764fc5f036c2977939c976e959aad23326fb55"
  ),
  Bytes.fromHexString(
    "0x0603adc7020c93dfa207b9cc00d4474fb6767ae2f0caf1aa7db64bf23cd67822"
  ),
  Bytes.fromHexString(
    "0x8dfecd98048998b91223303890f3e0f28b0b863077f98189090a837932fa6041"
  ),
  Bytes.fromHexString(
    "0x216abefbba23885d385278cb44573f407e250c9f4f65260c4bc71921e0ceeb19"
  ),
  Bytes.fromHexString(
    "0x4f7e0254eee6a2e2847cd4562fc2178d978b2ebfe424c8b5a6b93a3662f41525"
  ),
  Bytes.fromHexString(
    "0x4fc4e03751af80bf1bd548346ef6cdcb0ee99219379ffb7e9088585a4ef73c7e"
  ),
  Bytes.fromHexString(
    "0x09d08d6a2caeb6f4f1c90ac68adea93f758dc57d173acfa6621d92f3dc3277d0"
  ),
  Bytes.fromHexString(
    "0x151be1c35cbf00fd29e0e370cf5a0469d96656df16b74f19a597b3e87d8f724d"
  ),
  Bytes.fromHexString(
    "0x66847f4dc80a6b4c32666972a9a68416d802d78b54619503fd0aec358fedb185"
  ),
];
