import { BigDecimal } from "@graphprotocol/graph-ts";
import { InterestRate } from "../../generated/schema";
import { InterestRateSide, InterestRateType } from "../utils/constants";

function createBorrowerVariableRate(
  marketId: string,
  interestRate: BigDecimal
): InterestRate {
  const id = `${InterestRateSide.BORROWER}-${InterestRateType.VARIABLE}-${marketId}`;
  let rate = InterestRate.load(id);
  if (!rate) {
    rate = new InterestRate(id);
  }

  rate.rate = interestRate;
  rate.side = InterestRateSide.BORROWER;
  rate.type = InterestRateType.VARIABLE;
  rate.save();
  return rate;
}

function createLenderVariableRate(
  marketId: string,
  interestRate: BigDecimal
): InterestRate {
  const id = `${InterestRateSide.LENDER}-${InterestRateType.VARIABLE}-${marketId}`;
  let rate = InterestRate.load(id);
  if (!rate) {
    rate = new InterestRate(id);
  }
  rate.rate = interestRate;
  rate.side = InterestRateSide.LENDER;
  rate.type = InterestRateType.VARIABLE;
  rate.save();

  return rate;
}

export function getOrCreateInterestRateIds(
  marketId: string,
  borrowerInterestRate: BigDecimal,
  lenderInterestRate: BigDecimal
): string[] {
  return [
    createBorrowerVariableRate(marketId, borrowerInterestRate).id,
    createLenderVariableRate(marketId, lenderInterestRate).id,
  ];
}
