import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export const PROTOCOL_NAME = "Gains Trade";
export const PROTOCOL_SLUG = "gains-trade";
export const VAULT_NAME = "gDAI Vault";
export const ORACLE = "chainlink";
export const PRECISION_BD = new BigDecimal(BigInt.fromString("10000000000"));
export const STANDARD_FEE = BigInt.fromI32(6)
  .toBigDecimal()
  .div(BigInt.fromI32(100).toBigDecimal());
