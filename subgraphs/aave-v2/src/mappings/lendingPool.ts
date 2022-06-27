import * as utils from "../common/utils";
import { updateTVL } from "../common/utils";
import * as constants from "../common/constants";
import { calculateRevenues } from "../modules/Revenue";
import {
  Repay,
  Borrow,
  Deposit,
  Withdraw,
  LiquidationCall,
  ReserveDataUpdated,
  ReserveUsedAsCollateralEnabled,
  ReserveUsedAsCollateralDisabled,
} from "../../generated/templates/LendingPool/LendingPool";
import { createRepayEntity } from "../modules/Repay";
import { createBorrowEntity } from "../modules/Borrow";
import { createDepositEntity } from "../modules/Deposit";
import { createWithdrawEntity } from "../modules/Withdraw";
import { createLiquidateEntity } from "../modules/Liquidate";
import { updateFinancials, updateUsageMetrics } from "../modules/Metrics";
import { createInterestRate, getOrCreateMarket, getOrCreateToken } from "../common/initializers";

export function handleReserveDataUpdated(event: ReserveDataUpdated): void {
  // This event handler updates the deposit/borrow rates on a market
  //  when the state of a reserve is updated

  const reserveAddress = event.params.reserve.toHexString();
  const market = getOrCreateMarket(event, reserveAddress);

  let stableBorrowRate = createInterestRate(
    market.id,
    constants.InterestRateSide.BORROWER,
    constants.InterestRateType.STABLE,
    utils.bigIntToBigDecimal(
      utils.rayToWad(event.params.stableBorrowRate)
    )
  )

  let variableBorrowRate = createInterestRate(
    market.id,
    constants.InterestRateSide.BORROWER,
    constants.InterestRateType.VARIABLE,
    utils.bigIntToBigDecimal(
      utils.rayToWad(event.params.variableBorrowRate)
    )
  );

  let depositRate = createInterestRate(
    market.id,
    constants.InterestRateSide.LENDER,
    constants.InterestRateType.VARIABLE,
    utils.bigIntToBigDecimal(
      utils.rayToWad(event.params.liquidityRate)
    )
  );

  market.rewardTokens = [stableBorrowRate.id, variableBorrowRate.id, depositRate.id]

  market.save();
}

export function handleDeposit(event: Deposit): void {
  const amount = event.params.amount;
  const token = getOrCreateToken(event.params.reserve);
  const reserveAddress = event.params.reserve.toHexString();
  const market = getOrCreateMarket(event, reserveAddress)

  createDepositEntity(
    event,
    market,
    reserveAddress,
    amount
  )

  updateTVL(market, token, amount, false);
  calculateRevenues(event, market, token);
  updateUsageMetrics(event.block, event.transaction.from);
  updateFinancials(event.block);
}

export function handleWithdraw(event: Withdraw): void {
  const amount = event.params.amount;
  const token = getOrCreateToken(event.params.reserve);
  const reserveAddress = event.params.reserve.toHexString();
  const market = getOrCreateMarket(event, reserveAddress);

  createWithdrawEntity(
    event, 
    market, 
    reserveAddress, 
    amount
  );

  updateTVL(market, token, amount, true);
  calculateRevenues(event, market, token);
  updateUsageMetrics(event.block, event.transaction.from);
  updateFinancials(event.block);
}

export function handleBorrow(event: Borrow): void {
  const amount = event.params.amount;
  const token = getOrCreateToken(event.params.reserve);
  const reserveAddress = event.params.reserve.toHexString();
  const market = getOrCreateMarket(event, reserveAddress);

  createBorrowEntity(
    event,
    market,
    reserveAddress,
    amount
  );

  updateTVL(market, token, amount, true);
  calculateRevenues(event, market, token);
  updateUsageMetrics(event.block, event.transaction.from);
  updateFinancials(event.block);
}

export function handleRepay(event: Repay): void {
  const amount = event.params.amount;
  const token = getOrCreateToken(event.params.reserve);
  const reserveAddress = event.params.reserve.toHexString();
  const market = getOrCreateMarket(event, reserveAddress);

  createRepayEntity(
    event,
    market,
    reserveAddress,
    amount
  );

  updateTVL(market, token, amount, false);
  calculateRevenues(event, market, token);
  updateUsageMetrics(event.block, event.transaction.from);
  updateFinancials(event.block);
}

export function handleLiquidationCall(event: LiquidationCall): void {
  const user = event.params.user.toHexString();
  const debtAsset = event.params.debtAsset.toHexString();
  const collateralAsset = event.params.collateralAsset.toHexString();
  const liquidator = event.params.liquidator.toHexString();
  const amount = event.params.liquidatedCollateralAmount;
  const market = getOrCreateMarket(event, collateralAsset);
  const token = getOrCreateToken(event.params.collateralAsset);

  createLiquidateEntity(
    event,
    market,
    user,
    debtAsset,
    collateralAsset,
    liquidator,
    amount
  )

  updateTVL(market, token, amount, false);
  calculateRevenues(event, market, token);
  updateUsageMetrics(event.block, event.transaction.from);
  updateFinancials(event.block);
}

export function handleReserveUsedAsCollateralEnabled(event: ReserveUsedAsCollateralEnabled): void {
  // This Event handler enables a reserve/market to be used as collateral
  const marketAddr = event.params.reserve.toHexString();
  const market = getOrCreateMarket(event, marketAddr);
  market.canUseAsCollateral = true;
  market.save();
}

export function handleReserveUsedAsCollateralDisabled(event: ReserveUsedAsCollateralDisabled): void {
  // This Event handler disables a reserve/market being used as collateral
  const marketAddr = event.params.reserve.toHexString();
  const market = getOrCreateMarket(event, marketAddr);
  market.canUseAsCollateral = false;
  market.save();
}
