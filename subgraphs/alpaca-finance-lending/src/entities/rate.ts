import { BigDecimal } from "@graphprotocol/graph-ts";
import { InterestRate } from "../../generated/schema";
import { InterestRateSide, InterestRateType } from "../utils/constants";

function createBorrowerVariableRate(
  marketId: string,
  interestRate: BigDecimal,
  timestamp: string
): InterestRate {
  const rate = new InterestRate(
    `${InterestRateSide.BORROWER}-${InterestRateType.VARIABLE}-${marketId}-${timestamp}`
  );
  rate.rate = interestRate;
  rate.side = InterestRateSide.BORROWER;
  rate.type = InterestRateType.VARIABLE;
  rate.save();
  return rate;
}

function createLenderVariableRate(
  marketId: string,
  interestRate: BigDecimal,
  timestamp: string
): InterestRate {
  const rate = new InterestRate(
    `${InterestRateSide.LENDER}-${InterestRateType.VARIABLE}-${marketId}-${timestamp}`
  );
  rate.rate = interestRate;
  rate.side = InterestRateSide.LENDER;
  rate.type = InterestRateType.VARIABLE;
  rate.save();
  return rate;
}

export function createInterestRates(
  marketId: string,
  borrowerInterestRate: BigDecimal,
  lenderInterestRate: BigDecimal,
  timestamp: string
): string[] {
  return [
    createBorrowerVariableRate(marketId, borrowerInterestRate, timestamp).id,
    createLenderVariableRate(marketId, lenderInterestRate, timestamp).id,
  ];
}
