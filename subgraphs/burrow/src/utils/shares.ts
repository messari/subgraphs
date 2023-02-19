import { BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { BD_ZERO, BD_BI } from "./const";

// convert token amounts to output shares
export function amount_to_shares(
  amount: BigDecimal,
  total_shares: BigInt,
  total_amount: BigDecimal
): BigInt {
  if (total_amount.equals(BD_ZERO)) {
    return BD_BI(amount.truncate(0));
  }
  return BD_BI(amount.times(total_shares.toBigDecimal()).div(total_amount));
}
