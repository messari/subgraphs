import {
  ethereum,
  BigDecimal,
  BigInt,
  log,
  Address,
  Bytes,
} from "@graphprotocol/graph-ts";
import {
  Market,
  Account,
  ActiveAccount,
  Deposit,
  Withdraw,
  Borrow,
  Repay,
  Token,
  Position,
  PositionSnapshot,
} from "../../generated/schema";
import {
  getOrCreateMarketHourlySnapshot,
  getOrCreateMarketDailySnapshot,
  getOrCreateFinancials,
  getOrCreateLendingProtocol,
  getOrCreateUsageMetricsHourlySnapshot,
  getOrCreateUsageMetricsDailySnapshot,
  getSnapshotRates,
  getOrCreateAccount,
  getOrCreateMarket,
  getOrCreatePosition,
  getMarketAddressFromIlk,
  getMarketFromIlk,
  getOpenPosition,
  getOwnerAddress,
} from "./getters";
import {
  BIGDECIMAL_ZERO,
  SECONDS_PER_HOUR,
  SECONDS_PER_DAY,
  BIGINT_ZERO,
  BIGINT_NEG_ONE,
  BIGDECIMAL_NEG_ONE,
  DAI_ADDRESS,
  ProtocolSideRevenueType,
  INT_ONE,
  PositionSide,
  BIGINT_NEG_HUNDRED,
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
  protocolSideRevenueType: u32 = 0
): void {
  const protocol = getOrCreateLendingProtocol();

  // update Deposit
  if (deltaCollateralUSD.gt(BIGDECIMAL_ZERO)) {
    protocol.cumulativeDepositUSD =
      protocol.cumulativeDepositUSD.plus(deltaCollateralUSD);
  }

  // protocol.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD.plus(deltaCollateralUSD);
  // instead, iterate over markets to get "mark-to-market" deposit balance
  let totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
  let totalDepositBalanceUSD = BIGDECIMAL_ZERO;
  for (let i: i32 = 0; i < protocol.marketIDList.length; i++) {
    const marketID = protocol.marketIDList[i];
    const market = Market.load(marketID);
    totalBorrowBalanceUSD = totalBorrowBalanceUSD.plus(
      market!.totalBorrowBalanceUSD
    );
    totalDepositBalanceUSD = totalDepositBalanceUSD.plus(
      market!.totalDepositBalanceUSD
    );
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
    protocol.cumulativeBorrowUSD =
      protocol.cumulativeBorrowUSD.plus(deltaDebtUSD);
  }

  if (liquidateUSD.gt(BIGDECIMAL_ZERO)) {
    protocol.cumulativeLiquidateUSD =
      protocol.cumulativeLiquidateUSD.plus(liquidateUSD);
  }

  if (newTotalRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    protocol.cumulativeTotalRevenueUSD =
      protocol.cumulativeTotalRevenueUSD.plus(newTotalRevenueUSD);
  }

  if (newSupplySideRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    protocol.cumulativeSupplySideRevenueUSD =
      protocol.cumulativeSupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
  }

  const newProtocolSideRevenueUSD = newTotalRevenueUSD.minus(
    newSupplySideRevenueUSD
  );
  if (newProtocolSideRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    protocol.cumulativeProtocolSideRevenueUSD =
      protocol.cumulativeTotalRevenueUSD.minus(
        protocol.cumulativeSupplySideRevenueUSD
      );
    switch (protocolSideRevenueType) {
      case ProtocolSideRevenueType.STABILITYFEE:
        protocol._cumulativeProtocolSideStabilityFeeRevenue =
          protocol._cumulativeProtocolSideStabilityFeeRevenue!.plus(
            newProtocolSideRevenueUSD
          );
        break;
      case ProtocolSideRevenueType.LIQUIDATION:
        protocol._cumulativeProtocolSideLiquidationRevenue =
          protocol._cumulativeProtocolSideLiquidationRevenue!.plus(
            newProtocolSideRevenueUSD
          );
        break;
      case ProtocolSideRevenueType.PSM:
        protocol._cumulativeProtocolSidePSMRevenue =
          protocol._cumulativeProtocolSidePSMRevenue!.plus(
            newProtocolSideRevenueUSD
          );
        break;
    }
  }

  // update mintedTokenSupplies
  const daiContract = DAI.bind(Address.fromString(DAI_ADDRESS));
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
  newSupplySideRevenueUSD: BigDecimal = BIGDECIMAL_ZERO
): void {
  const token = getOrCreateToken(market.inputToken);

  if (deltaCollateral != BIGINT_ZERO) {
    // deltaCollateral can be positive or negative
    market.inputTokenBalance = market.inputTokenBalance.plus(deltaCollateral);

    if (deltaCollateral.gt(BIGINT_ZERO)) {
      market.cumulativeDepositUSD =
        market.cumulativeDepositUSD.plus(deltaCollateralUSD);
    } else if (deltaCollateral.lt(BIGINT_ZERO)) {
      // ignore as we don't care about cumulativeWithdraw in a market
    }
  }

  if (token.lastPriceUSD) {
    market.inputTokenPriceUSD = token.lastPriceUSD!;
    // here we "mark-to-market" - re-price total collateral using last price
    market.totalDepositBalanceUSD = bigIntToBDUseDecimals(
      market.inputTokenBalance,
      token.decimals
    ).times(market.inputTokenPriceUSD);
  } else if (deltaCollateralUSD != BIGDECIMAL_ZERO) {
    market.totalDepositBalanceUSD =
      market.totalDepositBalanceUSD.plus(deltaCollateralUSD);
  }

  market.totalValueLockedUSD = market.totalDepositBalanceUSD;

  if (deltaDebtUSD != BIGDECIMAL_ZERO) {
    market.totalBorrowBalanceUSD =
      market.totalBorrowBalanceUSD.plus(deltaDebtUSD);
    if (deltaDebtUSD.gt(BIGDECIMAL_ZERO)) {
      market.cumulativeBorrowUSD =
        market.cumulativeBorrowUSD.plus(deltaDebtUSD);
    } else if (deltaDebtUSD.lt(BIGDECIMAL_ZERO)) {
      // again ignore repay
    }
  }

  if (liquidateUSD.gt(BIGDECIMAL_ZERO)) {
    market.cumulativeLiquidateUSD =
      market.cumulativeLiquidateUSD.plus(liquidateUSD);
  }

  // update revenue
  if (newTotalRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    market.cumulativeTotalRevenueUSD =
      market.cumulativeTotalRevenueUSD.plus(newTotalRevenueUSD);
  }

  if (newSupplySideRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    market.cumulativeSupplySideRevenueUSD =
      market.cumulativeSupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
  }

  if (
    newTotalRevenueUSD.gt(BIGDECIMAL_ZERO) ||
    newSupplySideRevenueUSD.gt(BIGDECIMAL_ZERO)
  ) {
    market.cumulativeProtocolSideRevenueUSD =
      market.cumulativeTotalRevenueUSD.minus(
        market.cumulativeSupplySideRevenueUSD
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
    newSupplySideRevenueUSD
  );
}

export function snapshotMarket(
  event: ethereum.Event,
  market: Market,
  deltaCollateralUSD: BigDecimal = BIGDECIMAL_ZERO,
  deltaDebtUSD: BigDecimal = BIGDECIMAL_ZERO,
  liquidateUSD: BigDecimal = BIGDECIMAL_ZERO,
  newTotalRevenueUSD: BigDecimal = BIGDECIMAL_ZERO,
  newSupplySideRevenueUSD: BigDecimal = BIGDECIMAL_ZERO
): void {
  const marketID = market.id;
  const marketHourlySnapshot = getOrCreateMarketHourlySnapshot(event, marketID);
  const marketDailySnapshot = getOrCreateMarketDailySnapshot(event, marketID);
  if (marketHourlySnapshot == null || marketDailySnapshot == null) {
    log.error("[snapshotMarket]Failed to get marketsnapshot for {}", [
      marketID,
    ]);
    return;
  }
  const hours = (event.block.timestamp.toI32() / SECONDS_PER_HOUR).toString();
  const hourlySnapshotRates = getSnapshotRates(market.rates, hours);

  const days = (event.block.timestamp.toI32() / SECONDS_PER_DAY).toString();
  const dailySnapshotRates = getSnapshotRates(market.rates, days);

  marketHourlySnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  marketHourlySnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  marketHourlySnapshot.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD;
  marketHourlySnapshot.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD;
  marketHourlySnapshot.cumulativeTotalRevenueUSD =
    market.cumulativeTotalRevenueUSD;
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
  marketDailySnapshot.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD;
  marketDailySnapshot.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD;
  marketDailySnapshot.cumulativeTotalRevenueUSD =
    market.cumulativeTotalRevenueUSD;
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
    marketHourlySnapshot.hourlyDepositUSD =
      marketHourlySnapshot.hourlyDepositUSD.plus(deltaCollateralUSD);
    marketDailySnapshot.dailyDepositUSD =
      marketDailySnapshot.dailyDepositUSD.plus(deltaCollateralUSD);
  } else if (deltaCollateralUSD.lt(BIGDECIMAL_ZERO)) {
    // minus a negative number
    marketHourlySnapshot.hourlyWithdrawUSD =
      marketHourlySnapshot.hourlyWithdrawUSD.minus(deltaCollateralUSD);
    marketDailySnapshot.dailyWithdrawUSD =
      marketDailySnapshot.dailyWithdrawUSD.minus(deltaCollateralUSD);
  }

  if (deltaDebtUSD.gt(BIGDECIMAL_ZERO)) {
    marketHourlySnapshot.hourlyBorrowUSD =
      marketHourlySnapshot.hourlyBorrowUSD.plus(deltaDebtUSD);
    marketDailySnapshot.dailyBorrowUSD =
      marketDailySnapshot.dailyBorrowUSD.plus(deltaDebtUSD);
  } else if (deltaDebtUSD.lt(BIGDECIMAL_ZERO)) {
    // minus a negative number
    marketHourlySnapshot.hourlyRepayUSD =
      marketHourlySnapshot.hourlyRepayUSD.minus(deltaDebtUSD);
    marketDailySnapshot.dailyRepayUSD =
      marketDailySnapshot.dailyRepayUSD.minus(deltaDebtUSD);
  }

  if (liquidateUSD.gt(BIGDECIMAL_ZERO)) {
    marketHourlySnapshot.hourlyLiquidateUSD =
      marketHourlySnapshot.hourlyLiquidateUSD.plus(liquidateUSD);
    marketDailySnapshot.dailyLiquidateUSD =
      marketDailySnapshot.dailyLiquidateUSD.plus(liquidateUSD);
  }

  // update revenue
  if (newTotalRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    marketHourlySnapshot.hourlyTotalRevenueUSD =
      marketHourlySnapshot.hourlyTotalRevenueUSD.plus(newTotalRevenueUSD);
    marketDailySnapshot.dailyTotalRevenueUSD =
      marketDailySnapshot.dailyTotalRevenueUSD.plus(newTotalRevenueUSD);
  }

  if (newSupplySideRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    marketHourlySnapshot.hourlySupplySideRevenueUSD =
      marketHourlySnapshot.hourlySupplySideRevenueUSD.plus(
        newSupplySideRevenueUSD
      );
    marketDailySnapshot.dailySupplySideRevenueUSD =
      marketDailySnapshot.dailySupplySideRevenueUSD.plus(
        newSupplySideRevenueUSD
      );
  }

  if (
    newTotalRevenueUSD.gt(BIGDECIMAL_ZERO) ||
    newSupplySideRevenueUSD.gt(BIGDECIMAL_ZERO)
  ) {
    marketHourlySnapshot.hourlyProtocolSideRevenueUSD =
      marketHourlySnapshot.hourlyTotalRevenueUSD.minus(
        marketHourlySnapshot.hourlySupplySideRevenueUSD
      );
    marketDailySnapshot.dailyProtocolSideRevenueUSD =
      marketDailySnapshot.dailyTotalRevenueUSD.minus(
        marketDailySnapshot.dailySupplySideRevenueUSD
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
  protocolSideRevenueType: u32 = 0
): void {
  const protocol = getOrCreateLendingProtocol();
  const financials = getOrCreateFinancials(event);

  financials.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financials.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
  financials.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
  financials.mintedTokenSupplies = protocol.mintedTokenSupplies;

  financials.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financials.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financials._cumulativeProtocolSideStabilityFeeRevenue =
    protocol._cumulativeProtocolSideStabilityFeeRevenue;
  financials._cumulativeProtocolSideLiquidationRevenue =
    protocol._cumulativeProtocolSideLiquidationRevenue;
  financials._cumulativeProtocolSidePSMRevenue =
    protocol._cumulativeProtocolSidePSMRevenue;
  financials.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  financials.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
  financials.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
  financials.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;

  if (deltaCollateralUSD.gt(BIGDECIMAL_ZERO)) {
    financials.dailyDepositUSD =
      financials.dailyDepositUSD.plus(deltaCollateralUSD);
  } else if (deltaCollateralUSD.lt(BIGDECIMAL_ZERO)) {
    // minus a negative number
    financials.dailyWithdrawUSD =
      financials.dailyWithdrawUSD.minus(deltaCollateralUSD);
  }

  if (deltaDebtUSD.gt(BIGDECIMAL_ZERO)) {
    financials.dailyBorrowUSD = financials.dailyBorrowUSD.plus(deltaDebtUSD);
  } else if (deltaDebtUSD.lt(BIGDECIMAL_ZERO)) {
    // minus a negative number
    financials.dailyRepayUSD = financials.dailyRepayUSD.minus(deltaDebtUSD);
  }

  if (liquidateUSD.gt(BIGDECIMAL_ZERO)) {
    financials.dailyLiquidateUSD =
      financials.dailyLiquidateUSD.plus(liquidateUSD);
  }

  if (newTotalRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    financials.dailyTotalRevenueUSD =
      financials.dailyTotalRevenueUSD.plus(newTotalRevenueUSD);
  }

  if (newSupplySideRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    financials.dailySupplySideRevenueUSD =
      financials.dailySupplySideRevenueUSD.plus(newSupplySideRevenueUSD);
  }

  const newProtocolSideRevenueUSD = newTotalRevenueUSD.minus(
    newSupplySideRevenueUSD
  );
  if (newProtocolSideRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    financials.dailyProtocolSideRevenueUSD =
      financials.dailyTotalRevenueUSD.minus(
        financials.dailySupplySideRevenueUSD
      );
    switch (protocolSideRevenueType) {
      case ProtocolSideRevenueType.STABILITYFEE:
        financials._dailyProtocolSideStabilityFeeRevenue =
          financials._dailyProtocolSideStabilityFeeRevenue!.plus(
            newProtocolSideRevenueUSD
          );
        break;
      case ProtocolSideRevenueType.LIQUIDATION:
        financials._dailyProtocolSideLiquidationRevenue =
          financials._dailyProtocolSideLiquidationRevenue!.plus(
            newProtocolSideRevenueUSD
          );
        break;
      case ProtocolSideRevenueType.PSM:
        financials._dailyProtocolSidePSMRevenue =
          financials._dailyProtocolSidePSMRevenue!.plus(
            newProtocolSideRevenueUSD
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
  urn: string,
  ilk: Bytes,
  deltaCollateral: BigInt = BIGINT_ZERO,
  deltaDebt: BigInt = BIGINT_ZERO
): void {
  const marketID = getMarketAddressFromIlk(ilk)!.toHexString();
  const accountAddress = getOwnerAddress(urn);
  const eventID = createEventID(event); // deposit, withdraw, borrow, repay, liquidate

  const protocol = getOrCreateLendingProtocol();
  const market = getOrCreateMarket(marketID);
  const account = getOrCreateAccount(accountAddress);

  if (deltaCollateral.notEqual(BIGINT_ZERO)) {
    let lenderPosition = getOpenPosition(urn, ilk, PositionSide.LENDER);

    if (lenderPosition == null) {
      // this is a new lender position, deltaCollateral > 0
      // because user cannot create a lender position with deltaCollateral <=0
      lenderPosition = getOrCreatePosition(
        event,
        urn,
        ilk,
        PositionSide.LENDER,
        true
      );

      if (deltaCollateral.le(BIGINT_ZERO)) {
        log.error(
          "[updatePosition]Creating a new lender position {} with deltaCollateral ={} <= 0 at tx {}-{}",
          [
            lenderPosition.id,
            deltaCollateral.toString(),
            event.transaction.hash.toHexString(),
            event.transactionLogIndex.toString(),
          ]
        );
        log.critical("", []);
      }

      protocol.openPositionCount += INT_ONE;
      protocol.cumulativePositionCount += INT_ONE;

      market.positionCount += INT_ONE;
      market.openPositionCount += INT_ONE;
      market.lendingPositionCount += INT_ONE;

      account.positionCount += INT_ONE;
      account.openPositionCount += INT_ONE;
      //account.depositCount += INT_ONE;
    }

    lenderPosition.balance = lenderPosition.balance.plus(deltaCollateral);
    // this may be less than 0 (but > -100) from rounding & for tokens with decimals < 18
    // because we keep position balance in native unit, but maker always keep them in WAD (18 decimals)
    //
    // for example 1. at block 12507581, urn 0x03453d22095c0edd61cd40c3ccdc394a0e85dc1a
    // repaid -203334964101176257798573 dai, when the borrow balance
    // was 203334964101176257798572
    // 2. at block 14055178, urn 0x1c47bb6773db2a441264c1af2c943d8bdfaf19fe
    // repaid -30077488379451392498995529 dai, when the borrow balance
    // was 30077488379451392498995503
    if (lenderPosition.balance.lt(BIGINT_ZERO)) {
      if (lenderPosition.balance.ge(BIGINT_NEG_HUNDRED)) {
        // a small negative lender position, likely due to rounding
        lenderPosition.balance = BIGINT_ZERO;
      } else {
        log.error(
          "[updatePosition]A negative lender balance of {} for position {} with tx {}-{}",
          [
            lenderPosition.balance.toString(),
            lenderPosition.id,
            event.transaction.hash.toHexString(),
            event.transactionLogIndex.toString(),
          ]
        );
        log.critical("", []);
      }
    }

    if (deltaCollateral.gt(BIGINT_ZERO)) {
      // deposit
      lenderPosition.depositCount += INT_ONE;

      // link event to position (createTransactions needs to be called first)
      const deposit = Deposit.load(eventID)!;
      deposit.position = lenderPosition.id;
      deposit.save();
    } else if (deltaCollateral.lt(BIGINT_ZERO)) {
      lenderPosition.withdrawCount += INT_ONE;

      if (lenderPosition.balance == BIGINT_ZERO) {
        // close lender position
        lenderPosition.blockNumberClosed = event.block.number;
        lenderPosition.timestampClosed = event.block.timestamp;
        lenderPosition.hashClosed = event.transaction.hash.toHexString();

        protocol.openPositionCount -= INT_ONE;

        market.openPositionCount -= INT_ONE;
        market.closedPositionCount += INT_ONE;

        account.openPositionCount -= INT_ONE;
        account.closedPositionCount += INT_ONE;
      }

      // link event to position (createTransactions needs to be called first)
      const withdraw = Withdraw.load(eventID)!;
      withdraw.position = lenderPosition.id;
      withdraw.save();
    }

    log.info("[updatePosition]position positionID={}, account={}, balance={}", [
      lenderPosition.id,
      lenderPosition.account,
      lenderPosition.balance.toString(),
    ]);

    lenderPosition.save();
    snapshotPosition(event, lenderPosition);
  }

  if (deltaDebt.notEqual(BIGINT_ZERO)) {
    let borrowerPosition = getOpenPosition(urn, ilk, PositionSide.BORROWER);
    if (borrowerPosition == null) {
      // new borrower position
      borrowerPosition = getOrCreatePosition(
        event,
        urn,
        ilk,
        PositionSide.BORROWER,
        true
      );

      if (deltaDebt.le(BIGINT_ZERO)) {
        log.error(
          "[updatePosition]Creating a new lender position {} with deltaDebt={} <= 0 at tx {}-{}",
          [
            borrowerPosition.id,
            deltaDebt.toString(),
            event.transaction.hash.toHexString(),
            event.transactionLogIndex.toString(),
          ]
        );
        log.critical("", []);
      }

      protocol.openPositionCount += INT_ONE;
      protocol.cumulativePositionCount += INT_ONE;

      market.positionCount += INT_ONE;
      market.openPositionCount += INT_ONE;
      market.borrowingPositionCount += INT_ONE;

      account.positionCount += INT_ONE;
      account.openPositionCount += INT_ONE;
    }

    borrowerPosition.balance = borrowerPosition.balance.plus(deltaDebt);
    // see comment above for lenderPosition.balance
    if (borrowerPosition.balance.lt(BIGINT_ZERO)) {
      if (borrowerPosition.balance.ge(BIGINT_NEG_HUNDRED)) {
        // a small negative lender position, likely due to rounding
        borrowerPosition.balance = BIGINT_ZERO;
      } else {
        log.error(
          "[updatePosition]A negative lender balance of {} for position {} with tx {}-{}",
          [
            borrowerPosition.balance.toString(),
            borrowerPosition.id,
            event.transaction.hash.toHexString(),
            event.transactionLogIndex.toString(),
          ]
        );
        log.critical("", []);
      }
      log.critical("", []);
    }

    if (deltaDebt.gt(BIGINT_ZERO)) {
      borrowerPosition.borrowCount += INT_ONE;
      //account.borrowCount += INT_ONE;

      // link event to position (createTransactions needs to be called first)
      const borrow = Borrow.load(eventID)!;
      borrow.position = borrowerPosition.id;
      borrow.save();
    } else if (deltaDebt.lt(BIGINT_ZERO)) {
      borrowerPosition.repayCount += INT_ONE;

      if (borrowerPosition.balance == BIGINT_ZERO) {
        // close borrowerPosition
        borrowerPosition.blockNumberClosed = event.block.number;
        borrowerPosition.timestampClosed = event.block.timestamp;
        borrowerPosition.hashClosed = event.transaction.hash.toHexString();

        protocol.openPositionCount -= INT_ONE;

        market.openPositionCount -= INT_ONE;
        market.closedPositionCount += INT_ONE;

        account.openPositionCount -= INT_ONE;
        account.closedPositionCount += INT_ONE;
        //account.repayCount += INT_ONE;
      }

      const repay = Repay.load(eventID)!;
      repay.position = borrowerPosition.id;
      repay.save();
    }

    log.info("[updatePosition]position positionID={}, account={}, balance={}", [
      borrowerPosition.id,
      borrowerPosition.account,
      borrowerPosition.balance.toString(),
    ]);
    borrowerPosition.save();
    snapshotPosition(event, borrowerPosition);
  }

  protocol.save();
  market.save();
  account.save();

  if (account.openPositionCount < 0) {
    log.error(
      "[updatePosition]urn {} for account {} openPositionCount={} at tx {}-{}",
      [
        urn,
        account.id,
        account.openPositionCount.toString(),
        event.transaction.hash.toHexString(),
        event.transactionLogIndex.toString(),
      ]
    );
    log.critical("", []);
  }
}

// handle transfer of position from one user account (src) to another (dst),
// possibly to another urn address
export function transferPosition(
  event: ethereum.Event,
  ilk: Bytes,
  srcUrn: string, // src urn
  dstUrn: string, // dst urn
  side: string,
  srcAccountAddress: string | null = null,
  dstAccountAddress: string | null = null,
  transferAmount: BigInt | null = null // suport partial transfer of a position
): void {
  if (srcUrn == dstUrn && srcAccountAddress == dstAccountAddress) {
    log.info(
      "[transferPosition]srcUrn {}==dstUrn {} && srcAccountAddress {}==dstAccountAddress {}, no transfer",
      [
        srcUrn,
        dstUrn,
        srcAccountAddress ? srcAccountAddress : "null",
        dstAccountAddress ? dstAccountAddress : "null",
      ]
    );
    return;
  }

  const protocol = getOrCreateLendingProtocol();
  const market: Market = getMarketFromIlk(ilk)!;
  const usageHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(event);
  const usageDailySnapshot = getOrCreateUsageMetricsDailySnapshot(event);

  if (srcAccountAddress == null) {
    srcAccountAddress = getOwnerAddress(srcUrn).toLowerCase();
  }
  const srcAccount = getOrCreateAccount(srcAccountAddress!);

  const srcPosition = getOpenPosition(srcUrn, ilk, side);
  if (srcPosition == null) {
    log.warning(
      "[transferPosition]No open position found for source: urn {}/ilk {}/side {}; no transfer",
      [srcUrn, ilk.toHexString(), side]
    );
    return;
  }

  const srcPositionBalance0 = srcPosition.balance;
  if (!transferAmount || transferAmount > srcPosition.balance) {
    const transferAmountStr = transferAmount
      ? transferAmount.toString()
      : "null";
    log.warning(
      "[transferPosition]transferAmount={} is null or > src position balance {} for {}",
      [transferAmountStr, srcPosition.balance.toString(), srcPosition.id]
    );
    transferAmount = srcPosition.balance;
  }
  assert(
    transferAmount <= srcPosition.balance,
    `[transferPosition]src ${srcUrn}/ilk ${ilk.toHexString()}/side ${side} transfer amount ${transferAmount.toString()} > balance ${
      srcPosition.balance
    }`
  );

  srcPosition.balance = srcPosition.balance.minus(transferAmount);
  if (srcPosition.balance == BIGINT_ZERO) {
    srcPosition.blockNumberClosed = event.block.number;
    srcPosition.timestampClosed = event.block.timestamp;
    srcPosition.hashClosed = event.transaction.hash.toHexString();
    protocol.openPositionCount -= INT_ONE;
    market.openPositionCount -= INT_ONE;
    market.closedPositionCount += INT_ONE;
    srcAccount.openPositionCount -= INT_ONE;
    srcAccount.closedPositionCount += INT_ONE;
  }
  srcPosition.save();
  snapshotPosition(event, srcPosition);

  if (dstAccountAddress == null) {
    dstAccountAddress = getOwnerAddress(dstUrn).toLowerCase();
  }

  let dstAccount = Account.load(dstAccountAddress!);
  if (dstAccount == null) {
    dstAccount = getOrCreateAccount(dstAccountAddress!);
    protocol.cumulativeUniqueUsers += 1;
    usageDailySnapshot.cumulativeUniqueUsers += 1;
    usageHourlySnapshot.cumulativeUniqueUsers += 1;
  }

  // transfer srcUrn to dstUrn
  // or partial transfer of a position (amount < position.balance)
  let dstPosition = getOpenPosition(dstUrn, ilk, side);
  if (!dstPosition) {
    dstPosition = getOrCreatePosition(event, dstUrn, ilk, side, true);
  }

  dstPosition.balance = dstPosition.balance.plus(transferAmount);
  dstPosition.save();
  snapshotPosition(event, dstPosition);

  protocol.openPositionCount += INT_ONE;
  protocol.cumulativePositionCount += INT_ONE;
  market.openPositionCount += INT_ONE;
  market.positionCount += INT_ONE;
  if (side == PositionSide.BORROWER) {
    market.borrowingPositionCount += INT_ONE;
  } else if (side == PositionSide.LENDER) {
    market.lendingPositionCount += INT_ONE;
  }
  dstAccount.openPositionCount += INT_ONE;
  dstAccount.positionCount += INT_ONE;

  log.info(
    "[transferPosition]transfer {} from {} (is_urn={},balance={}) to {} (is_urn={},balance={})",
    [
      transferAmount.toString(),
      srcPosition.id,
      srcPosition._is_urn.toString(),
      srcPositionBalance0.toString(),
      dstPosition.id,
      dstPosition._is_urn.toString(),
      dstPosition.balance.toString(),
    ]
  );

  protocol.save();
  market.save();
  usageDailySnapshot.save();
  usageHourlySnapshot.save();
  srcAccount.save();
  dstAccount.save();

  assert(
    srcAccount.openPositionCount >= 0,
    `Account ${srcAccount.id} openPositionCount=${srcAccount.openPositionCount}`
  );
  assert(
    dstAccount.openPositionCount >= 0,
    `Account ${dstAccount.id} openPositionCount=${dstAccount.openPositionCount}`
  );
}

// handle liquidations for Position entity
export function liquidatePosition(
  event: ethereum.Event,
  urn: string,
  ilk: Bytes,
  collateral: BigInt, // net collateral liquidated
  debt: BigInt // debt repaid
): string[] {
  const protocol = getOrCreateLendingProtocol();
  const market: Market = getMarketFromIlk(ilk)!;
  const accountAddress = getOwnerAddress(urn);
  const account = getOrCreateAccount(accountAddress);

  log.info("[liquidatePosition]urn={}, ilk={}, collateral={}, debt={}", [
    urn,
    ilk.toHexString(),
    collateral.toString(),
    debt.toString(),
  ]);
  const borrowerPosition = getOpenPosition(urn, ilk, PositionSide.BORROWER)!;
  const lenderPosition = getOpenPosition(urn, ilk, PositionSide.LENDER)!;
  if (debt > borrowerPosition.balance) {
    //this can happen because of rounding
    log.warning("[liquidatePosition]debt repaid {} > borrowing balance {}", [
      debt.toString(),
      borrowerPosition.balance.toString(),
    ]);
    debt = borrowerPosition.balance;
  }
  borrowerPosition.balance = borrowerPosition.balance.minus(debt);
  borrowerPosition.liquidationCount += INT_ONE;

  assert(
    borrowerPosition.balance.ge(BIGINT_ZERO),
    `[liquidatePosition]balance of position ${borrowerPosition.id} ${borrowerPosition.balance} < 0`
  );
  // liquidation closes the borrowing side position
  if (borrowerPosition.balance == BIGINT_ZERO) {
    borrowerPosition.blockNumberClosed = event.block.number;
    borrowerPosition.timestampClosed = event.block.timestamp;
    borrowerPosition.hashClosed = event.transaction.hash.toHexString();
    snapshotPosition(event, borrowerPosition);

    protocol.openPositionCount -= INT_ONE;
    market.openPositionCount -= INT_ONE;
    market.closedPositionCount += INT_ONE;
    market.borrowingPositionCount -= INT_ONE;
    account.openPositionCount -= INT_ONE;
    account.closedPositionCount += INT_ONE;
  }
  borrowerPosition.save();
  snapshotPosition(event, borrowerPosition);

  lenderPosition.balance = lenderPosition.balance.minus(collateral);
  lenderPosition.liquidationCount += INT_ONE;

  if (lenderPosition.balance == BIGINT_ZERO) {
    // lender side is closed
    lenderPosition.blockNumberClosed = event.block.number;
    lenderPosition.timestampClosed = event.block.timestamp;
    lenderPosition.hashClosed = event.transaction.hash.toHexString();

    protocol.openPositionCount -= INT_ONE;
    market.openPositionCount -= INT_ONE;
    market.closedPositionCount += INT_ONE;
    market.lendingPositionCount -= INT_ONE;
    account.openPositionCount -= INT_ONE;
    account.closedPositionCount += INT_ONE;
  }
  lenderPosition.save();
  snapshotPosition(event, lenderPosition);

  protocol.save();
  market.save();
  account.save();

  //assert(account.openPositionCount >= 0, `Account ${account.id} openPositionCount=${account.openPositionCount}`);
  return [lenderPosition.id, borrowerPosition.id];
}

export function snapshotPosition(
  event: ethereum.Event,
  position: Position
): void {
  const txHash: string = event.transaction.hash.toHexString();
  const snapshotID = `${position.id}-${txHash}-${event.logIndex.toString()}`;
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
    log.error(
      "[snapshotPosition]Position snapshot {} already exists for position {} at tx hash {}",
      [snapshotID, position.id, txHash]
    );
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
  liquidatee: string | null = null
): void {
  const protocol = getOrCreateLendingProtocol();
  const usageHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(event);
  const usageDailySnapshot = getOrCreateUsageMetricsDailySnapshot(event);

  const hours: string = (
    event.block.timestamp.toI64() / SECONDS_PER_HOUR
  ).toString();
  const days: string = (
    event.block.timestamp.toI64() / SECONDS_PER_DAY
  ).toString();

  // userU, userV, userW may be the same, they may not
  for (let i: i32 = 0; i < users.length; i++) {
    const accountID = users[i];
    let account = Account.load(accountID);
    if (account == null) {
      account = getOrCreateAccount(accountID);

      protocol.cumulativeUniqueUsers += 1;
      usageHourlySnapshot.cumulativeUniqueUsers += 1;
      usageDailySnapshot.cumulativeUniqueUsers += 1;
    }

    const hourlyActiveAcctountID = "hourly-"
      .concat(accountID)
      .concat("-")
      .concat(hours);
    let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAcctountID);
    if (hourlyActiveAccount == null) {
      hourlyActiveAccount = new ActiveAccount(hourlyActiveAcctountID);
      hourlyActiveAccount.save();

      usageHourlySnapshot.hourlyActiveUsers += 1;
    }

    const dailyActiveAcctountID = "daily-"
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
    const depositAccount = Account.load(users[1]); // user v
    if (depositAccount!.depositCount == 0) {
      // a new depositor
      protocol.cumulativeUniqueDepositors += 1;
      usageDailySnapshot.cumulativeUniqueDepositors += 1;
    }
    depositAccount!.depositCount += INT_ONE;
    depositAccount!.save();

    const dailyDepositorAcctountID = "daily-depositor-"
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

    const withdrawAccount = Account.load(users[1]);
    withdrawAccount!.withdrawCount += INT_ONE;
    withdrawAccount!.save();
  }

  if (deltaDebtUSD.gt(BIGDECIMAL_ZERO)) {
    usageHourlySnapshot.hourlyBorrowCount += 1;
    usageDailySnapshot.dailyBorrowCount += 1;

    const borrowAccount = Account.load(users[2]); // user w
    if (borrowAccount!.borrowCount == 0) {
      // a new borrower
      protocol.cumulativeUniqueBorrowers += 1;
      usageDailySnapshot.cumulativeUniqueBorrowers += 1;
    }
    borrowAccount!.borrowCount += INT_ONE;
    borrowAccount!.save();

    const dailyBorrowerAcctountID = "daily-borrow-"
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

    const repayAccount = Account.load(users[1]);
    repayAccount!.repayCount += INT_ONE;
    repayAccount!.save();
  }

  if (liquidateUSD.gt(BIGDECIMAL_ZERO)) {
    usageHourlySnapshot.hourlyLiquidateCount += 1;
    usageDailySnapshot.dailyLiquidateCount += 1;

    if (liquidator) {
      let liquidatorAccount = Account.load(liquidator);
      // a new liquidator
      if (liquidatorAccount == null || liquidatorAccount.liquidateCount == 0) {
        if (liquidatorAccount == null) {
          // liquidators will repay debt & withdraw collateral,
          // they are unique users if not yet in Account
          protocol.cumulativeUniqueUsers += 1;
          usageDailySnapshot.cumulativeUniqueUsers += 1;
          usageHourlySnapshot.cumulativeUniqueUsers += 1;
        }
        liquidatorAccount = getOrCreateAccount(liquidator);
        protocol.cumulativeUniqueLiquidators += 1;
        usageDailySnapshot.cumulativeUniqueLiquidators += 1;
      }

      liquidatorAccount.liquidateCount += INT_ONE;
      liquidatorAccount.save();

      const dailyLiquidatorAcctountID = "daily-liquidate"
        .concat(liquidator)
        .concat("-")
        .concat(days);
      let dailyLiquidatorAccount = ActiveAccount.load(
        dailyLiquidatorAcctountID
      );
      if (dailyLiquidatorAccount == null) {
        dailyLiquidatorAccount = new ActiveAccount(dailyLiquidatorAcctountID);
        dailyLiquidatorAccount.save();

        usageDailySnapshot.dailyActiveLiquidators += 1;
      }
    }
    if (liquidatee) {
      let liquidateeAccount = Account.load(liquidatee);
      // a new liquidatee
      if (
        liquidateeAccount == null ||
        liquidateeAccount.liquidationCount == 0
      ) {
        // liquidatee should already have positions & should not be new users
        liquidateeAccount = getOrCreateAccount(liquidatee);
        protocol.cumulativeUniqueLiquidatees += 1;
        usageDailySnapshot.cumulativeUniqueLiquidatees += 1;
      }

      liquidateeAccount.liquidationCount += INT_ONE;
      liquidateeAccount.save();

      const dailyLiquidateeAcctountID = "daily-liquidatee-"
        .concat(liquidatee)
        .concat("-")
        .concat(days);
      let dailyLiquidateeAccount = ActiveAccount.load(
        dailyLiquidateeAcctountID
      );
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
  deltaDebtUSD: BigDecimal = BIGDECIMAL_ZERO
): void {
  const transactionID = createEventID(event);

  if (deltaCollateral.gt(BIGINT_ZERO)) {
    // deposit
    const deposit = new Deposit(transactionID);
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
    const withdraw = new Withdraw(transactionID);
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
    const borrow = new Borrow(transactionID);
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
    const repay = new Repay(transactionID);
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

export function updatePriceForMarket(
  marketID: string,
  event: ethereum.Event
): void {
  // Price is updated for market marketID
  const market = getOrCreateMarket(marketID);
  const token = Token.load(market.inputToken);
  market.inputTokenPriceUSD = token!.lastPriceUSD!;
  market.totalDepositBalanceUSD = bigIntToBDUseDecimals(
    market.inputTokenBalance,
    token!.decimals
  ).times(market.inputTokenPriceUSD);
  market.totalValueLockedUSD = market.totalDepositBalanceUSD;
  market.save();

  // iterate to update protocol level totalDepositBalanceUSD
  const protocol = getOrCreateLendingProtocol();
  const marketIDList = protocol.marketIDList;
  let protocolTotalDepositBalanceUSD = BIGDECIMAL_ZERO;
  for (let i: i32 = 0; i < marketIDList.length; i++) {
    const marketAddress = marketIDList[i];
    const market = getOrCreateMarket(marketAddress);
    if (market == null) {
      log.warning("[updatePriceForMarket]market {} doesn't exist", [
        marketAddress,
      ]);
      continue;
    }
    protocolTotalDepositBalanceUSD = protocolTotalDepositBalanceUSD.plus(
      market.totalDepositBalanceUSD
    );
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
  protocolSideRevenueType: u32 = 0
): void {
  const market = getOrCreateMarket(marketID);
  if (market) {
    updateMarket(
      event,
      market,
      BIGINT_ZERO,
      BIGDECIMAL_ZERO,
      BIGDECIMAL_ZERO,
      BIGDECIMAL_ZERO,
      newTotalRevenueUSD,
      newSupplySideRevenueUSD
    );
  }

  updateProtocol(
    BIGDECIMAL_ZERO,
    BIGDECIMAL_ZERO,
    BIGDECIMAL_ZERO,
    newTotalRevenueUSD,
    newSupplySideRevenueUSD,
    protocolSideRevenueType
  );

  updateFinancialsSnapshot(
    event,
    BIGDECIMAL_ZERO,
    BIGDECIMAL_ZERO,
    BIGDECIMAL_ZERO,
    newTotalRevenueUSD,
    newSupplySideRevenueUSD,
    protocolSideRevenueType
  );
}
