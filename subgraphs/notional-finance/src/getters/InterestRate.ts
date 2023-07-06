import { InterestRate } from "../../generated/schema";
import {
  BIGDECIMAL_ONE,
  InterestRateSide,
  InterestRateType,
} from "../common/constants";

export function getOrCreateInterestRate(marketId: string): InterestRate {
  let interestRate = InterestRate.load("BORROWER-" + "FIXED-" + marketId);

  if (!interestRate) {
    interestRate = new InterestRate("BORROWER-" + "FIXED-" + marketId);
    interestRate.side = InterestRateSide.BORROWER;
    interestRate.type = InterestRateType.FIXED;
    interestRate.rate = BIGDECIMAL_ONE;
    interestRate.save();
  }

  return interestRate;
}
