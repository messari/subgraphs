import { BigDecimal } from "@graphprotocol/graph-ts";
import { InterestRate } from "../../../../generated/schema";
import { ReserveDataUpdated } from "../../../../generated/templates/Pool/Pool";
import {
  BIGDECIMAL_HUNDRED,
  InterestRateSide,
  InterestRateType,
} from "../../../../src/utils/constants";
import {
  bigIntToBigDecimal,
  rayAPRtoAPY,
  rayToWad,
} from "../../../../src/utils/numbers";

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

export function createBorrowerVariableRate(
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

export function createLenderVariableRate(
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

export function createInterestRatesFromEvent(
  marketId: string,
  event: ReserveDataUpdated
): string[] {
  const timestamp = event.block.timestamp.toString();
  event.params.liquidityIndex;
  return [
    createBorrowerStableRate(
      marketId,
      bigIntToBigDecimal(
        rayToWad(rayAPRtoAPY(event.params.stableBorrowRate))
      ).times(BIGDECIMAL_HUNDRED),
      timestamp
    ).id,
    createBorrowerVariableRate(
      marketId,
      bigIntToBigDecimal(
        rayToWad(rayAPRtoAPY(event.params.variableBorrowRate))
      ).times(BIGDECIMAL_HUNDRED),
      timestamp
    ).id,
    createLenderVariableRate(
      marketId,
      bigIntToBigDecimal(
        rayToWad(rayAPRtoAPY(event.params.liquidityRate))
      ).times(BIGDECIMAL_HUNDRED),
      timestamp
    ).id,
  ];
}
