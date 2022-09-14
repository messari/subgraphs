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
  _InternalPosition,
  _Urn,
} from "../../generated/schema";
import {
  getOrCreateMarketHourlySnapshot,
  getOrCreateMarketDailySnapshot,
  getOrCreateFinancials,
  getOrCreateLendingProtocol,
  getOrCreateUsageMetricsHourlySnapshot,
  getOrCreateUsageMetricsDailySnapshot,
  getSnapshotRates,
  getNextPositionCounter,
  getOrCreatePositionCounter,
  getOrCreateAccount,
  getOrCreateMarket,
  getOrCreatePosition,
  getMarketAddressFromIlk,
  getMarketFromIlk,
  getPositionIDForAccount,
  getOwnerAddressFromUrn,
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
  ProtocolSideRevenueType,
  INT_ZERO,
  INT_ONE,
  PositionSide,
  EventType,
} from "./constants";
import { createEventID } from "../utils/strings";
import { bigIntToBDUseDecimals } from "../utils/numbers";
import { DAI } from "../../generated/Vat/DAI";
import { getOrCreateToken } from "./getters";

export function updateProtocol(
  deltaCollateralUSD: BigDecimal = BIGDECIMAL_ZERO,
  deltaDebtUSD: BigDecimal = BIGDECIMAL_ZERO,
  liquidateUSD: BigDecimal = BIGDECIMAL_ZERO,
  newTotalRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
  newSupplySideRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
  protocolSideRevenueType: u32 = 0,
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

  if (newTotalRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(newTotalRevenueUSD);
  }

  if (newSupplySideRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
  }

  let newProtocolSideRevenueUSD = newTotalRevenueUSD.minus(newSupplySideRevenueUSD);
  if (newProtocolSideRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeTotalRevenueUSD.minus(
      protocol.cumulativeSupplySideRevenueUSD,
    );
    switch (protocolSideRevenueType) {
      case ProtocolSideRevenueType.STABILITYFEE:
        protocol._cumulativeProtocolSideStabilityFeeRevenue = protocol._cumulativeProtocolSideStabilityFeeRevenue!.plus(
          newProtocolSideRevenueUSD,
        );
        break;
      case ProtocolSideRevenueType.LIQUIDATION:
        protocol._cumulativeProtocolSideLiquidationRevenue = protocol._cumulativeProtocolSideLiquidationRevenue!.plus(
          newProtocolSideRevenueUSD,
        );
        break;
      case ProtocolSideRevenueType.PSM:
        protocol._cumulativeProtocolSidePSMRevenue = protocol._cumulativeProtocolSidePSMRevenue!.plus(
          newProtocolSideRevenueUSD,
        );
        break;
    }
  }

  // update mintedTokenSupplies
  let daiContract = DAI.bind(Address.fromString(DAI_ADDRESS));
  protocol.mintedTokens = [DAI_ADDRESS];
  protocol.mintedTokenSupplies = [daiContract.totalSupply()];

  protocol.save();
}

export function updateMarket(
  event: ethereum.Event,
  market: Market,
  deltaCollateral: BigInt = BIGINT_ZERO,
  deltaCollateralUSD: BigDecimal = BIGDECIMAL_ZERO,
  deltaDebtUSD: BigDecimal = BIGDECIMAL_ZERO,
  liquidateUSD: BigDecimal = BIGDECIMAL_ZERO,
  newTotalRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
  newSupplySideRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
): void {
  let token = getOrCreateToken(market.inputToken);

  if (deltaCollateral != BIGINT_ZERO) {
    // deltaCollateral can be positive or negative
    market.inputTokenBalance = market.inputTokenBalance.plus(deltaCollateral);

    if (deltaCollateral.gt(BIGINT_ZERO)) {
      market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(deltaCollateralUSD);
    } else if (deltaCollateral.lt(BIGINT_ZERO)) {
      // ignore as we don't care about cumulativeWithdraw in a market
    }
  }

  if (token.lastPriceUSD) {
    market.inputTokenPriceUSD = token.lastPriceUSD!;
    // here we "mark-to-market" - re-price total collateral using last price
    market.totalDepositBalanceUSD = bigIntToBDUseDecimals(market.inputTokenBalance, token.decimals).times(
      market.inputTokenPriceUSD,
    );
  } else if (deltaCollateralUSD != BIGDECIMAL_ZERO) {
    market.totalDepositBalanceUSD = market.totalDepositBalanceUSD.plus(deltaCollateralUSD);
  }

  market.totalValueLockedUSD = market.totalDepositBalanceUSD;

  if (deltaDebtUSD != BIGDECIMAL_ZERO) {
    market.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD.plus(deltaDebtUSD);
    if (deltaDebtUSD.gt(BIGDECIMAL_ZERO)) {
      market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(deltaDebtUSD);
    } else if (deltaDebtUSD.lt(BIGDECIMAL_ZERO)) {
      // again ignore repay
    }
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

  snapshotMarket(
    event,
    market,
    deltaCollateralUSD,
    deltaDebtUSD,
    liquidateUSD,
    newTotalRevenueUSD,
    newSupplySideRevenueUSD,
  );
}

export function snapshotMarket(
  event: ethereum.Event,
  market: Market,
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
    log.error("[snapshotMarket]Failed to get marketsnapshot for {}", [marketID]);
    return;
  }
  let hours = (event.block.timestamp.toI32() / SECONDS_PER_HOUR).toString();
  let hourlySnapshotRates = getSnapshotRates(market.rates, hours);

  let days = (event.block.timestamp.toI32() / SECONDS_PER_DAY).toString();
  let dailySnapshotRates = getSnapshotRates(market.rates, days);

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
  marketHourlySnapshot.rates = hourlySnapshotRates;
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
  marketDailySnapshot.rates = dailySnapshotRates;
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
  protocolSideRevenueType: u32 = 0,
): void {
  let protocol = getOrCreateLendingProtocol();
  let financials = getOrCreateFinancials(event);

  financials.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financials.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
  financials.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
  financials.mintedTokenSupplies = protocol.mintedTokenSupplies;

  financials.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
  financials.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
  financials._cumulativeProtocolSideStabilityFeeRevenue = protocol._cumulativeProtocolSideStabilityFeeRevenue;
  financials._cumulativeProtocolSideLiquidationRevenue = protocol._cumulativeProtocolSideLiquidationRevenue;
  financials._cumulativeProtocolSidePSMRevenue = protocol._cumulativeProtocolSidePSMRevenue;
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

  let newProtocolSideRevenueUSD = newTotalRevenueUSD.minus(newSupplySideRevenueUSD);
  if (newProtocolSideRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    financials.dailyProtocolSideRevenueUSD = financials.dailyTotalRevenueUSD.minus(
      financials.dailySupplySideRevenueUSD,
    );
    switch (protocolSideRevenueType) {
      case ProtocolSideRevenueType.STABILITYFEE:
        financials._dailyProtocolSideStabilityFeeRevenue = financials._dailyProtocolSideStabilityFeeRevenue!.plus(
          newProtocolSideRevenueUSD,
        );
        break;
      case ProtocolSideRevenueType.LIQUIDATION:
        financials._dailyProtocolSideLiquidationRevenue = financials._dailyProtocolSideLiquidationRevenue!.plus(
          newProtocolSideRevenueUSD,
        );
        break;
      case ProtocolSideRevenueType.PSM:
        financials._dailyProtocolSidePSMRevenue = financials._dailyProtocolSidePSMRevenue!.plus(
          newProtocolSideRevenueUSD,
        );
        break;
    }
  }

  financials.blockNumber = event.block.number;
  financials.timestamp = event.block.timestamp;
  financials.save();
}

// updatePosition based on deposit/withdraw/borrow/repay
// Need to be called after createTransactions
export function updatePosition(
  event: ethereum.Event,
  accountAddress: string,
  marketID: string,
  urn: string,
  ilk: Bytes,
  deltaCollateral: BigInt = BIGINT_ZERO,
  deltaDebt: BigInt = BIGINT_ZERO,
): void {
  let lenderPositionPrefix = `${accountAddress}-${marketID}-${PositionSide.LENDER}`;
  let borrowerPositionPrefix = `${accountAddress}-${marketID}-${PositionSide.BORROWER}`;
  let lenderCounter = getOrCreatePositionCounter(accountAddress, marketID, PositionSide.LENDER);
  let borrowerCounter = getOrCreatePositionCounter(accountAddress, marketID, PositionSide.BORROWER);
  let lenderPositionID = `${lenderPositionPrefix}-${lenderCounter.nextCount}`;
  let borrowerPositionID = `${borrowerPositionPrefix}-${borrowerCounter.nextCount}`;
  let lenderPosition: Position | null = null;
  let borrowerPosition: Position | null = null;

  let internalPositionID = `${urn}-${ilk.toHexString()}`;
  let internalPosition = _InternalPosition.load(internalPositionID);
  if (internalPosition == null) {
    internalPosition = new _InternalPosition(internalPositionID);
    internalPosition.accountAddress = accountAddress;
    internalPosition.marketAddress = marketID;
    internalPosition.borrowerPositions = [];
    internalPosition.lenderPositions = [];
    internalPosition.save();
  }

  let protocol = getOrCreateLendingProtocol();
  let market = getOrCreateMarket(marketID);
  let account = getOrCreateAccount(accountAddress);

  let eventID = createEventID(event);

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
      let _positionIDList = account._positionIDList!;
      _positionIDList.push(lenderPosition.id);
      account._positionIDList = _positionIDList;

      let lenderPositions = internalPosition.lenderPositions;
      lenderPositions.push(lenderPosition.id);
      internalPosition.lenderPositions = lenderPositions;
    }

    lenderPosition.depositCount += INT_ONE;
    // adds to existing deposit
    lenderPosition.balance = lenderPosition.balance.plus(deltaCollateral);
    lenderPosition.save();

    // link event to position (createTransactions needs to be called first)
    let deposit = Deposit.load(eventID)!;
    deposit.position = lenderPosition.id;
    deposit.save();
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

      // link event to position (createTransactions needs to be called first)
      let withdraw = Withdraw.load(eventID)!;
      withdraw.position = lenderPosition.id;
      withdraw.save();
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
      let _positionIDList = account._positionIDList!;
      _positionIDList.push(borrowerPosition.id);
      account._positionIDList = _positionIDList;

      let borrowerPositions = internalPosition.borrowerPositions;
      borrowerPositions.push(borrowerPosition.id);
      internalPosition.borrowerPositions = borrowerPositions;
    }
    borrowerPosition.borrowCount += INT_ONE;
    borrowerPosition.balance = borrowerPosition.balance.plus(deltaDebt);
    borrowerPosition.save();
    // link event to position (createTransactions needs to be called first)
    let borrow = Borrow.load(eventID)!;
    borrow.position = borrowerPosition.id;
    borrow.save();
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
      // link event to position (createTransactions needs to be called first)
      let repay = Repay.load(eventID)!;
      repay.position = borrowerPosition.id;
      repay.save();
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

// handle transfer of position from one user account (src) to another (dst),
// possibly to another urn address
export function transferPosition(
  event: ethereum.Event,
  ilk: Bytes,
  srcAccountAddress: string,
  dstAccountAddress: string,
  srcUrnAddress: string | null = null,
  dstUrnAddress: string | null = null,
): void {
  let protocol = getOrCreateLendingProtocol();
  let market: Market = getMarketFromIlk(ilk)!;
  let srcAccount = getOrCreateAccount(srcAccountAddress);
  let dstAccount = getOrCreateAccount(dstAccountAddress);

  let lenderPositions: string[] = [];
  let borrowerPositions: string[] = [];
  if (srcUrnAddress != null) {
    let internalPositionID = `${srcUrnAddress!}-${ilk.toHexString()}`;
    let internalPosition = _InternalPosition.load(internalPositionID);
    if (internalPosition == null) {
      internalPosition = new _InternalPosition(internalPositionID);
      internalPosition.accountAddress = srcAccountAddress;
      internalPosition.marketAddress = market.id;
      internalPosition.borrowerPositions = getPositionIDForAccount(srcAccountAddress, market.id, PositionSide.LENDER);
      internalPosition.lenderPositions = getPositionIDForAccount(srcAccountAddress, market.id, PositionSide.BORROWER);
      internalPosition.save();
    }

    lenderPositions = internalPosition.lenderPositions;
    borrowerPositions = internalPosition.borrowerPositions;
  } else {
    lenderPositions = getPositionIDForAccount(srcAccountAddress, market.id, PositionSide.LENDER, 1);
    borrowerPositions = getPositionIDForAccount(srcAccountAddress, market.id, PositionSide.BORROWER, 1);
  }

  // close any open lender positions linked with src account
  let openLenderBalance = BIGINT_ZERO;
  for (let i: i32 = 0; i < lenderPositions.length; i++) {
    let lenderPositionID = lenderPositions[i];
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

  // close any open borrower positions linked with src account
  let openBorrowerBalance = BIGINT_ZERO;
  for (let i: i32 = 0; i < borrowerPositions.length; i++) {
    let borrowerPositionID = borrowerPositions[i];
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

  let newLenderPositions: string[] = [];
  let newBorrowerPositions: string[] = [];
  //open dst positions
  if (openLenderBalance.gt(BIGINT_ZERO)) {
    // force to open a new position even if there are open positions
    let lenderPosition = getOrCreatePosition(event, PositionSide.LENDER, market.id, dstAccountAddress, true);
    lenderPosition.balance = openLenderBalance;
    lenderPosition.save();
    newLenderPositions = [lenderPosition.id];

    // update protocol, market, account openPositionCount
    protocol.openPositionCount += INT_ONE;
    protocol.cumulativePositionCount += INT_ONE;

    market.positionCount += INT_ONE;
    market.openPositionCount += INT_ONE;
    market.lendingPositionCount += INT_ONE;

    dstAccount.positionCount += INT_ONE;
    dstAccount.openPositionCount += INT_ONE;
    let _positionIDList = dstAccount._positionIDList!;
    _positionIDList.push(lenderPosition.id);
    dstAccount._positionIDList = _positionIDList;

    snapshotPosition(event, lenderPosition);
  }

  if (openBorrowerBalance.gt(BIGINT_ZERO)) {
    // force to open a new position even if there are open positions
    let borrowerPosition = getOrCreatePosition(event, PositionSide.BORROWER, market.id, dstAccountAddress, true);
    borrowerPosition.balance = openBorrowerBalance;
    borrowerPosition.save();
    newBorrowerPositions = [borrowerPosition.id];

    // update protocol, market, account openPositionCount
    protocol.openPositionCount += INT_ONE;
    protocol.cumulativePositionCount += INT_ONE;

    market.positionCount += INT_ONE;
    market.openPositionCount += INT_ONE;
    market.borrowingPositionCount += INT_ONE;

    dstAccount.positionCount += INT_ONE;
    dstAccount.openPositionCount += INT_ONE;
    let _positionIDList = dstAccount._positionIDList!;
    _positionIDList.push(borrowerPosition.id);
    dstAccount._positionIDList = _positionIDList;

    snapshotPosition(event, borrowerPosition);
  }

  if (dstUrnAddress == null) {
    let internalPositionID = `${srcUrnAddress!}-${ilk.toHexString()}`;
    let internalPosition: _InternalPosition = _InternalPosition.load(internalPositionID)!;
    // reset internalPosition using new owner address (dst)
    internalPosition.accountAddress = dstAccountAddress;
    internalPosition.lenderPositions = newLenderPositions;
    internalPosition.borrowerPositions = newBorrowerPositions;
    internalPosition.save();
  } else if (srcUrnAddress != null && srcUrnAddress!.toLowerCase() != dstUrnAddress!.toLowerCase()) {
    // update the internal position because the urn address is also different
    let dstInternalPositionID = `${dstUrnAddress!}-${ilk.toHexString()}`;
    let dstInteralPosition = _InternalPosition.load(dstInternalPositionID);
    if (dstInteralPosition == null) {
      dstInteralPosition = new _InternalPosition(dstInternalPositionID);
      dstInteralPosition.accountAddress = dstAccountAddress;
      dstInteralPosition.lenderPositions = newLenderPositions;
      dstInteralPosition.borrowerPositions = newBorrowerPositions;
    } else {
      dstInteralPosition.lenderPositions = newLenderPositions.concat(dstInteralPosition.lenderPositions);
      dstInteralPosition.borrowerPositions = newBorrowerPositions.concat(dstInteralPosition.borrowerPositions);
    }
    dstInteralPosition.save();
  }

  protocol.save();
  market.save();
  srcAccount.save();
  dstAccount.save();
}

// handle liquidations for Position entity
export function liquidatePosition(
  event: ethereum.Event,
  ilk: Bytes,
  urn: string,
  collateral: BigInt,
  debt: BigInt,
): void {
  let protocol = getOrCreateLendingProtocol();
  let market: Market = getMarketFromIlk(ilk)!;
  let accountAddress = getOwnerAddressFromUrn(urn);
  let account = getOrCreateAccount(accountAddress);

  // We are not adding EventType Prefix to Liquidate event
  // because it won't collide with other events
  let liquidate = Liquidate.load(createEventID(event))!;
  //TODO liquidation.positions list

  let lenderPositionCounter = getOrCreatePositionCounter(accountAddress, market.id, PositionSide.LENDER);
  let borrowerPositionCounter = getOrCreatePositionCounter(accountAddress, market.id, PositionSide.BORROWER);

  let internalPositionID = `${urn}-${ilk.toHexString()}`;
  let internalPosition: _InternalPosition = _InternalPosition.load(internalPositionID)!;
  let borrowerPositions = internalPosition.borrowerPositions;
  let lenderPositions = internalPosition.lenderPositions;
  let debtToRepay = debt;
  let collateralToLiquidate = collateral;
  for (let i = 0; i < borrowerPositions.length; i++) {
    let position: Position = Position.load(borrowerPositions[i])!;
    if (debtToRepay.gt(BIGINT_ZERO) && position.balance.gt(BIGINT_ZERO)) {
      if (position.balance.gt(debtToRepay)) {
        // partial liquidation, unlikely for borrower side
        position.balance = position.balance.minus(debtToRepay);
      } else {
        // full liquidation, close the position
        position.balance = BIGINT_ZERO;
        position.blockNumberClosed = event.block.number;
        position.timestampClosed = event.block.timestamp;
        position.hashClosed = event.transaction.hash.toHexString();

        borrowerPositionCounter.nextCount += INT_ONE;
        debtToRepay = debtToRepay.minus(position.balance);

        protocol.openPositionCount -= INT_ONE;
        market.openPositionCount -= INT_ONE;
        market.closedPositionCount += INT_ONE;
        account.openPositionCount -= INT_ONE;
        account.closedPositionCount += INT_ONE;

        //liquidate.position = position.id;
      }
      position.save();
      snapshotPosition(event, position);
    }
  }

  for (let i = 0; i < lenderPositions.length; i++) {
    let position: Position = Position.load(lenderPositions[i])!;
    if (collateralToLiquidate.gt(BIGINT_ZERO) && position.balance.gt(BIGINT_ZERO)) {
      if (position.balance.gt(collateralToLiquidate)) {
        // partial liquidation
        position.balance = position.balance.minus(collateralToLiquidate);
      } else {
        // full liquidation, close the position
        position.balance = BIGINT_ZERO;
        position.blockNumberClosed = event.block.number;
        position.timestampClosed = event.block.timestamp;
        position.hashClosed = event.transaction.hash.toHexString();

        lenderPositionCounter.nextCount += INT_ONE;
        collateralToLiquidate = collateralToLiquidate.minus(position.balance);

        protocol.openPositionCount -= INT_ONE;
        market.openPositionCount -= INT_ONE;
        market.closedPositionCount += INT_ONE;
        account.openPositionCount -= INT_ONE;
        account.closedPositionCount += INT_ONE;

        liquidate.position = position.id;
      }

      position.save();
      snapshotPosition(event, position);
    }
  }
  borrowerPositionCounter.save();
  lenderPositionCounter.save();
  liquidate.save();

  protocol.save();
  market.save();
  account.save();
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
      let account = getOrCreateAccount(accountID);
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
        liquidatorAccount = getOrCreateAccount(liquidator);
        protocol.cumulativeUniqueLiquidators += 1;
        usageDailySnapshot.cumulativeUniqueLiquidators += 1;
      } else if (liquidatorAccount.liquidateCount == 0) {
        protocol.cumulativeUniqueLiquidators += 1;
        usageDailySnapshot.cumulativeUniqueLiquidators += 1;
      }

      liquidatorAccount.liquidateCount += INT_ONE;
      liquidatorAccount.save();

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
        liquidateeAccount = getOrCreateAccount(liquidatee);
        protocol.cumulativeUniqueLiquidatees += 1;
        usageDailySnapshot.cumulativeUniqueLiquidatees += 1;
      } else if (liquidateeAccount.liquidationCount == 0) {
        protocol.cumulativeUniqueLiquidatees += 1;
        usageDailySnapshot.cumulativeUniqueLiquidatees += 1;
      }

      liquidateeAccount.liquidationCount += INT_ONE;
      liquidateeAccount.save();

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

export function createTransactions(
  event: ethereum.Event,
  market: Market,
  lender: string | null,
  borrower: string | null,
  deltaCollateral: BigInt = BIGINT_ZERO,
  deltaCollateralUSD: BigDecimal = BIGDECIMAL_ZERO,
  deltaDebt: BigInt = BIGINT_ZERO,
  deltaDebtUSD: BigDecimal = BIGDECIMAL_ZERO,
  //liquidateAmt: BigInt = BIGINT_ZERO,
  //liquidateUSD: BigDecimal = BIGDECIMAL_ZERO,
): void {
  let protocol = getOrCreateLendingProtocol();
  let transactionID = createEventID(event);

  if (deltaCollateral.gt(BIGINT_ZERO)) {
    // deposit
    let deposit = new Deposit(transactionID);
    deposit.hash = event.transaction.hash.toHexString();
    deposit.logIndex = event.logIndex.toI32();
    deposit.nonce = event.transaction.nonce;
    deposit.account = lender!;
    deposit.blockNumber = event.block.number;
    deposit.timestamp = event.block.timestamp;
    deposit.market = market.id;
    deposit.asset = market.inputToken;
    deposit.amount = deltaCollateral;
    deposit.amountUSD = deltaCollateralUSD;
    deposit.position = "";
    deposit.save();
  } else if (deltaCollateral.lt(BIGINT_ZERO)) {
    //withdraw
    let withdraw = new Withdraw(transactionID);
    withdraw.hash = event.transaction.hash.toHexString();
    withdraw.logIndex = event.logIndex.toI32();
    withdraw.nonce = event.transaction.nonce;
    withdraw.account = lender!;
    withdraw.blockNumber = event.block.number;
    withdraw.timestamp = event.block.timestamp;
    withdraw.market = market.id;
    withdraw.asset = market.inputToken;
    withdraw.amount = deltaCollateral.times(BIGINT_NEG_ONE);
    withdraw.amountUSD = deltaCollateralUSD.times(BIGDECIMAL_NEG_ONE);
    withdraw.position = "";
    withdraw.save();
  }

  if (deltaDebt.gt(BIGINT_ZERO)) {
    // borrow
    let borrow = new Borrow(transactionID);
    borrow.hash = event.transaction.hash.toHexString();
    borrow.logIndex = event.logIndex.toI32();
    borrow.nonce = event.transaction.nonce;
    borrow.account = borrower!;
    borrow.blockNumber = event.block.number;
    borrow.timestamp = event.block.timestamp;
    borrow.market = market.id;
    borrow.asset = market.inputToken;
    borrow.amount = deltaDebt;
    borrow.amountUSD = deltaDebtUSD;
    borrow.position = "";
    borrow.save();
  } else if (deltaDebt.lt(BIGINT_ZERO)) {
    // repay
    let repay = new Repay(transactionID);
    repay.hash = event.transaction.hash.toHexString();
    repay.logIndex = event.logIndex.toI32();
    repay.nonce = event.transaction.nonce;
    repay.account = borrower!;
    repay.blockNumber = event.block.number;
    repay.timestamp = event.block.timestamp;
    repay.market = market.id;
    repay.asset = market.inputToken;
    repay.amount = deltaDebt.times(BIGINT_NEG_ONE);
    repay.amountUSD = deltaDebtUSD.times(BIGDECIMAL_NEG_ONE);
    repay.position = "";
    repay.save();
  }

  // liquidate is handled by getOrCreateLiquidate() in getters
}

export function updatePriceForMarket(marketID: string, event: ethereum.Event): void {
  // Price is updated for market marketID
  let market = getOrCreateMarket(marketID);
  let token = Token.load(market.inputToken);
  market.inputTokenPriceUSD = token!.lastPriceUSD!;
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
  protocolSideRevenueType: u32 = 0,
): void {
  let market = getOrCreateMarket(marketID);
  if (market) {
    updateMarket(
      event,
      market,
      BIGINT_ZERO,
      BIGDECIMAL_ZERO,
      BIGDECIMAL_ZERO,
      BIGDECIMAL_ZERO,
      newTotalRevenueUSD,
      newSupplySideRevenueUSD,
    );
  }

  updateProtocol(
    BIGDECIMAL_ZERO,
    BIGDECIMAL_ZERO,
    BIGDECIMAL_ZERO,
    newTotalRevenueUSD,
    newSupplySideRevenueUSD,
    protocolSideRevenueType,
  );

  updateFinancialsSnapshot(
    event,
    BIGDECIMAL_ZERO,
    BIGDECIMAL_ZERO,
    BIGDECIMAL_ZERO,
    newTotalRevenueUSD,
    newSupplySideRevenueUSD,
    protocolSideRevenueType,
  );
}
