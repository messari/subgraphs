import { InterestRate } from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  InterestRateSide,
  InterestRateType,
} from "../utils/constants";

export function getOrCreateStableBorrowerInterestRate(
  marketID: string
): InterestRate {
  const rate = new InterestRate(
    `${InterestRateSide.BORROWER}-${InterestRateType.STABLE}-${marketID}`
  );
  rate.rate = BIGDECIMAL_ZERO;
  rate.side = InterestRateSide.BORROWER;
  rate.type = InterestRateType.STABLE;
  rate.save();
  return rate;
}
