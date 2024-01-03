import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

///////////////////////////////////////////////////////////////////////////
/////////////////////////////////// COMMON ////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export namespace NULL {
  export const TYPE_STRING = "0x0000000000000000000000000000000000000000";
  export const TYPE_ADDRESS = Address.fromString(TYPE_STRING);
}

export const CHAIN_LINK_USD_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000348"
);

export const PRICE_LIB_VERSION = "1.1.0";

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGINT_TEN_THOUSAND = BigInt.fromI32(10000);

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_USD_PRICE = BigDecimal.fromString("1000000");

export const AAVE_ORACLE_DECIMALS = 8;
export const DEFAULT_USDC_DECIMALS = 6;
export const DEFAULT_DECIMALS = BigInt.fromI32(18);

export const BLACKLIST_TOKENS = [
  Address.fromString("0x761d38e5ddf6ccf6cf7c55759d5210750b5d60f3"), // ELON
  Address.fromString("0xd9a8bb44968f35282f1b91c353f77a61baf31a4b"), // GTPS
  Address.fromString("0xbc0071caa8d58a85c9bacbd27bb2b22cbf4ff479"), // GTPS fantom
  Address.fromString("0xd52d9ba6fcbadb1fe1e3aca52cbb72c4d9bbb4ec"), // GTPS polygon
  Address.fromString("0x337dc89ebcc33a337307d58a51888af92cfdc81b"), // WFTM
  Address.fromString("0xbd31ea8212119f94a611fa969881cba3ea06fa3d"), // LUNA (Wormhole)
  Address.fromString("0xd2877702675e6ceb975b4a1dff9fb7baf4c91ea9"), // wrapped LUNA
  Address.fromString("0x4674672bcddda2ea5300f5207e1158185c944bc0"), // GXT
  Address.fromString("0x050cbff7bff0432b6096dd15cd9499913ddf8e23"), // FCI
  Address.fromString("0x924828a9fb17d47d0eb64b57271d10706699ff11"), // SFI fantom
  Address.fromString("0x363053c3eb5c25bce94f0ce6568fa7292f600614"), // ESMPTOKIN polygon
  Address.fromString("0x59aa0f4d4b8de74fc83a0f270eb1767d5cd94753"), // BFL mainnet
];
