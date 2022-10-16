import { BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { Stat } from "../../generated/schema";
import * as constants from "../common/constants";
import { BigDecimalToBigInt } from "../common/utils";

export function getStat(id: string): Stat {
  let stat = Stat.load(id);

  if (!stat) {
    stat = new Stat(id);
    stat.count = constants.BIGINT_ZERO;
    stat.meanAmount = constants.BIGINT_ZERO;
    stat.meanUSD = constants.BIGDECIMAL_ZERO;

    stat.maxAmount = constants.BIGINT_ZERO;
    stat.maxUSD = constants.BIGDECIMAL_ZERO;

    stat.minAmount = constants.BIGINT_MAX;
    stat.minUSD = constants.BIGDECIMAL_BIGINT_MAX;

    stat.varAmount = constants.BIGDECIMAL_ZERO;
    stat.varUSD = constants.BIGDECIMAL_ZERO;
    stat.save();
  }

  return stat;
}

export function updateStat(
  stat: Stat,
  amountToken: BigInt,
  amountUSD: BigDecimal
): void {
  const count = stat.count.plus(constants.BIGINT_ONE).toBigDecimal();

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

  const X_amt = amountToken.toBigDecimal();
  const X_usd = amountUSD;

  if (count == constants.BIGDECIMAL_ONE) {
    stat.S_amt = constants.BIGDECIMAL_ZERO;
    stat.S_usd = constants.BIGDECIMAL_ZERO;
    stat.varAmount = constants.BIGDECIMAL_ZERO;
    stat.meanAmount = amountToken;
    stat.meanUSD = amountUSD;
    stat.varUSD = constants.BIGDECIMAL_ZERO;
  } else {
    const M_amt = stat.meanAmount.toBigDecimal();
    const M_usd = stat.meanUSD;

    const newM_amt = M_amt.plus(X_amt.minus(M_amt).div(count));
    const newS_amt = stat.S_amt!.plus(
      X_amt.minus(M_amt).times(X_amt.minus(newM_amt))
    );

    const newM_usd = M_usd.plus(X_usd.minus(M_usd).div(count));
    const newS_usd = stat.S_usd!.plus(
      X_usd.minus(M_usd).times(X_usd.minus(newM_usd))
    );

    stat.S_amt = newS_amt;
    stat.S_usd = newS_usd;

    stat.varAmount = newS_amt.div(count.minus(constants.BIGDECIMAL_ONE));
    stat.varUSD = newS_usd.div(count.minus(constants.BIGDECIMAL_ONE));

    stat.meanAmount = BigDecimalToBigInt(newM_amt);
    stat.meanUSD = newM_usd;
  }

  stat.count = stat.count.plus(constants.BIGINT_ONE);
  stat.save();
}
