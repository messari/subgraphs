import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);

export const GOVERNANCE_TYPE = "MakerGovernance";
export const MKR_TOKEN = "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2";
export const CHIEF = "0x0a3f6849f78076aefadf113f5bed87720274ddc0";

export namespace SpellState {
  export const ACTIVE = "ACTIVE";
  export const LIFTED = "LIFTED";
  export const SCHEDULED = "SCHEDULED";
  export const CAST = "CAST";
}
