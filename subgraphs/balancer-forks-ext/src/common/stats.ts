import { BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { Stat } from "../../generated/schema";
import {
  BIGINT_ZERO,
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  BIGDECIMAL_ONE,
  BIGINT_MAX,
  BIGDECIMAL_BIGINT_MAX,
} from "./constants";
import { addToArrayAtIndex } from "./utils/arrays";
import { BigDecimalTruncateToBigInt } from "./utils/utils";

export function getStat(id: string): Stat {
  let stat = Stat.load(id);

  if (!stat) {
    stat = new Stat(id);
    stat.count = BIGINT_ZERO;
    stat.meanAmount = BIGINT_ZERO;
    stat.meanUSD = BIGDECIMAL_ZERO;

    stat.maxAmount = BIGINT_ZERO;
    stat.maxUSD = BIGDECIMAL_ZERO;

    stat.minAmount = BIGINT_MAX;
    stat.minUSD = BIGDECIMAL_BIGINT_MAX;

    stat.varAmount = BIGDECIMAL_ZERO;
    stat.varUSD = BIGDECIMAL_ZERO;
    stat.values_usd = [];
    stat.values_amt = [];
    stat.save();
  }

  return stat;
}

export function updateStat(stat: Stat, amountToken: BigInt, amountUSD: BigDecimal): void {
  let count = stat.count.plus(BIGINT_ONE).toBigDecimal();

  // Update Max
  if (amountToken > stat.maxAmount) {
    stat.maxAmount = amountToken;
    stat.maxUSD = amountUSD;
  }

  // Update Min
  if (amountToken < stat.minAmount) {
    stat.minAmount = amountToken;
    stat.minUSD = amountUSD;
  }

  let X_amt = amountToken.toBigDecimal();
  let X_usd = amountUSD;

  if (count == BIGDECIMAL_ONE) {
    stat.S_amt = BIGDECIMAL_ZERO;
    stat.S_usd = BIGDECIMAL_ZERO;
    stat.varAmount = BIGDECIMAL_ZERO;
    stat.meanAmount = amountToken;
    stat.meanUSD = amountUSD;
    stat.varUSD = BIGDECIMAL_ZERO;
  } else {
    let M_amt = stat.meanAmount.toBigDecimal();
    let M_usd = stat.meanUSD;

    let newM_amt = M_amt.plus(X_amt.minus(M_amt).div(count));
    let newS_amt = stat.S_amt!.plus(X_amt.minus(M_amt).times(X_amt.minus(newM_amt)));

    let newM_usd = M_usd.plus(X_usd.minus(M_usd).div(count));
    let newS_usd = stat.S_usd!.plus(X_usd.minus(M_usd).times(X_usd.minus(newM_usd)));

    stat.S_amt = newS_amt;
    stat.S_usd = newS_usd;

    stat.varAmount = newS_amt.div(count.minus(BIGDECIMAL_ONE));
    stat.varUSD = newS_usd.div(count.minus(BIGDECIMAL_ONE));

    stat.meanAmount = BigDecimalTruncateToBigInt(newM_amt);
    stat.meanUSD = newM_usd;
  }

  stat.values_amt = addToArrayAtIndex<BigDecimal>(stat.values_amt, X_amt);
  stat.values_usd = addToArrayAtIndex<BigDecimal>(stat.values_usd, X_usd);

  stat.count = stat.count.plus(BIGINT_ONE);
  stat.save();
}
