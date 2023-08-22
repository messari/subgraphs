import { BigDecimal } from "@graphprotocol/graph-ts";
import { Pool } from "../sdk/protocols/perpfutures/pool";

export function updatePoolOpenInterestUSD(
  pool: Pool,
  amountChangeUSD: BigDecimal,
  isIncrease: boolean,
  isLong: boolean
): void {
  if (isLong) {
    pool.updateLongOpenInterestUSD(amountChangeUSD, isIncrease);
  } else {
    pool.updateShortOpenInterestUSD(amountChangeUSD, isIncrease);
  }
}
