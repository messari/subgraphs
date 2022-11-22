import { BigDecimal } from "@graphprotocol/graph-ts";
import { InterestRate } from "../../generated/schema";
import { InterestRateSide, InterestRateType } from "../utils/constants";

function getOrCreateBorrowerVariableRate(
  marketId: string,
  interestRate: BigDecimal
): InterestRate {
  const id = `${InterestRateSide.BORROWER}-${InterestRateType.VARIABLE}-${marketId}`;
  let rate = InterestRate.load(id);
  if (!rate) {
    rate = new InterestRate(id);
    rate.rate = interestRate;
    rate.side = InterestRateSide.BORROWER;
    rate.type = InterestRateType.VARIABLE;
    rate.save();
  }
  return rate;
}

function getOrCreateLenderVariableRate(
  marketId: string,
  interestRate: BigDecimal
): InterestRate {
  const id = `${InterestRateSide.LENDER}-${InterestRateType.VARIABLE}-${marketId}`;
  let rate = InterestRate.load(id);
  if (!rate) {
    rate = new InterestRate(id);
    rate.rate = interestRate;
    rate.side = InterestRateSide.LENDER;
    rate.type = InterestRateType.VARIABLE;
    rate.save();
  }
  return rate;
}

export function getOrCreateInterestRates(
  marketId: string,
  borrowerInterestRate: BigDecimal,
  lenderInterestRate: BigDecimal
): string[] {
  return [
    getOrCreateBorrowerVariableRate(marketId, borrowerInterestRate).id,
    getOrCreateLenderVariableRate(marketId, lenderInterestRate).id,
  ];
}
