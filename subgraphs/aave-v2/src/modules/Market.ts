import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { Address } from "@graphprotocol/graph-ts";
import { createInterestRate } from "../common/initializers";
import { LendingPool } from "../../generated/templates/LendingPool/LendingPool";

export function getMarketRates(
  marketAddress: string,
  lendingPoolAddress: string
): string[] {
  const lendingPoolContract = LendingPool.bind(
    Address.fromString(lendingPoolAddress)
  );
  const reserveData = lendingPoolContract.try_getReserveData(
    Address.fromString(marketAddress)
  );

  if (reserveData.reverted) return [];

  let stableBorrowRate = createInterestRate(
    marketAddress,
    constants.InterestRateSide.BORROWER,
    constants.InterestRateType.STABLE,
    utils.bigIntToBigDecimal(
      utils.rayToWad(reserveData.value.currentStableBorrowRate)
    )
  );
  let variableBorrowRate = createInterestRate(
    marketAddress,
    constants.InterestRateSide.BORROWER,
    constants.InterestRateType.VARIABLE,
    utils.bigIntToBigDecimal(
      utils.rayToWad(reserveData.value.currentVariableBorrowRate)
    )
  );
  let depositRate = createInterestRate(
    marketAddress,
    constants.InterestRateSide.LENDER,
    constants.InterestRateType.VARIABLE,
    utils.bigIntToBigDecimal(
      utils.rayToWad(reserveData.value.currentLiquidityRate)
    )
  );

  return [stableBorrowRate.id, variableBorrowRate.id, depositRate.id];
}
