import { BigDecimal } from "@graphprotocol/graph-ts";
import { InterestRate } from "../../generated/schema";
import {
  BIGDECIMAL_ONE,
  InterestRateSide,
  InterestRateType,
  PROTOCOL_FEE_PERCENT,
} from "../utils/constants";

export function createBorrowerStableRate(
  marketId: string,
  interestRate: BigDecimal,
  timestamp: string
): InterestRate {
  const rate = new InterestRate(
    `${InterestRateSide.BORROWER}-${InterestRateType.STABLE}-${marketId}-${timestamp}`
  );
  rate.rate = interestRate;
  rate.side = InterestRateSide.BORROWER;
  rate.type = InterestRateType.STABLE;
  rate.save();
  return rate;
}

export function createLenderStableRate(
  marketId: string,
  interestRate: BigDecimal,
  timestamp: string
): InterestRate {
  const rate = new InterestRate(
    `${InterestRateSide.LENDER}-${InterestRateType.STABLE}-${marketId}-${timestamp}`
  );
  rate.rate = interestRate;
  rate.side = InterestRateSide.LENDER;
  rate.type = InterestRateType.STABLE;
  rate.save();
  return rate;
}

export function createInterestRates(
  marketId: string,
  borrowerInterestRate: BigDecimal,
  timestamp: string
): string[] {
  return [
    createBorrowerStableRate(marketId, borrowerInterestRate, timestamp).id,
    createLenderStableRate(
      marketId,
      borrowerInterestRate.times(BIGDECIMAL_ONE.minus(PROTOCOL_FEE_PERCENT)),
      timestamp
    ).id,
  ];
}
