import { Market } from "../../generated/schema";
import { BigDecimal, BigInt, near } from "@graphprotocol/graph-ts";
import { BD_ONE, BD_ZERO, BI_ZERO, NANOS_TO_MS } from "./const";

import { getRate } from "./rates";
import { bigDecimalExponential } from "./math";

const BD = (n: string): BigDecimal => BigDecimal.fromString(n);

/**
 * Compounds market interest and reserve values
 * @param market Market
 * @param receipt near.ReceiptWithOutcome
 * @returns
 */
export function compound(
  market: Market,
  receipt: near.ReceiptWithOutcome
): BigDecimal[] {
  const time_diff_ms = BigInt.fromU64(
    NANOS_TO_MS(receipt.block.header.timestampNanosec)
  ).minus(market._lastUpdateTimestamp);

  if (time_diff_ms.equals(BI_ZERO)) {
    return [BD_ZERO, BD_ZERO];
  }

  const rate = getRate(market);
  const interestScaled = bigDecimalExponential(
    rate.minus(BD_ONE),
    time_diff_ms.toBigDecimal()
  );

  const interest = interestScaled
    .times(market._totalBorrowed)
    .minus(market._totalBorrowed)
    .truncate(0);

  if (interestScaled.equals(BD_ONE)) {
    return [BD_ZERO, BD_ZERO];
  }

  const reserved = interest
    .times(market._reserveRatio.toBigDecimal())
    .div(BD("10000"));

  market._totalReserved = market._totalReserved.plus(reserved);

  market._totalDeposited = market._totalDeposited.plus(
    interest.minus(reserved)
  );
  market._totalBorrowed = market._totalBorrowed.plus(interest);

  // sub remaining reward
  const rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount!;
  const rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD!;
  const _rewardRemainingAmounts = market._rewardRemainingAmounts;

  for (let i = 0; i < rewardTokenEmissionsAmount.length; i++) {
    const dailyRewardTokenEmission = rewardTokenEmissionsAmount[i];
    const rewardTokenEmittedEveryMs = dailyRewardTokenEmission.div(
      BigInt.fromI32(24 * 60 * 60 * 1000)
    ); // in millisec

    _rewardRemainingAmounts[i] = _rewardRemainingAmounts[i].minus(
      rewardTokenEmittedEveryMs.times(time_diff_ms)
    );

    if (_rewardRemainingAmounts[i].lt(rewardTokenEmissionsAmount[i])) {
      rewardTokenEmissionsAmount[i] = BI_ZERO;
      rewardTokenEmissionsUSD[i] = BD_ZERO;
      _rewardRemainingAmounts[i] = BI_ZERO;
    }
  }
  market._rewardRemainingAmounts = _rewardRemainingAmounts;
  market.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
  market.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;

  // update timestamp
  market._lastUpdateTimestamp = market._lastUpdateTimestamp.plus(time_diff_ms);

  // protocol revenue, supply revenue
  return [reserved, interest.minus(reserved)];
}
