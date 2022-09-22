import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);

export namespace SpellState {
  export const ACTIVE = "ACTIVE";
  export const LIFTED = "LIFTED";
  export const SCHEDULED = "SCHEDULED";
  export const CAST = "CAST";
}
