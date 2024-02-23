import {
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";

import {
  FinancialsDailySnapshot,
  InterestRate,
  LendingProtocol,
  Market,
  MarketDailySnapshot,
  MarketHourlySnapshot,
  RevenueDetail,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
} from "../../generated/schema";
import { getProtocol } from "../initializers/protocol";

import {
  activityCounter,
  INT_ONE,
  INT_ZERO,
  PositionSide,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  TransactionType,
} from "./constants";

/**
 * This file contains the SnapshotManager, which is used to
 * make all of the storage changes that occur in lending snapshots.
 *
 * You can think of this as an abstraction so the developer doesn't
 * need to think about all of the detailed storage changes that occur.
 *
 * Schema Version:  3.1.0
 * SDK Version:     1.0.6
 * Author(s):
 *  - @dmelotik
 *  - @dhruv-chauhan
 */

export class SnapshotManager {
  private marketHourlySnapshot!: MarketHourlySnapshot;
  private marketDailySnapshot!: MarketDailySnapshot;
  private financialSnapshot!: FinancialsDailySnapshot;
  private usageHourlySnapshot!: UsageMetricsHourlySnapshot;
  private usageDailySnapshot!: UsageMetricsDailySnapshot;

  private event: ethereum.Event;
  private market: Market;
  private protocol: LendingProtocol;

  constructor(event: ethereum.Event, market: Market) {
    this.event = event;
    this.protocol = getProtocol();
    this.market = market;

    this.createOrUpdateMarketHourlySnapshot();
    this.createOrUpdateMarketDailySnapshot();
    this.createOrUpdateFinancials();
    this.createOrUpdateUsageDailySnapshot();
    this.createOrUpdateUsageHourlySnapshot();
  }

  ///////////////////
  ///// Getters /////
  ///////////////////

  private createOrUpdateMarketHourlySnapshot(): void {
    const hours = this.event.block.timestamp.toI32() / SECONDS_PER_HOUR;
    const id = this.market.id.concat(Bytes.fromI32(hours));
    let snapshot = MarketHourlySnapshot.load(id);

    if (!snapshot) {
      snapshot = new MarketHourlySnapshot(id);
      snapshot.hours = hours;
      snapshot.protocol = this.protocol.id;
      snapshot.market = this.market.id;
      snapshot.relation = this.market.relation;
      snapshot.hourlySupplySideRevenueUSD = BigDecimal.zero();
      snapshot.hourlyProtocolSideRevenueUSD = BigDecimal.zero();
      snapshot.hourlyTotalRevenueUSD = BigDecimal.zero();
      snapshot.hourlyDepositUSD = BigDecimal.zero();
      snapshot.hourlyBorrowUSD = BigDecimal.zero();
      snapshot.hourlyLiquidateUSD = BigDecimal.zero();
      snapshot.hourlyWithdrawUSD = BigDecimal.zero();
      snapshot.hourlyRepayUSD = BigDecimal.zero();
      snapshot.hourlyTransferUSD = BigDecimal.zero();
      snapshot.hourlyFlashloanUSD = BigDecimal.zero();
    }
    snapshot.blockNumber = this.event.block.number;
    snapshot.timestamp = this.event.block.timestamp;
    snapshot.inputTokenBalance = this.market.inputTokenBalance;
    snapshot.inputTokenPriceUSD = this.market.inputTokenPriceUSD;
    snapshot.rates = this.market.rates
      ? this.getSnapshotRates(this.market.rates!, hours.toString())
      : null;
    snapshot.reserves = this.market.reserves;
    snapshot.variableBorrowedTokenBalance =
      this.market.variableBorrowedTokenBalance;
    snapshot.totalValueLockedUSD = this.market.totalValueLockedUSD;
    snapshot.cumulativeSupplySideRevenueUSD =
      this.market.cumulativeSupplySideRevenueUSD;
    snapshot.cumulativeProtocolSideRevenueUSD =
      this.market.cumulativeProtocolSideRevenueUSD;
    snapshot.cumulativeTotalRevenueUSD = this.market.cumulativeTotalRevenueUSD;
    snapshot.totalDepositBalanceUSD = this.market.totalDepositBalanceUSD;
    snapshot.cumulativeDepositUSD = this.market.cumulativeDepositUSD;
    snapshot.totalBorrowBalanceUSD = this.market.totalBorrowBalanceUSD;
    snapshot.cumulativeBorrowUSD = this.market.cumulativeBorrowUSD;
    snapshot.cumulativeLiquidateUSD = this.market.cumulativeLiquidateUSD;

    snapshot.save();
    this.marketHourlySnapshot = snapshot;
  }

  private createOrUpdateMarketDailySnapshot(): void {
    const days = this.event.block.timestamp.toI32() / SECONDS_PER_DAY;
    const id = this.market.id.concat(Bytes.fromI32(days));
    let snapshot = MarketDailySnapshot.load(id);

    if (!snapshot) {
      snapshot = new MarketDailySnapshot(id);
      snapshot.days = days;
      snapshot.protocol = this.protocol.id;
      snapshot.market = this.market.id;
      snapshot.relation = this.market.relation;
      snapshot.dailySupplySideRevenueUSD = BigDecimal.zero();
      snapshot.dailyProtocolSideRevenueUSD = BigDecimal.zero();
      snapshot.dailyTotalRevenueUSD = BigDecimal.zero();
      snapshot.dailyDepositUSD = BigDecimal.zero();
      snapshot.dailyNativeDeposit = BigInt.zero();
      snapshot.dailyBorrowUSD = BigDecimal.zero();
      snapshot.dailyNativeBorrow = BigInt.zero();
      snapshot.dailyLiquidateUSD = BigDecimal.zero();
      snapshot.dailyNativeLiquidate = BigInt.zero();
      snapshot.dailyWithdrawUSD = BigDecimal.zero();
      snapshot.dailyNativeWithdraw = BigInt.zero();
      snapshot.dailyRepayUSD = BigDecimal.zero();
      snapshot.dailyNativeRepay = BigInt.zero();
      snapshot.dailyTransferUSD = BigDecimal.zero();
      snapshot.dailyNativeTransfer = BigInt.zero();
      snapshot.dailyFlashloanUSD = BigDecimal.zero();
      snapshot.dailyNativeFlashloan = BigInt.zero();
      snapshot.dailyActiveUsers = INT_ZERO;
      snapshot.dailyActiveDepositors = INT_ZERO;
      snapshot.dailyActiveBorrowers = INT_ZERO;
      snapshot.dailyActiveLiquidators = INT_ZERO;
      snapshot.dailyActiveLiquidatees = INT_ZERO;
      snapshot.dailyActiveTransferrers = INT_ZERO;
      snapshot.dailyActiveFlashloaners = INT_ZERO;
      snapshot.dailyDepositCount = INT_ZERO;
      snapshot.dailyWithdrawCount = INT_ZERO;
      snapshot.dailyBorrowCount = INT_ZERO;
      snapshot.dailyRepayCount = INT_ZERO;
      snapshot.dailyLiquidateCount = INT_ZERO;
      snapshot.dailyTransferCount = INT_ZERO;
      snapshot.dailyFlashloanCount = INT_ZERO;
      snapshot.dailyActiveLendingPositionCount = INT_ZERO;
      snapshot.dailyActiveBorrowingPositionCount = INT_ZERO;
    }
    snapshot.blockNumber = this.event.block.number;
    snapshot.timestamp = this.event.block.timestamp;
    snapshot.inputTokenBalance = this.market.inputTokenBalance;
    snapshot.inputTokenPriceUSD = this.market.inputTokenPriceUSD;
    snapshot.rates = this.market.rates
      ? this.getSnapshotRates(this.market.rates!, days.toString())
      : null;
    snapshot.reserves = this.market.reserves;
    snapshot.variableBorrowedTokenBalance =
      this.market.variableBorrowedTokenBalance;
    snapshot.totalValueLockedUSD = this.market.totalValueLockedUSD;
    snapshot.cumulativeSupplySideRevenueUSD =
      this.market.cumulativeSupplySideRevenueUSD;
    snapshot.cumulativeProtocolSideRevenueUSD =
      this.market.cumulativeProtocolSideRevenueUSD;
    snapshot.cumulativeTotalRevenueUSD = this.market.cumulativeTotalRevenueUSD;
    snapshot.revenueDetail = this.market.revenueDetail
      ? this.getSnapshotRevenueDetail(this.market.revenueDetail!, days)
      : null;
    snapshot.totalDepositBalanceUSD = this.market.totalDepositBalanceUSD;
    snapshot.cumulativeDepositUSD = this.market.cumulativeDepositUSD;
    snapshot.totalBorrowBalanceUSD = this.market.totalBorrowBalanceUSD;
    snapshot.cumulativeBorrowUSD = this.market.cumulativeBorrowUSD;
    snapshot.cumulativeLiquidateUSD = this.market.cumulativeLiquidateUSD;
    snapshot.cumulativeTransferUSD = this.market.cumulativeTransferUSD;
    snapshot.cumulativeFlashloanUSD = this.market.cumulativeFlashloanUSD;
    snapshot.positionCount = this.market.positionCount;
    snapshot.openPositionCount = this.market.openPositionCount;
    snapshot.closedPositionCount = this.market.closedPositionCount;
    snapshot.lendingPositionCount = this.market.lendingPositionCount;
    snapshot.borrowingPositionCount = this.market.borrowingPositionCount;

    snapshot.save();
    this.marketDailySnapshot = snapshot;
  }

  createOrUpdateFinancials(): void {
    const days = this.event.block.timestamp.toI32() / SECONDS_PER_DAY;
    const id = Bytes.fromI32(days);
    let snapshot = FinancialsDailySnapshot.load(id);

    if (!snapshot) {
      snapshot = new FinancialsDailySnapshot(id);
      snapshot.days = days;
      snapshot.protocol = this.protocol.id;
      snapshot.dailySupplySideRevenueUSD = BigDecimal.zero();
      snapshot.dailyProtocolSideRevenueUSD = BigDecimal.zero();
      snapshot.dailyTotalRevenueUSD = BigDecimal.zero();
      snapshot.dailyDepositUSD = BigDecimal.zero();
      snapshot.dailyBorrowUSD = BigDecimal.zero();
      snapshot.dailyLiquidateUSD = BigDecimal.zero();
      snapshot.dailyWithdrawUSD = BigDecimal.zero();
      snapshot.dailyLiquidateUSD = BigDecimal.zero();
      snapshot.dailyWithdrawUSD = BigDecimal.zero();
      snapshot.dailyRepayUSD = BigDecimal.zero();
      snapshot.dailyTransferUSD = BigDecimal.zero();
      snapshot.dailyFlashloanUSD = BigDecimal.zero();
    }
    snapshot.blockNumber = this.event.block.number;
    snapshot.timestamp = this.event.block.timestamp;
    snapshot.totalValueLockedUSD = this.protocol.totalValueLockedUSD;
    snapshot.cumulativeSupplySideRevenueUSD =
      this.protocol.cumulativeSupplySideRevenueUSD;
    snapshot.cumulativeProtocolSideRevenueUSD =
      this.protocol.cumulativeProtocolSideRevenueUSD;
    snapshot.cumulativeTotalRevenueUSD =
      this.protocol.cumulativeTotalRevenueUSD;
    snapshot.revenueDetail = this.protocol.revenueDetail
      ? this.getSnapshotRevenueDetail(this.protocol.revenueDetail!, days)
      : null;
    snapshot.totalDepositBalanceUSD = this.protocol.totalDepositBalanceUSD;
    snapshot.cumulativeDepositUSD = this.protocol.cumulativeDepositUSD;
    snapshot.totalBorrowBalanceUSD = this.protocol.totalBorrowBalanceUSD;
    snapshot.cumulativeBorrowUSD = this.protocol.cumulativeBorrowUSD;
    snapshot.cumulativeLiquidateUSD = this.protocol.cumulativeLiquidateUSD;

    snapshot.save();
    this.financialSnapshot = snapshot;
  }

  createOrUpdateUsageDailySnapshot(): void {
    const days = this.event.block.timestamp.toI32() / SECONDS_PER_DAY;
    const id = Bytes.fromI32(days);
    let snapshot = UsageMetricsDailySnapshot.load(id);

    if (!snapshot) {
      snapshot = new UsageMetricsDailySnapshot(id);
      snapshot.days = days;
      snapshot.protocol = this.protocol.id;
      snapshot.dailyActiveUsers = INT_ZERO;
      snapshot.dailyActiveDepositors = INT_ZERO;
      snapshot.dailyActiveBorrowers = INT_ZERO;
      snapshot.dailyActiveLiquidators = INT_ZERO;
      snapshot.dailyActiveLiquidatees = INT_ZERO;
      snapshot.dailyTransactionCount = INT_ZERO;
      snapshot.dailyDepositCount = INT_ZERO;
      snapshot.dailyWithdrawCount = INT_ZERO;
      snapshot.dailyBorrowCount = INT_ZERO;
      snapshot.dailyRepayCount = INT_ZERO;
      snapshot.dailyLiquidateCount = INT_ZERO;
      snapshot.dailyTransferCount = INT_ZERO;
      snapshot.dailyFlashloanCount = INT_ZERO;
      snapshot.dailyActivePositions = INT_ZERO;
    }
    snapshot.cumulativeUniqueUsers = this.protocol.cumulativeUniqueUsers;
    snapshot.cumulativeUniqueDepositors =
      this.protocol.cumulativeUniqueDepositors;
    snapshot.cumulativeUniqueBorrowers =
      this.protocol.cumulativeUniqueBorrowers;
    snapshot.cumulativeUniqueLiquidators =
      this.protocol.cumulativeUniqueLiquidators;
    snapshot.cumulativeUniqueLiquidatees =
      this.protocol.cumulativeUniqueLiquidatees;
    snapshot.cumulativePositionCount = this.protocol.cumulativePositionCount;
    snapshot.openPositionCount = this.protocol.openPositionCount;
    snapshot.totalPoolCount = this.protocol.totalPoolCount;
    snapshot.blockNumber = this.event.block.number;
    snapshot.timestamp = this.event.block.timestamp;

    snapshot.save();
    this.usageDailySnapshot = snapshot;
  }

  createOrUpdateUsageHourlySnapshot(): void {
    const hours = this.event.block.timestamp.toI32() / SECONDS_PER_HOUR;
    const id = Bytes.fromI32(hours);
    let snapshot = UsageMetricsHourlySnapshot.load(id);

    if (!snapshot) {
      snapshot = new UsageMetricsHourlySnapshot(id);
      snapshot.hours = hours;
      snapshot.protocol = this.protocol.id;
      snapshot.hourlyActiveUsers = INT_ZERO;
      snapshot.hourlyTransactionCount = INT_ZERO;
      snapshot.hourlyDepositCount = INT_ZERO;
      snapshot.hourlyWithdrawCount = INT_ZERO;
      snapshot.hourlyBorrowCount = INT_ZERO;
      snapshot.hourlyRepayCount = INT_ZERO;
      snapshot.hourlyLiquidateCount = INT_ZERO;
    }
    snapshot.cumulativeUniqueUsers = this.protocol.cumulativeUniqueUsers;
    snapshot.blockNumber = this.event.block.number;
    snapshot.timestamp = this.event.block.timestamp;

    snapshot.save();
    this.usageHourlySnapshot = snapshot;
  }

  ////////////////////
  ///// Updaters /////
  ////////////////////

  updateUsageData(transactionType: string, account: Bytes): void {
    this.usageDailySnapshot.dailyActiveUsers += activityCounter(
      account,
      transactionType,
      false,
      this.marketDailySnapshot.days
    );
    this.marketDailySnapshot.dailyActiveUsers += activityCounter(
      account,
      transactionType,
      false,
      this.marketDailySnapshot.days,
      this.market.id
    );
    this.usageHourlySnapshot.hourlyActiveUsers += activityCounter(
      account,
      transactionType,
      false,
      this.marketHourlySnapshot.hours
    );
    if (
      transactionType === TransactionType.DEPOSIT ||
      transactionType === TransactionType.DEPOSIT_COLLATERAL
    ) {
      this.usageDailySnapshot.dailyActiveDepositors += activityCounter(
        account,
        transactionType,
        true,
        this.marketDailySnapshot.days
      );
      this.marketDailySnapshot.dailyActiveDepositors += activityCounter(
        account,
        transactionType,
        true,
        this.marketDailySnapshot.days,
        this.market.id
      );
    }
    if (transactionType === TransactionType.BORROW) {
      this.usageDailySnapshot.dailyActiveBorrowers += activityCounter(
        account,
        transactionType,
        true,
        this.marketDailySnapshot.days
      );
      this.marketDailySnapshot.dailyActiveBorrowers += activityCounter(
        account,
        transactionType,
        true,
        this.marketDailySnapshot.days
      );
    }
    if (transactionType === TransactionType.LIQUIDATOR) {
      this.usageDailySnapshot.dailyActiveLiquidators += activityCounter(
        account,
        transactionType,
        true,
        this.marketDailySnapshot.days
      );
      this.marketDailySnapshot.dailyActiveLiquidators += activityCounter(
        account,
        transactionType,
        true,
        this.marketDailySnapshot.days,
        this.market.id
      );
    }
    if (transactionType === TransactionType.LIQUIDATEE) {
      this.usageDailySnapshot.dailyActiveLiquidatees += activityCounter(
        account,
        transactionType,
        true,
        this.marketDailySnapshot.days
      );
      this.marketDailySnapshot.dailyActiveLiquidatees += activityCounter(
        account,
        transactionType,
        true,
        this.marketDailySnapshot.days,
        this.market.id
      );
    }
    if (transactionType === TransactionType.FLASHLOAN)
      this.marketDailySnapshot.dailyActiveFlashloaners += activityCounter(
        account,
        transactionType,
        true,
        this.marketDailySnapshot.days,
        this.market.id
      );

    this.marketDailySnapshot.save();
    this.usageDailySnapshot.save();
    this.usageHourlySnapshot.save();
  }

  updateTransactionData(
    transactionType: string,
    amount: BigInt,
    amountUSD: BigDecimal
  ): void {
    if (
      transactionType === TransactionType.DEPOSIT ||
      transactionType == TransactionType.DEPOSIT_COLLATERAL
    ) {
      this.marketDailySnapshot.dailyDepositUSD =
        this.marketDailySnapshot.dailyDepositUSD.plus(amountUSD);
      this.marketDailySnapshot.dailyNativeDeposit =
        this.marketDailySnapshot.dailyNativeDeposit.plus(amount);
      this.marketHourlySnapshot.hourlyDepositUSD =
        this.marketHourlySnapshot.hourlyDepositUSD.plus(amountUSD);
      this.financialSnapshot.dailyDepositUSD =
        this.financialSnapshot.dailyDepositUSD.plus(amountUSD);
      this.usageDailySnapshot.dailyDepositCount += INT_ONE;
      this.usageHourlySnapshot.hourlyDepositCount += INT_ONE;
    } else if (
      transactionType === TransactionType.WITHDRAW ||
      transactionType === TransactionType.WITHDRAW_COLLATERAL
    ) {
      this.marketDailySnapshot.dailyWithdrawUSD =
        this.marketDailySnapshot.dailyWithdrawUSD.plus(amountUSD);
      this.marketDailySnapshot.dailyNativeWithdraw =
        this.marketDailySnapshot.dailyNativeWithdraw.plus(amount);
      this.marketHourlySnapshot.hourlyWithdrawUSD =
        this.marketHourlySnapshot.hourlyWithdrawUSD.plus(amountUSD);
      this.financialSnapshot.dailyWithdrawUSD =
        this.financialSnapshot.dailyWithdrawUSD.plus(amountUSD);
      this.usageDailySnapshot.dailyWithdrawCount += INT_ONE;
      this.usageHourlySnapshot.hourlyWithdrawCount += INT_ONE;
    } else if (transactionType === TransactionType.BORROW) {
      this.marketDailySnapshot.dailyBorrowUSD =
        this.marketDailySnapshot.dailyBorrowUSD.plus(amountUSD);
      this.marketDailySnapshot.dailyNativeBorrow =
        this.marketDailySnapshot.dailyNativeBorrow.plus(amount);
      this.marketHourlySnapshot.hourlyBorrowUSD =
        this.marketHourlySnapshot.hourlyBorrowUSD.plus(amountUSD);
      this.financialSnapshot.dailyBorrowUSD =
        this.financialSnapshot.dailyBorrowUSD.plus(amountUSD);
      this.usageDailySnapshot.dailyBorrowCount += INT_ONE;
      this.usageHourlySnapshot.hourlyBorrowCount += INT_ONE;
    } else if (transactionType === TransactionType.REPAY) {
      this.marketDailySnapshot.dailyRepayUSD =
        this.marketDailySnapshot.dailyRepayUSD.plus(amountUSD);
      this.marketDailySnapshot.dailyNativeRepay =
        this.marketDailySnapshot.dailyNativeRepay.plus(amount);
      this.marketHourlySnapshot.hourlyRepayUSD =
        this.marketHourlySnapshot.hourlyRepayUSD.plus(amountUSD);
      this.financialSnapshot.dailyRepayUSD =
        this.financialSnapshot.dailyRepayUSD.plus(amountUSD);
      this.usageDailySnapshot.dailyRepayCount += INT_ONE;
      this.usageHourlySnapshot.hourlyRepayCount += INT_ONE;
    } else if (transactionType === TransactionType.LIQUIDATE) {
      this.marketDailySnapshot.dailyLiquidateUSD =
        this.marketDailySnapshot.dailyLiquidateUSD.plus(amountUSD);
      this.marketDailySnapshot.dailyNativeLiquidate =
        this.marketDailySnapshot.dailyNativeLiquidate.plus(amount);
      this.marketHourlySnapshot.hourlyLiquidateUSD =
        this.marketHourlySnapshot.hourlyLiquidateUSD.plus(amountUSD);
      this.financialSnapshot.dailyLiquidateUSD =
        this.financialSnapshot.dailyLiquidateUSD.plus(amountUSD);
      this.usageDailySnapshot.dailyLiquidateCount += INT_ONE;
      this.usageHourlySnapshot.hourlyLiquidateCount += INT_ONE;
    } else if (transactionType === TransactionType.FLASHLOAN) {
      this.marketDailySnapshot.dailyFlashloanUSD =
        this.marketDailySnapshot.dailyFlashloanUSD.plus(amountUSD);
      this.marketDailySnapshot.dailyNativeFlashloan =
        this.marketDailySnapshot.dailyNativeFlashloan.plus(amount);
      this.marketHourlySnapshot.hourlyFlashloanUSD =
        this.marketHourlySnapshot.hourlyFlashloanUSD.plus(amountUSD);
      this.financialSnapshot.dailyFlashloanUSD =
        this.financialSnapshot.dailyFlashloanUSD.plus(amountUSD);
      this.usageDailySnapshot.dailyFlashloanCount += INT_ONE;
    } else {
      log.error("[updateTransactionData] Invalid transaction type: {}", [
        transactionType,
      ]);
      return;
    }
    this.usageDailySnapshot.dailyTransactionCount += INT_ONE;
    this.usageHourlySnapshot.hourlyTransactionCount += INT_ONE;

    this.usageDailySnapshot.save();
    this.usageHourlySnapshot.save();
    this.marketDailySnapshot.save();
    this.marketHourlySnapshot.save();
    this.financialSnapshot.save();
  }

  updateRevenue(
    protocolRevenueDelta: BigDecimal,
    supplyRevenueDelta: BigDecimal
  ): void {
    const totalRevenueDelta = protocolRevenueDelta.plus(supplyRevenueDelta);

    // update market hourly snapshot
    this.marketHourlySnapshot.hourlyTotalRevenueUSD =
      this.marketHourlySnapshot.hourlyTotalRevenueUSD.plus(totalRevenueDelta);
    this.marketHourlySnapshot.hourlyProtocolSideRevenueUSD =
      this.marketHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(
        protocolRevenueDelta
      );
    this.marketHourlySnapshot.hourlySupplySideRevenueUSD =
      this.marketHourlySnapshot.hourlySupplySideRevenueUSD.plus(
        supplyRevenueDelta
      );
    this.marketHourlySnapshot.save();

    // update market daily snapshot
    this.marketDailySnapshot.dailyTotalRevenueUSD =
      this.marketDailySnapshot.dailyTotalRevenueUSD.plus(totalRevenueDelta);
    this.marketDailySnapshot.dailyProtocolSideRevenueUSD =
      this.marketDailySnapshot.dailyProtocolSideRevenueUSD.plus(
        protocolRevenueDelta
      );
    this.marketDailySnapshot.dailySupplySideRevenueUSD =
      this.marketDailySnapshot.dailySupplySideRevenueUSD.plus(
        supplyRevenueDelta
      );
    this.marketDailySnapshot.save();

    // update financials snapshot
    this.financialSnapshot.dailyTotalRevenueUSD =
      this.financialSnapshot.dailyTotalRevenueUSD.plus(totalRevenueDelta);
    this.financialSnapshot.dailyProtocolSideRevenueUSD =
      this.financialSnapshot.dailyProtocolSideRevenueUSD.plus(
        protocolRevenueDelta
      );
    this.financialSnapshot.dailySupplySideRevenueUSD =
      this.financialSnapshot.dailySupplySideRevenueUSD.plus(supplyRevenueDelta);
    this.financialSnapshot.save();
  }

  addDailyActivePosition(side: string): void {
    if (side === PositionSide.BORROWER) {
      this.marketDailySnapshot.dailyActiveBorrowingPositionCount += INT_ONE;
    }
    if (side === PositionSide.COLLATERAL || side === PositionSide.SUPPLIER) {
      this.marketDailySnapshot.dailyActiveLendingPositionCount += INT_ONE;
    }
    this.marketDailySnapshot.save();
  }

  ///////////////////
  ///// Helpers /////
  ///////////////////

  private getSnapshotRates(rates: string[], timeSuffix: string): string[] {
    const snapshotRates: string[] = [];
    for (let i = 0; i < rates.length; i++) {
      const rate = InterestRate.load(rates[i]);
      if (!rate) {
        log.warning("[getSnapshotRates] rate {} not found, should not happen", [
          rates[i],
        ]);
        continue;
      }

      // create new snapshot rate
      const snapshotRateId = rates[i].concat("-").concat(timeSuffix);
      const snapshotRate = new InterestRate(snapshotRateId);
      snapshotRate.rate = rate.rate;
      snapshotRate.side = rate.side;
      snapshotRate.type = rate.type;
      snapshotRate.market = this.market.id;
      snapshotRate.save();
      snapshotRates.push(snapshotRateId);
    }
    return snapshotRates;
  }

  private getSnapshotRevenueDetail(
    currID: Bytes,
    timeSuffix: i32
  ): Bytes | null {
    const currDetails = RevenueDetail.load(currID);
    if (!currDetails) {
      log.error(
        "[getRevenueDetailSnapshot] Cannot find revenue details id: {}",
        [currID.toHexString()]
      );
      return null;
    }

    const newDetails = new RevenueDetail(
      currDetails.id.concat(Bytes.fromI32(timeSuffix))
    );
    newDetails.sources = currDetails.sources;
    newDetails.amountsUSD = currDetails.amountsUSD;
    newDetails.save();

    return newDetails.id;
  }
}
