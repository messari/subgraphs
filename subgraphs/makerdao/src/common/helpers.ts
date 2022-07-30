import { ethereum, BigDecimal, BigInt, log, Address, Bytes } from "@graphprotocol/graph-ts";
import {
  Market,
  Account,
  ActiveAccount,
  Deposit,
  Withdraw,
  Borrow,
  Repay,
  Liquidate,
  Token,
  Position,
  PositionSnapshot,
  _InteralPosition,
} from "../../generated/schema";
import {
  getOrCreateMarketHourlySnapshot,
  getOrCreateMarketDailySnapshot,
  getOrCreateFinancials,
  getOrCreateLendingProtocol,
  getOrCreateUsageMetricsHourlySnapshot,
  getOrCreateUsageMetricsDailySnapshot,
  getNext_PositionCounter,
  getOrCreate_PositionCounter,
  getOrCreateAccount,
  getOrCreateMarket,
  getOrCreatePosition,
  getMarketAddressFromIlk,
  getMarketFromIlk,
} from "./getters";
import {
  BIGDECIMAL_ZERO,
  SECONDS_PER_HOUR,
  SECONDS_PER_DAY,
  BIGINT_ZERO,
  BIGINT_NEG_ONE,
  BIGDECIMAL_NEG_ONE,
  DAI_ADDRESS,
  VAT_ADDRESS,
  WAD,
  RAD,
  INT_ZERO,
  INT_ONE,
  PositionSide,
  EventType,
} from "./constants";
import { createEventID } from "../utils/strings";
import { bigIntToBDUseDecimals } from "../utils/numbers";
import { DAI } from "../../generated/Vat/DAI";

export function updateProtocol(
  deltaCollateralUSD: BigDecimal = BIGDECIMAL_ZERO,
  deltaDebtUSD: BigDecimal = BIGDECIMAL_ZERO,
  liquidateUSD: BigDecimal = BIGDECIMAL_ZERO,
  newTotalRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
  newSupplySideRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
): void {
  let protocol = getOrCreateLendingProtocol();

  // update Deposit
  if (deltaCollateralUSD.gt(BIGDECIMAL_ZERO)) {
    protocol.cumulativeDepositUSD = protocol.cumulativeDepositUSD.plus(deltaCollateralUSD);
  }

  // protocol.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD.plus(deltaCollateralUSD);
  // instead, iterate over markets to get "mark-to-market" deposit balance
  let totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
  let totalDepositBalanceUSD = BIGDECIMAL_ZERO;
  for (let i: i32 = 0; i < protocol.marketIDList.length; i++) {
    let marketID = protocol.marketIDList[i];
    let market = Market.load(marketID);
    totalBorrowBalanceUSD = totalBorrowBalanceUSD.plus(market!.totalBorrowBalanceUSD);
    totalDepositBalanceUSD = totalDepositBalanceUSD.plus(market!.totalDepositBalanceUSD);
  }
  protocol.totalBorrowBalanceUSD = totalBorrowBalanceUSD;
  protocol.totalDepositBalanceUSD = totalDepositBalanceUSD;
  protocol.totalValueLockedUSD = protocol.totalDepositBalanceUSD;

  /* alternatively, get total borrow (debt) from vat.debt
  // this would include borrow interest, etc
  // so they two will have some difference
  let vatContract = Vat.bind(Address.fromString(VAT_ADDRESS));
  let debtCall = vatContract.try_debt();
  if (debtCall.reverted) {
    log.warning("[updateProtocal]Failed to call Vat.debt; not updating protocol.totalBorrowBalanceUSD", []);
  } else {
    protocol.totalBorrowBalanceUSD = bigIntToBDUseDecimals(debtCall.value, RAD+);
  }
  */

  // update Borrow
  if (deltaDebtUSD.gt(BIGDECIMAL_ZERO)) {
    protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(deltaDebtUSD);
  }

  if (liquidateUSD.gt(BIGDECIMAL_ZERO)) {
    protocol.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD.plus(liquidateUSD);
  }

  // update revenue
  if (newTotalRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(newTotalRevenueUSD);
  }

  if (newSupplySideRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
  }

  if (newTotalRevenueUSD.gt(BIGDECIMAL_ZERO) || newSupplySideRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeTotalRevenueUSD.minus(
      protocol.cumulativeSupplySideRevenueUSD,
    );
  }

  // update mintedTokenSupplies
  let daiContract = DAI.bind(Address.fromString(DAI_ADDRESS));
  protocol.mintedTokens = [DAI_ADDRESS];
  protocol.mintedTokenSupplies = [daiContract.totalSupply()];

  protocol.save();
}

export function updateMarket(
  marketID: string,
  deltaCollateralUSD: BigDecimal = BIGDECIMAL_ZERO,
  deltaDebtUSD: BigDecimal = BIGDECIMAL_ZERO,
  liquidateUSD: BigDecimal = BIGDECIMAL_ZERO,
  newTotalRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
  newSupplySideRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
): void {
  let market = getOrCreateMarket(marketID);

  if (deltaCollateralUSD.gt(BIGDECIMAL_ZERO)) {
    market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(deltaCollateralUSD);
  } else if (deltaCollateralUSD.lt(BIGDECIMAL_ZERO)) {
    // ignore as we don't care about cumulativeWithdraw in a market
  }

  if (deltaDebtUSD.gt(BIGDECIMAL_ZERO)) {
    market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(deltaDebtUSD);
  } else if (deltaDebtUSD.lt(BIGDECIMAL_ZERO)) {
    // again ignore repay
  }

  if (liquidateUSD.gt(BIGDECIMAL_ZERO)) {
    market.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD.plus(liquidateUSD);
  }

  // update revenue
  if (newTotalRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    market.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD.plus(newTotalRevenueUSD);
  }

  if (newSupplySideRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    market.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
  }

  if (newTotalRevenueUSD.gt(BIGDECIMAL_ZERO) || newSupplySideRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    market.cumulativeProtocolSideRevenueUSD = market.cumulativeTotalRevenueUSD.minus(
      market.cumulativeSupplySideRevenueUSD,
    );
  }
  market.save();
}

export function updateMarketSnapshot(
  market: Market,
  event: ethereum.Event,
  deltaCollateralUSD: BigDecimal = BIGDECIMAL_ZERO,
  deltaDebtUSD: BigDecimal = BIGDECIMAL_ZERO,
  liquidateUSD: BigDecimal = BIGDECIMAL_ZERO,
  newTotalRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
  newSupplySideRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
): void {
  let marketID = market.id;
  let marketHourlySnapshot = getOrCreateMarketHourlySnapshot(event, marketID);
  let marketDailySnapshot = getOrCreateMarketDailySnapshot(event, marketID);
  if (marketHourlySnapshot == null || marketDailySnapshot == null) {
    log.error("[updateMarketSnapshot]Failed to get marketsnapshot for {}", [marketID]);
    return;
  }

  marketHourlySnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  marketHourlySnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketHourlySnapshot.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD;
  marketHourlySnapshot.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD;
  marketHourlySnapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
  marketHourlySnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketHourlySnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketHourlySnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketHourlySnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketHourlySnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  marketHourlySnapshot.inputTokenBalance = market.inputTokenBalance;
  marketHourlySnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  //marketHourlySnapshot.outputTokenSupply = market.outputTokenSupply;
  //marketHourlySnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;

  marketHourlySnapshot.blockNumber = event.block.number;
  marketHourlySnapshot.timestamp = event.block.timestamp;

  marketDailySnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  marketDailySnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketDailySnapshot.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD;
  marketDailySnapshot.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD;
  marketDailySnapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
  marketDailySnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  marketDailySnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketDailySnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketDailySnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketDailySnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  marketDailySnapshot.inputTokenBalance = market.inputTokenBalance;
  marketDailySnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  //marketDailySnapshot.outputTokenSupply = market.outputTokenSupply;
  //marketDailySnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;

  marketDailySnapshot.blockNumber = event.block.number;
  marketDailySnapshot.timestamp = event.block.timestamp;

  if (deltaCollateralUSD.gt(BIGDECIMAL_ZERO)) {
    marketHourlySnapshot.hourlyDepositUSD = marketHourlySnapshot.hourlyDepositUSD.plus(deltaCollateralUSD);
    marketDailySnapshot.dailyDepositUSD = marketDailySnapshot.dailyDepositUSD.plus(deltaCollateralUSD);
  } else if (deltaCollateralUSD.lt(BIGDECIMAL_ZERO)) {
    // minus a negative number
    marketHourlySnapshot.hourlyWithdrawUSD = marketHourlySnapshot.hourlyWithdrawUSD.minus(deltaCollateralUSD);
    marketDailySnapshot.dailyWithdrawUSD = marketDailySnapshot.dailyWithdrawUSD.minus(deltaCollateralUSD);
  }

  if (deltaDebtUSD.gt(BIGDECIMAL_ZERO)) {
    marketHourlySnapshot.hourlyBorrowUSD = marketHourlySnapshot.hourlyBorrowUSD.plus(deltaDebtUSD);
    marketDailySnapshot.dailyBorrowUSD = marketDailySnapshot.dailyBorrowUSD.plus(deltaDebtUSD);
  } else if (deltaDebtUSD.lt(BIGDECIMAL_ZERO)) {
    // minus a negative number
    marketHourlySnapshot.hourlyRepayUSD = marketHourlySnapshot.hourlyRepayUSD.minus(deltaDebtUSD);
    marketDailySnapshot.dailyRepayUSD = marketDailySnapshot.dailyRepayUSD.minus(deltaDebtUSD);
  }

  if (liquidateUSD.gt(BIGDECIMAL_ZERO)) {
    marketHourlySnapshot.hourlyLiquidateUSD = marketHourlySnapshot.hourlyLiquidateUSD.plus(liquidateUSD);
    marketDailySnapshot.dailyLiquidateUSD = marketDailySnapshot.dailyLiquidateUSD.plus(liquidateUSD);
  }

  // update revenue
  if (newTotalRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    marketHourlySnapshot.hourlyTotalRevenueUSD = marketHourlySnapshot.hourlyTotalRevenueUSD.plus(newTotalRevenueUSD);
    marketDailySnapshot.dailyTotalRevenueUSD = marketDailySnapshot.dailyTotalRevenueUSD.plus(newTotalRevenueUSD);
  }

  if (newSupplySideRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    marketHourlySnapshot.hourlySupplySideRevenueUSD = marketHourlySnapshot.hourlySupplySideRevenueUSD.plus(
      newSupplySideRevenueUSD,
    );
    marketDailySnapshot.dailySupplySideRevenueUSD = marketDailySnapshot.dailySupplySideRevenueUSD.plus(
      newSupplySideRevenueUSD,
    );
  }

  if (newTotalRevenueUSD.gt(BIGDECIMAL_ZERO) || newSupplySideRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    marketHourlySnapshot.hourlyProtocolSideRevenueUSD = marketHourlySnapshot.hourlyTotalRevenueUSD.minus(
      marketHourlySnapshot.hourlySupplySideRevenueUSD,
    );
    marketDailySnapshot.dailyProtocolSideRevenueUSD = marketDailySnapshot.dailyTotalRevenueUSD.minus(
      marketDailySnapshot.dailySupplySideRevenueUSD,
    );
  }
  marketHourlySnapshot.save();
  marketDailySnapshot.save();
}

export function updateFinancialsSnapshot(
  event: ethereum.Event,
  deltaCollateralUSD: BigDecimal = BIGDECIMAL_ZERO,
  deltaDebtUSD: BigDecimal = BIGDECIMAL_ZERO,
  liquidateUSD: BigDecimal = BIGDECIMAL_ZERO,
  newTotalRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
  newSupplySideRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
): void {
  let protocol = getOrCreateLendingProtocol();
  let financials = getOrCreateFinancials(event);

  financials.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financials.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
  financials.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
  financials.mintedTokenSupplies = protocol.mintedTokenSupplies;

  financials.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
  financials.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
  financials.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  financials.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
  financials.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
  financials.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;

  if (deltaCollateralUSD.gt(BIGDECIMAL_ZERO)) {
    financials.dailyDepositUSD = financials.dailyDepositUSD.plus(deltaCollateralUSD);
  } else if (deltaCollateralUSD.lt(BIGDECIMAL_ZERO)) {
    // minus a negative number
    financials.dailyWithdrawUSD = financials.dailyWithdrawUSD.minus(deltaCollateralUSD);
  }

  if (deltaDebtUSD.gt(BIGDECIMAL_ZERO)) {
    financials.dailyBorrowUSD = financials.dailyBorrowUSD.plus(deltaDebtUSD);
  } else if (deltaDebtUSD.lt(BIGDECIMAL_ZERO)) {
    // minus a negative number
    financials.dailyRepayUSD = financials.dailyRepayUSD.minus(deltaDebtUSD);
  }

  if (liquidateUSD.gt(BIGDECIMAL_ZERO)) {
    financials.dailyLiquidateUSD = financials.dailyLiquidateUSD.plus(liquidateUSD);
  }

  if (newTotalRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    financials.dailyTotalRevenueUSD = financials.dailyTotalRevenueUSD.plus(newTotalRevenueUSD);
  }

  if (newSupplySideRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    financials.dailySupplySideRevenueUSD = financials.dailySupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
  }

  financials.dailyProtocolSideRevenueUSD = financials.dailyTotalRevenueUSD.minus(financials.dailySupplySideRevenueUSD);

  financials.blockNumber = event.block.number;
  financials.timestamp = event.block.timestamp;
  financials.save();
}

// updatePosition based on deposit/withdraw/borrow/repay
export function updatePosition(
  event: ethereum.Event,
  accountAddress: string,
  marketID: string,
  deltaCollateral: BigInt = BIGINT_ZERO,
  deltaDebt: BigInt = BIGINT_ZERO,
  liquidateCollateral: BigInt = BIGINT_ZERO, // collateral liquidated in liquidation
  liquidateDebt: BigInt = BIGINT_ZERO, // debt repaid in liquidation
): void {
  let lenderPositionPrefix = `${accountAddress}-${marketID}-${PositionSide.LENDER}`;
  let borrowerPositionPrefix = `${accountAddress}-${marketID}-${PositionSide.BORROWER}`;
  let lenderCounter = getOrCreate_PositionCounter(lenderPositionPrefix);
  let borrowerCounter = getOrCreate_PositionCounter(borrowerPositionPrefix);
  let lenderPositionID = `${lenderPositionPrefix}-${lenderCounter.nextCount}`;
  let borrowerPositionID = `${borrowerPositionPrefix}-${borrowerCounter.nextCount}`;
  let lenderPosition: Position | null = null;
  let borrowerPosition: Position | null = null;

  let protocol = getOrCreateLendingProtocol();
  let market = getOrCreateMarket(marketID);
  let account = getOrCreateAccount(accountAddress);

  let eventSuffix = createEventID(event);

  if (deltaCollateral.gt(BIGINT_ZERO)) {
    // deposit
    lenderPosition = getOrCreatePosition(event, PositionSide.LENDER, marketID, accountAddress);
    if (lenderPosition.depositCount == INT_ZERO) {
      // this is a new lender position
      protocol.openPositionCount += INT_ONE;
      protocol.cumulativePositionCount += INT_ONE;

      market.positionCount += INT_ONE;
      market.openPositionCount += INT_ONE;
      market.lendingPositionCount += INT_ONE;

      account.positionCount += INT_ONE;
      account.openPositionCount += INT_ONE;
    }

    lenderPosition.depositCount += INT_ONE;
    // adds to existing deposit
    lenderPosition.balance = lenderPosition.balance.plus(deltaCollateral);
    lenderPosition.save();

    // link event to position (handleTransactions needs to be called first)
    let deposit = Deposit.load(`${EventType.DEPOSIT}-${eventSuffix}`);
    deposit!.position = lenderPosition.id;
    deposit!.save();
  } else if (deltaCollateral.lt(BIGINT_ZERO)) {
    lenderPosition = Position.load(lenderPositionID);
    // withdraw
    if (!lenderPosition) {
      //this should not happen: cannot withdraw without deposit first
      log.error("[updatePosition]withdraw from position {} without deposit at tx hash {}", [
        lenderPositionID,
        event.transaction.hash.toHexString(),
      ]);
    } else {
      lenderPosition.withdrawCount += INT_ONE;
      lenderPosition.balance = lenderPosition.balance.minus(deltaCollateral);
      if (lenderPosition.balance == BIGINT_ZERO) {
        // close lender position
        lenderPosition.blockNumberClosed = event.block.number;
        lenderPosition.timestampClosed = event.block.timestamp;
        lenderCounter.nextCount += 1; //increase nextCount after closing a position
        lenderCounter.save();

        protocol.openPositionCount -= INT_ONE;

        market.openPositionCount -= INT_ONE;
        market.closedPositionCount += INT_ONE;

        account.openPositionCount -= INT_ONE;
        account.closedPositionCount += INT_ONE;
      }
      lenderPosition.save();

      // link event to position (handleTransactions needs to be called first)
      let withdraw = Withdraw.load(`${EventType.WITHDRAW}-${eventSuffix}`);
      withdraw!.position = lenderPosition.id;
      withdraw!.save();
    }
  }

  if (deltaDebt.gt(BIGINT_ZERO)) {
    // borrow
    borrowerPosition = getOrCreatePosition(event, PositionSide.BORROWER, marketID, accountAddress);
    if (borrowerPosition.borrowCount == INT_ZERO) {
      // new borrower position
      protocol.openPositionCount += INT_ONE;
      protocol.cumulativePositionCount += INT_ONE;

      market.positionCount += INT_ONE;
      market.openPositionCount += INT_ONE;
      market.borrowingPositionCount += INT_ONE;

      account.positionCount += INT_ONE;
      account.openPositionCount += INT_ONE;
    }
    borrowerPosition.borrowCount += INT_ONE;
    borrowerPosition.balance = borrowerPosition.balance.plus(deltaDebt);
    borrowerPosition.save();
    // link event to position (handleTransactions needs to be called first)
    let borrow = Borrow.load(`${EventType.BORROW}-${eventSuffix}`);
    borrow!.position = borrowerPosition.id;
    borrow!.save();
  } else if (deltaDebt.lt(BIGINT_ZERO)) {
    // repay
    borrowerPosition = Position.load(borrowerPositionID);
    if (!borrowerPosition) {
      //this should not happen: cannot repay without borrow first
      log.error("[updatePosition]repay position {} without borrowing at tx hash {}", [
        borrowerPositionID,
        event.transaction.hash.toHexString(),
      ]);
    } else {
      borrowerPosition.borrowCount += INT_ONE;
      borrowerPosition.balance = borrowerPosition.balance.minus(deltaDebt);
      if (borrowerPosition.balance == BIGINT_ZERO) {
        // close borrower position
        borrowerPosition.blockNumberClosed = event.block.number;
        borrowerPosition.timestampClosed = event.block.timestamp;
        borrowerCounter.nextCount += INT_ONE;
        borrowerCounter.save();

        protocol.openPositionCount -= INT_ONE;

        market.openPositionCount -= INT_ONE;
        market.closedPositionCount += INT_ONE;

        account.openPositionCount -= INT_ONE;
        account.closedPositionCount += INT_ONE;
      }
      borrowerPosition.save();
      // link event to position (handleTransactions needs to be called first)
      let repay = Repay.load(`${EventType.REPAY}-${eventSuffix}`);
      repay!.position = borrowerPosition.id;
      repay!.save();
    }
  }

  if (liquidateCollateral.gt(BIGINT_ZERO)) {
    lenderPosition = getOrCreatePosition(event, PositionSide.LENDER, marketID, accountAddress);
    lenderPosition.liquidationCount += INT_ONE;
    lenderPosition.balance = lenderPosition.balance.minus(liquidateCollateral);
    if (lenderPosition.balance == BIGINT_ZERO) {
      // lender position closed by liquidation
      lenderPosition.blockNumberClosed = event.block.number;
      lenderPosition.timestampClosed = event.block.timestamp;
      lenderCounter.nextCount += 1; //increase nextCount after closing a position
      lenderCounter.save();

      protocol.openPositionCount -= INT_ONE;

      market.openPositionCount -= INT_ONE;
      market.closedPositionCount += INT_ONE;

      account.openPositionCount -= INT_ONE;
      account.closedPositionCount += INT_ONE;
    }
    // link event to position (handleTransactions needs to be called first)
    let liquidate = Liquidate.load(`${eventSuffix}`);
    liquidate!.position = lenderPosition.id;
    liquidate!.save();
  }

  if (liquidateDebt.gt(BIGINT_ZERO)) {
    borrowerPosition = getOrCreatePosition(event, PositionSide.BORROWER, marketID, accountAddress);
    borrowerPosition.liquidationCount += 1;
    borrowerPosition.balance = borrowerPosition.balance.minus(liquidateDebt);
    if (borrowerPosition.balance == BIGINT_ZERO) {
      // borrower position closed by liquidation
      borrowerPosition.blockNumberClosed = event.block.number;
      borrowerPosition.timestampClosed = event.block.timestamp;
      borrowerCounter.nextCount += INT_ONE;
      borrowerCounter.save();

      protocol.openPositionCount -= INT_ONE;

      market.openPositionCount -= INT_ONE;
      market.closedPositionCount += INT_ONE;

      account.openPositionCount -= INT_ONE;
      account.closedPositionCount += INT_ONE;
    }
  }

  if (lenderPosition != null) {
    snapshotPosition(event, lenderPosition);
  }
  if (borrowerPosition != null) {
    snapshotPosition(event, borrowerPosition);
  }

  protocol.save();
  market.save();
  account.save();
}

// handle transfer of position from one user account (src) to another (dst)
export function transferPosition(event: ethereum.Event, ilk: Bytes, urnAddress: string, dstAddress: string): void {
  let protocol = getOrCreateLendingProtocol();
  let market: Market = getMarketFromIlk(ilk)!;
  let internalPositionID = `${urnAddress}-${ilk.toHexString()}`;
  let internalPosition: _InteralPosition = _InteralPosition.load(internalPositionID)!;
  let srcAccountAddress = internalPosition.accountAddress;
  let srcAccount = getOrCreateAccount(srcAccountAddress);
  let dstAccount = getOrCreateAccount(dstAddress);

  // close any open lender positions linked with this internal position
  let openLenderBalance = BIGINT_ZERO;
  for (let i: i32 = 0; i <= internalPosition.lenderPositions!.length; i++) {
    let lenderPositionID = internalPosition.lenderPositions![i];
    let lenderPosition: Position = Position.load(lenderPositionID)!;
    if (lenderPosition.balance != BIGINT_ZERO) {
      openLenderBalance = openLenderBalance.plus(lenderPosition.balance);
      lenderPosition.balance = BIGINT_ZERO;
      lenderPosition.hashClosed = event.transaction.hash.toHexString();
      lenderPosition.blockNumberClosed = event.block.number;
      lenderPosition.timestampClosed = event.block.timestamp;

      // update position counts for protocl, market, and account
      protocol.openPositionCount -= INT_ONE;

      market.openPositionCount -= INT_ONE;
      market.closedPositionCount += INT_ONE;

      srcAccount.openPositionCount -= INT_ONE;
      srcAccount.closedPositionCount += INT_ONE;

      snapshotPosition(event, lenderPosition);
    }
  }

  // close any open borrower positions linked with this internal position
  let openBorrowerBalance = BIGINT_ZERO;
  for (let i: i32 = 0; i <= internalPosition.borrowerPositions!.length; i++) {
    let borrowerPositionID = internalPosition.borrowerPositions![i];
    let borrowerPosition = Position.load(borrowerPositionID);
    if (borrowerPosition != null && borrowerPosition.balance != BIGINT_ZERO) {
      openBorrowerBalance = openBorrowerBalance.plus(borrowerPosition.balance);
      borrowerPosition.balance = BIGINT_ZERO;
      borrowerPosition.hashClosed = event.transaction.hash.toHexString();
      borrowerPosition.blockNumberClosed = event.block.number;
      borrowerPosition.timestampClosed = event.block.timestamp;

      // update position counts for protocl, market, and account
      protocol.openPositionCount -= INT_ONE;

      market.openPositionCount -= INT_ONE;
      market.closedPositionCount += INT_ONE;

      srcAccount.openPositionCount -= INT_ONE;
      srcAccount.closedPositionCount += INT_ONE;

      snapshotPosition(event, borrowerPosition);
    }
  }

  //open dst positions
  if (openLenderBalance.gt(BIGINT_ZERO)) {
    // force to open a new position even if there are open positions
    let lenderPosition = getOrCreatePosition(event, PositionSide.LENDER, market.id, dstAddress, true);
    lenderPosition.balance = openLenderBalance;
    lenderPosition.save();
    internalPosition.lenderPositions = [lenderPosition.id];

    // update protocol, market, account openPositionCount
    protocol.openPositionCount += INT_ONE;
    protocol.cumulativePositionCount += INT_ONE;

    market.positionCount += INT_ONE;
    market.openPositionCount += INT_ONE;
    market.borrowingPositionCount += INT_ONE;

    dstAccount.positionCount += INT_ONE;
    dstAccount.openPositionCount += INT_ONE;

    snapshotPosition(event, lenderPosition);
  }

  if (openBorrowerBalance.gt(BIGINT_ZERO)) {
    // force to open a new position even if there are open positions
    let borrowerPosition = getOrCreatePosition(event, PositionSide.BORROWER, market.id, dstAddress, true);
    borrowerPosition.balance = openBorrowerBalance;
    borrowerPosition.save();
    internalPosition.lenderPositions = [borrowerPosition.id];

    // update protocol, market, account openPositionCount
    protocol.openPositionCount += INT_ONE;
    protocol.cumulativePositionCount += INT_ONE;

    market.positionCount += INT_ONE;
    market.openPositionCount += INT_ONE;
    market.borrowingPositionCount += INT_ONE;

    dstAccount.positionCount += INT_ONE;
    dstAccount.openPositionCount += INT_ONE;

    snapshotPosition(event, borrowerPosition);
  }

  // reset internalPosition using new owner address (dst)
  internalPosition.accountAddress = dstAddress;
  internalPosition.save();

  protocol.save();
  market.save();
  srcAccount.save();
  dstAccount.save();
}

export function snapshotPosition(event: ethereum.Event, position: Position): void {
  let txHash: string = event.transaction.hash.toHexString();
  let snapshotID = `${position.id}-${txHash}-${event.logIndex.toString()}`;
  let snapshot = PositionSnapshot.load(snapshotID);
  if (snapshot == null) {
    // this should always be the case with schema v2.0.1
    snapshot = new PositionSnapshot(snapshotID);
    snapshot.hash = txHash;
    snapshot.logIndex = event.logIndex.toI32();
    snapshot.nonce = event.transaction.nonce;
    snapshot.position = position.id;
    snapshot.balance = position.balance;
    snapshot.blockNumber = event.block.number;
    snapshot.timestamp = event.block.timestamp;
    snapshot.save();
  } else {
    log.error("[snapshotPosition]Position snapshot {} already exists for position {} at tx hash {}", [
      snapshotID,
      position.id,
      txHash,
    ]);
  }
}

// update usage for deposit/withdraw/borrow/repay
export function updateUsageMetrics(
  event: ethereum.Event,
  users: string[] = [], //user u, v, w
  deltaCollateralUSD: BigDecimal = BIGDECIMAL_ZERO,
  deltaDebtUSD: BigDecimal = BIGDECIMAL_ZERO,
  liquidateUSD: BigDecimal = BIGDECIMAL_ZERO,
  liquidator: string | null = null,
  liquidatee: string | null = null,
): void {
  let protocol = getOrCreateLendingProtocol();
  let usageHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(event);
  let usageDailySnapshot = getOrCreateUsageMetricsDailySnapshot(event);

  let hours: string = (event.block.timestamp.toI64() / SECONDS_PER_HOUR).toString();
  let days: string = (event.block.timestamp.toI64() / SECONDS_PER_DAY).toString();

  // userU, userV, userW may be the same, they may not
  for (let i: i32 = 0; i < users.length; i++) {
    let accountID = users[i];
    let account = Account.load(accountID);
    if (account == null) {
      account = new Account(accountID);
      account.depositCount = INT_ZERO;
      account.withdrawCount = INT_ZERO;
      account.borrowCount = INT_ZERO;
      account.repayCount = INT_ZERO;
      account.liquidateCount = INT_ZERO;
      account.liquidationCount = INT_ZERO;
      account.save();

      protocol.cumulativeUniqueUsers += 1;
      usageHourlySnapshot.cumulativeUniqueUsers += 1;
      usageDailySnapshot.cumulativeUniqueUsers += 1;
    }

    let hourlyActiveAcctountID = "hourly-"
      .concat(accountID)
      .concat("-")
      .concat(hours);
    let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAcctountID);
    if (hourlyActiveAccount == null) {
      hourlyActiveAccount = new ActiveAccount(hourlyActiveAcctountID);
      hourlyActiveAccount.save();

      usageHourlySnapshot.hourlyActiveUsers += 1;
    }

    let dailyActiveAcctountID = "daily-"
      .concat(accountID)
      .concat("-")
      .concat(days);
    let dailyActiveAccount = ActiveAccount.load(dailyActiveAcctountID);
    if (dailyActiveAccount == null) {
      dailyActiveAccount = new ActiveAccount(dailyActiveAcctountID);
      dailyActiveAccount.save();

      usageDailySnapshot.dailyActiveUsers += 1;
    }
  }

  if (deltaCollateralUSD.gt(BIGDECIMAL_ZERO)) {
    usageHourlySnapshot.hourlyDepositCount += 1;
    usageDailySnapshot.dailyDepositCount += 1;
    let depositAccount = Account.load(users[1]); // user v
    if (depositAccount!.depositCount == 0) {
      // a new depositor
      protocol.cumulativeUniqueDepositors += 1;
      usageDailySnapshot.cumulativeUniqueDepositors += 1;
    }
    depositAccount!.depositCount += INT_ONE;
    depositAccount!.save();

    let dailyDepositorAcctountID = "daily-depositor-"
      .concat(users[1])
      .concat("-")
      .concat(days);
    let dailyDepositorAccount = ActiveAccount.load(dailyDepositorAcctountID);
    if (dailyDepositorAccount == null) {
      dailyDepositorAccount = new ActiveAccount(dailyDepositorAcctountID);
      dailyDepositorAccount.save();

      usageDailySnapshot.dailyActiveDepositors += 1;
    }
  } else if (deltaCollateralUSD.lt(BIGDECIMAL_ZERO)) {
    usageHourlySnapshot.hourlyWithdrawCount += 1;
    usageDailySnapshot.dailyWithdrawCount += 1;

    let withdrawAccount = Account.load(users[1]);
    withdrawAccount!.withdrawCount += INT_ONE;
    withdrawAccount!.save();
  }

  if (deltaDebtUSD.gt(BIGDECIMAL_ZERO)) {
    usageHourlySnapshot.hourlyBorrowCount += 1;
    usageDailySnapshot.dailyBorrowCount += 1;

    let borrowAccount = Account.load(users[2]); // user w
    if (borrowAccount!.borrowCount == 0) {
      // a new borrower
      protocol.cumulativeUniqueBorrowers += 1;
      usageDailySnapshot.cumulativeUniqueBorrowers += 1;
    }
    borrowAccount!.borrowCount += INT_ONE;
    borrowAccount!.save();

    let dailyBorrowerAcctountID = "daily-borrow-"
      .concat(users[2])
      .concat("-")
      .concat(days);
    let dailyBorrowerAccount = ActiveAccount.load(dailyBorrowerAcctountID);
    if (dailyBorrowerAccount == null) {
      dailyBorrowerAccount = new ActiveAccount(dailyBorrowerAcctountID);
      dailyBorrowerAccount.save();

      usageDailySnapshot.dailyActiveBorrowers += 1;
    }
  } else if (deltaDebtUSD.lt(BIGDECIMAL_ZERO)) {
    usageHourlySnapshot.hourlyRepayCount += 1;
    usageDailySnapshot.dailyRepayCount += 1;

    let repayAccount = Account.load(users[1]);
    repayAccount!.repayCount += INT_ONE;
    repayAccount!.save();
  }

  if (liquidateUSD.gt(BIGDECIMAL_ZERO)) {
    usageHourlySnapshot.hourlyLiquidateCount += 1;
    usageDailySnapshot.dailyLiquidateCount += 1;

    if (liquidator) {
      let liquidatorAccount = Account.load(liquidator);
      // a new liquidator
      if (liquidatorAccount == null) {
        liquidatorAccount = new Account(liquidator);
        protocol.cumulativeUniqueLiquidators += 1;
        usageDailySnapshot.cumulativeUniqueLiquidators += 1;
      } else if (liquidatorAccount!.liquidateCount == 0) {
        protocol.cumulativeUniqueLiquidators += 1;
        usageDailySnapshot.cumulativeUniqueLiquidators += 1;
      }

      liquidatorAccount!.liquidateCount += INT_ONE;
      liquidatorAccount!.save();

      let dailyLiquidatorAcctountID = "daily-liquidate"
        .concat(liquidator)
        .concat("-")
        .concat(days);
      let dailyLiquidatorAccount = ActiveAccount.load(dailyLiquidatorAcctountID);
      if (dailyLiquidatorAccount == null) {
        dailyLiquidatorAccount = new ActiveAccount(dailyLiquidatorAcctountID);
        dailyLiquidatorAccount.save();

        usageDailySnapshot.dailyActiveLiquidators += 1;
      }
    }
    if (liquidatee) {
      let liquidateeAccount = Account.load(liquidatee);
      // a new liquidatee
      if (liquidateeAccount == null) {
        liquidateeAccount = new Account(liquidatee);
        protocol.cumulativeUniqueLiquidatees += 1;
        usageDailySnapshot.cumulativeUniqueLiquidatees += 1;
      } else if (liquidateeAccount!.liquidationCount == 0) {
        protocol.cumulativeUniqueLiquidatees += 1;
        usageDailySnapshot.cumulativeUniqueLiquidatees += 1;
      }

      liquidateeAccount!.liquidationCount += INT_ONE;
      liquidateeAccount!.save();

      let dailyLiquidateeAcctountID = "daily-liquidatee-"
        .concat(liquidatee)
        .concat("-")
        .concat(days);
      let dailyLiquidateeAccount = ActiveAccount.load(dailyLiquidateeAcctountID);
      if (dailyLiquidateeAccount == null) {
        dailyLiquidateeAccount = new ActiveAccount(dailyLiquidateeAcctountID);
        dailyLiquidateeAccount.save();

        usageDailySnapshot.dailyActiveLiquidatees += 1;
      }
    }
  }

  usageHourlySnapshot.hourlyTransactionCount += 1;
  usageDailySnapshot.dailyTransactionCount += 1;
  usageHourlySnapshot.blockNumber = event.block.number;
  usageDailySnapshot.blockNumber = event.block.number;
  usageHourlySnapshot.timestamp = event.block.timestamp;
  usageDailySnapshot.timestamp = event.block.timestamp;

  protocol.save();
  usageHourlySnapshot.save();
  usageDailySnapshot.save();
}

export function handleTransactions(
  event: ethereum.Event,
  marketID: string,
  userU: string,
  userV: string,
  userW: string,
  tokenID: string,
  deltaCollateral: BigInt = BIGINT_ZERO,
  deltaCollateralUSD: BigDecimal = BIGDECIMAL_ZERO,
  deltaDebt: BigInt = BIGINT_ZERO,
  deltaDebtUSD: BigDecimal = BIGDECIMAL_ZERO,
  liquidateAmt: BigInt = BIGINT_ZERO,
  liquidateUSD: BigDecimal = BIGDECIMAL_ZERO,
): void {
  let protocol = getOrCreateLendingProtocol();
  let market = getOrCreateMarket(marketID);
  let transactionID = createEventID(event);

  if (deltaCollateral.gt(BIGINT_ZERO)) {
    // deposit
    let deposit = new Deposit("DEPOSIT-" + transactionID);
    deposit.hash = event.transaction.hash.toHexString();
    deposit.logIndex = event.logIndex.toI32();
    deposit.nonce = event.transaction.nonce;
    deposit.account = userV;
    deposit.blockNumber = event.block.number;
    deposit.timestamp = event.block.timestamp;
    deposit.market = marketID;
    deposit.asset = tokenID;
    deposit.amount = deltaCollateral;
    deposit.amountUSD = deltaCollateralUSD;
    deposit.save();
  } else if (deltaCollateral.lt(BIGINT_ZERO)) {
    //withdraw
    let withdraw = new Withdraw("WITHDRAW-" + transactionID);
    withdraw.hash = event.transaction.hash.toHexString();
    withdraw.logIndex = event.logIndex.toI32();
    withdraw.nonce = event.transaction.nonce;
    withdraw.account = userV;
    withdraw.blockNumber = event.block.number;
    withdraw.timestamp = event.block.timestamp;
    withdraw.market = marketID;
    withdraw.asset = tokenID;
    withdraw.amount = deltaCollateral.times(BIGINT_NEG_ONE);
    withdraw.amountUSD = deltaCollateralUSD.times(BIGDECIMAL_NEG_ONE);
    withdraw.save();
  }

  if (deltaDebt.gt(BIGINT_ZERO)) {
    // borrow
    let borrow = new Borrow("BORROW-" + transactionID);
    borrow.hash = event.transaction.hash.toHexString();
    borrow.logIndex = event.logIndex.toI32();
    borrow.nonce = event.transaction.nonce;
    borrow.account = userW;
    borrow.blockNumber = event.block.number;
    borrow.timestamp = event.block.timestamp;
    borrow.market = marketID;
    borrow.asset = tokenID;
    borrow.amount = deltaDebt;
    borrow.amountUSD = deltaDebtUSD;
    borrow.save();
  } else if (deltaDebt.lt(BIGINT_ZERO)) {
    // repay
    let repay = new Repay("REPAY-" + transactionID);
    repay.hash = event.transaction.hash.toHexString();
    repay.logIndex = event.logIndex.toI32();
    repay.nonce = event.transaction.nonce;
    repay.account = userW;
    repay.blockNumber = event.block.number;
    repay.timestamp = event.block.timestamp;
    repay.market = marketID;
    repay.asset = tokenID;
    repay.amount = deltaDebt.times(BIGINT_NEG_ONE);
    repay.amountUSD = deltaDebtUSD.times(BIGDECIMAL_NEG_ONE);
    repay.save();
  }

  // liquidate is handled by getOrCreateLiquidate() in getters
}

export function updatePriceForMarket(marketID: string, event: ethereum.Event): void {
  // Price is updated for market marketID
  let market = getOrCreateMarket(marketID);
  let token = Token.load(market.inputToken);
  market.totalDepositBalanceUSD = bigIntToBDUseDecimals(market.inputTokenBalance, token!.decimals).times(
    market.inputTokenPriceUSD,
  );
  market.totalValueLockedUSD = market.totalDepositBalanceUSD;
  market.save();

  // iterate to update protocol level totalDepositBalanceUSD
  let protocol = getOrCreateLendingProtocol();
  let marketIDList = protocol.marketIDList;
  let protocolTotalDepositBalanceUSD = BIGDECIMAL_ZERO;
  for (let i: i32 = 0; i < marketIDList.length; i++) {
    let marketAddress = marketIDList[i];
    let market = getOrCreateMarket(marketAddress);
    if (market == null) {
      log.warning("[updatePriceForMarket]market {} doesn't exist", [marketAddress]);
      continue;
    }
    protocolTotalDepositBalanceUSD = protocolTotalDepositBalanceUSD.plus(market.totalDepositBalanceUSD);
  }

  protocol.totalDepositBalanceUSD = protocolTotalDepositBalanceUSD;
  protocol.totalValueLockedUSD = protocol.totalDepositBalanceUSD;
  protocol.save();

  updateFinancialsSnapshot(event);
}

export function updateRevenue(
  event: ethereum.Event,
  marketID: string,
  newTotalRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
  newSupplySideRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
): void {
  let market = getOrCreateMarket(marketID);
  if (market) {
    updateMarket(
      event,
      market,
      BIGDECIMAL_ZERO,
      BIGDECIMAL_ZERO,
      BIGDECIMAL_ZERO,
      newTotalRevenueUSD,
      newSupplySideRevenueUSD,
    );
  }
  updateProtocol(BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, newTotalRevenueUSD, newSupplySideRevenueUSD);
  updateFinancialsSnapshot(
    event,
    BIGDECIMAL_ZERO,
    BIGDECIMAL_ZERO,
    BIGDECIMAL_ZERO,
    newTotalRevenueUSD,
    newSupplySideRevenueUSD,
  );
}
