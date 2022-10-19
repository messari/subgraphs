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

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGINT_TEN_THOUSAND = BigInt.fromI32(10000);

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_USD_PRICE = BigDecimal.fromString("1000000")

export const DEFAULT_USDC_DECIMALS = 6;
export const DEFAULT_DECIMALS = BigInt.fromI32(18);
