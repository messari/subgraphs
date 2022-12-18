import { BigDecimal, ethereum, log, BigInt } from "@graphprotocol/graph-ts";
import { Market, InterestRate } from "../../generated/schema";
import {
  SECONDS_PER_YEAR,
  InterestRateSide,
  InterestRateType,
  BIGDECIMAL_ZERO,
  BIGDECIMAL_HUNDRED,
  SECONDS_PER_DAY,
} from "../common/constants";

export function updateInterestRates(
  market: Market,
  borrowerInterestAmountUSD: BigDecimal,
  lenderInterestAmountUSD: BigDecimal,
  event: ethereum.Event
): void {
  const marketID = market.id;

  const secondsLapsed = event.block.timestamp.minus(market._interestTimestamp!);
  // only update rates in a day or longer
  if (secondsLapsed.lt(BigInt.fromI32(SECONDS_PER_DAY))) {
    return;
  }

  log.info(
    "[updateInterestRates]market {}/{} borrowerInterestAmountUSD={},lenderInterestAmountUSD={} block {} tx {}",
    [
      market.id,
      market.name!,
      borrowerInterestAmountUSD.toString(),
      lenderInterestAmountUSD.toString(),
      event.block.number.toString(),
      event.transaction.hash.toHexString(),
    ]
  );

  const rates: string[] = [];
  // scale interest rate to APR
  // since interest is not compounding, apply a linear scaler based on time
  const InterestRateScaler = BigInt.fromI32(SECONDS_PER_YEAR).divDecimal(
    secondsLapsed.toBigDecimal()
  );
  // even though borrow rates are supposed to be "STABLE", but there may be late payment, writedown
  // the actual rate may not be stable
  const borrowerInterestRateID = `${marketID}-${InterestRateSide.BORROWER}-${InterestRateType.STABLE}`;
  const borrowerInterestRate = new InterestRate(borrowerInterestRateID);
  if (market.totalBorrowBalanceUSD.gt(BIGDECIMAL_ZERO)) {
    borrowerInterestRate.side = InterestRateSide.BORROWER;
    borrowerInterestRate.type = InterestRateType.STABLE;
    borrowerInterestRate.rate = borrowerInterestAmountUSD
      .div(market.totalBorrowBalanceUSD)
      .times(InterestRateScaler)
      .times(BIGDECIMAL_HUNDRED);
    borrowerInterestRate.save();

    rates.push(borrowerInterestRate.id);
    market._borrowerInterestAmountUSD = BIGDECIMAL_ZERO;
    market._interestTimestamp = event.block.timestamp;
  } else {
    log.warning(
      "[updateInterestRates]market.totalBorrowBalanceUSD={} for market {} at tx {}, skip updating borrower rates",
      [
        market.totalBorrowBalanceUSD.toString(),
        marketID,
        event.transaction.hash.toHexString(),
      ]
    );
    for (let i = 0; i < market.rates.length; i++) {
      const interestRate = InterestRate.load(market.rates[i]);
      if (interestRate && interestRate.side == InterestRateSide.BORROWER) {
        rates.push(market.rates[i]);
      }
    }
  }

  // senior and junior rates are different, this is an average of them
  const lenderInterestRateID = `${marketID}-${InterestRateSide.LENDER}-${InterestRateType.STABLE}`;
  const lenderInterestRate = new InterestRate(lenderInterestRateID);
  if (market.totalDepositBalanceUSD.gt(BIGDECIMAL_ZERO)) {
    lenderInterestRate.side = InterestRateSide.LENDER;
    lenderInterestRate.type = InterestRateType.STABLE;
    lenderInterestRate.rate = lenderInterestAmountUSD
      .div(market.totalDepositBalanceUSD)
      .times(InterestRateScaler)
      .times(BIGDECIMAL_HUNDRED);
    lenderInterestRate.save();

    rates.push(lenderInterestRate.id);
    market._lenderInterestAmountUSD = BIGDECIMAL_ZERO;
  } else {
    log.warning(
      "[updateInterestRates]market.totalDepositBalanceUSD={} for market {} at tx {}, skip updating lender rates",
      [
        market.totalDepositBalanceUSD.toString(),
        marketID,
        event.transaction.hash.toHexString(),
      ]
    );
    for (let i = 0; i < market.rates.length; i++) {
      const interestRate = InterestRate.load(market.rates[i]);
      if (interestRate && interestRate.side == InterestRateSide.LENDER) {
        rates.push(market.rates[i]);
      }
    }
  }

  market.rates = rates;
  market.save();
}
