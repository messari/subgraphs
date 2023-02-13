import {
    _ActivityHelper,
    FinancialsDailySnapshot,
    UsageMetricsDailySnapshot,
    UsageMetricsHourlySnapshot,
    DerivPerpProtocol as PerpetualSchema,
  } from "../../../../generated/schema";
  import { AccountWasActive } from "./account";
  import { Bytes } from "@graphprotocol/graph-ts";
  import * as constants from "../../util/constants";
  import { CustomEventType, getUnixDays, getUnixHours } from "../../util/events";
  
  const ActivityHelperID = Bytes.fromUTF8("_ActivityHelper");
  
  export class ProtocolSnapshot {
    protocol: PerpetualSchema;
    event: CustomEventType;
    dayID: i32;
    hourID: i32;
    activityHelper: _ActivityHelper;
  
    constructor(protocol: PerpetualSchema, event: CustomEventType) {
      this.protocol = protocol;
      this.event = event;
      this.dayID = getUnixDays(event.block);
      this.hourID = getUnixHours(event.block);
      this.activityHelper = initActivityHelper();
      this.takeSnapshots();
    }
  
    addActiveUser(activity: AccountWasActive): void {
      this.activityHelper.dailyActiveUsers += activity.daily ? 1 : 0;
      this.activityHelper.hourlyActiveUsers += activity.hourly ? 1 : 0;
      this.activityHelper.save();
    }
  
    private takeSnapshots(): void {
      const snapshotDayID =
        this.protocol._lastUpdateTimestamp.toI32() / constants.SECONDS_PER_DAY;
      const snapshotHourID =
        this.protocol._lastUpdateTimestamp.toI32() / constants.SECONDS_PER_HOUR;
  
      if (snapshotDayID != this.dayID) {
        this.takeFinancialsDailySnapshot(snapshotDayID);
        this.takeUsageDailySnapshot(snapshotDayID);
        this.protocol._lastSnapshotDayID = snapshotDayID;
        this.protocol.save();
      }
  
      if (snapshotHourID != this.hourID) {
        this.takeUsageHourlySnapshot(snapshotHourID);
        this.protocol._lastSnapshotHourID = snapshotHourID;
        this.protocol.save();
      }
    }
  
    private takeFinancialsDailySnapshot(day: i32): void {
      const snapshot = new FinancialsDailySnapshot(Bytes.fromI32(day));
      const previousSnapshot = FinancialsDailySnapshot.load(
        Bytes.fromI32(this.protocol._lastSnapshotDayID)
      );
  
      snapshot.days = day;
      snapshot.protocol = this.protocol.id;
  
      snapshot.cumulativeVolumeUSD = this.protocol.cumulativeVolumeUSD;
      snapshot.totalValueLockedUSD = this.protocol.totalValueLockedUSD;
      snapshot.protocolControlledValueUSD =
        this.protocol.protocolControlledValueUSD;
  
      snapshot.cumulativeInflowVolumeUSD =
        this.protocol.cumulativeInflowVolumeUSD;
      snapshot.cumulativeClosedInflowVolumeUSD =
        this.protocol.cumulativeClosedInflowVolumeUSD;
      snapshot.cumulativeOutflowVolumeUSD =
        this.protocol.cumulativeOutflowVolumeUSD;
  
      snapshot.cumulativeSupplySideRevenueUSD =
        this.protocol.cumulativeSupplySideRevenueUSD;
      snapshot.cumulativeProtocolSideRevenueUSD =
        this.protocol.cumulativeProtocolSideRevenueUSD;
      snapshot.cumulativeStakeSideRevenueUSD =
        this.protocol.cumulativeStakeSideRevenueUSD;
      snapshot.cumulativeTotalRevenueUSD =
        this.protocol.cumulativeTotalRevenueUSD;
  
      snapshot.cumulativeEntryPremiumUSD =
        this.protocol.cumulativeEntryPremiumUSD;
      snapshot.cumulativeExitPremiumUSD = this.protocol.cumulativeExitPremiumUSD;
      snapshot.cumulativeTotalPremiumUSD =
        this.protocol.cumulativeTotalPremiumUSD;
  
      snapshot.cumulativeDepositPremiumUSD =
        this.protocol.cumulativeDepositPremiumUSD;
      snapshot.cumulativeWithdrawPremiumUSD =
        this.protocol.cumulativeWithdrawPremiumUSD;
      snapshot.cumulativeTotalLiquidityPremiumUSD =
        this.protocol.cumulativeTotalLiquidityPremiumUSD;
  
      let volumeDelta = snapshot.cumulativeVolumeUSD;
      let supplySideRevenueDelta = snapshot.cumulativeSupplySideRevenueUSD;
      let protocolSideRevenueDelta = snapshot.cumulativeProtocolSideRevenueUSD;
      let stakeSideRevenueDelta = snapshot.cumulativeStakeSideRevenueUSD;
      let totalRevenueDelta = snapshot.cumulativeTotalRevenueUSD;
  
      let inflowVolumeDelta = snapshot.cumulativeInflowVolumeUSD;
      let outflowVolumeDelta = snapshot.cumulativeOutflowVolumeUSD;
      let closedInflowVolumeDelta = snapshot.cumulativeClosedInflowVolumeUSD;
  
      let entryPremiumDelta = snapshot.cumulativeEntryPremiumUSD;
      let exitPremiumDelta = snapshot.cumulativeExitPremiumUSD;
      let totalPremiumDelta = snapshot.cumulativeTotalPremiumUSD;
  
      let depositPremiumDelta = snapshot.cumulativeDepositPremiumUSD;
      let withdrawPremiumDelta = snapshot.cumulativeWithdrawPremiumUSD;
      let totalLiquidityPremiumDelta =
        snapshot.cumulativeTotalLiquidityPremiumUSD;
  
      if (previousSnapshot) {
        volumeDelta = snapshot.cumulativeVolumeUSD.minus(
          previousSnapshot.cumulativeVolumeUSD
        );
        supplySideRevenueDelta = snapshot.cumulativeSupplySideRevenueUSD.minus(
          previousSnapshot.cumulativeSupplySideRevenueUSD
        );
        protocolSideRevenueDelta =
          snapshot.cumulativeProtocolSideRevenueUSD.minus(
            previousSnapshot.cumulativeProtocolSideRevenueUSD
          );
        stakeSideRevenueDelta = snapshot.cumulativeStakeSideRevenueUSD.minus(
          previousSnapshot.cumulativeStakeSideRevenueUSD
        );
        totalRevenueDelta = snapshot.cumulativeTotalRevenueUSD.minus(
          previousSnapshot.cumulativeTotalRevenueUSD
        );
  
        inflowVolumeDelta = snapshot.cumulativeInflowVolumeUSD.minus(
          previousSnapshot.cumulativeInflowVolumeUSD
        );
        outflowVolumeDelta = snapshot.cumulativeOutflowVolumeUSD.minus(
          previousSnapshot.cumulativeOutflowVolumeUSD
        );
        closedInflowVolumeDelta = snapshot.cumulativeClosedInflowVolumeUSD.minus(
          previousSnapshot.cumulativeClosedInflowVolumeUSD
        );
  
        entryPremiumDelta = snapshot.cumulativeEntryPremiumUSD.minus(
          previousSnapshot.cumulativeEntryPremiumUSD
        );
        exitPremiumDelta = snapshot.cumulativeExitPremiumUSD.minus(
          previousSnapshot.cumulativeExitPremiumUSD
        );
        totalPremiumDelta = snapshot.cumulativeTotalPremiumUSD.minus(
          previousSnapshot.cumulativeTotalPremiumUSD
        );
  
        depositPremiumDelta = snapshot.cumulativeDepositPremiumUSD.minus(
          previousSnapshot.cumulativeDepositPremiumUSD
        );
        withdrawPremiumDelta = snapshot.cumulativeWithdrawPremiumUSD.minus(
          previousSnapshot.cumulativeWithdrawPremiumUSD
        );
        totalLiquidityPremiumDelta =
          snapshot.cumulativeTotalLiquidityPremiumUSD.minus(
            previousSnapshot.cumulativeTotalLiquidityPremiumUSD
          );
      }
  
      snapshot.dailyVolumeUSD = volumeDelta;
      snapshot.dailyOpenInterestUSD = this.protocol.openInterestUSD;
  
      snapshot.dailyInflowVolumeUSD = inflowVolumeDelta;
      snapshot.dailyClosedInflowVolumeUSD = closedInflowVolumeDelta;
      snapshot.dailyOutflowVolumeUSD = outflowVolumeDelta;
  
      snapshot.dailySupplySideRevenueUSD = supplySideRevenueDelta;
      snapshot.dailyProtocolSideRevenueUSD = protocolSideRevenueDelta;
      snapshot.dailyStakeSideRevenueUSD = stakeSideRevenueDelta;
      snapshot.dailyTotalRevenueUSD = totalRevenueDelta;
  
      snapshot.dailyEntryPremiumUSD = entryPremiumDelta;
      snapshot.dailyExitPremiumUSD = exitPremiumDelta;
      snapshot.dailyTotalPremiumUSD = totalPremiumDelta;
  
      snapshot.dailyDepositPremiumUSD = depositPremiumDelta;
      snapshot.dailyWithdrawPremiumUSD = withdrawPremiumDelta;
      snapshot.dailyTotalLiquidityPremiumUSD = totalLiquidityPremiumDelta;
  
      snapshot.save();
    }
  
    private takeUsageDailySnapshot(day: i32): void {
      const activity = this.activityHelper;
  
      const snapshot = new UsageMetricsDailySnapshot(Bytes.fromI32(day));
      const previousSnapshot = UsageMetricsDailySnapshot.load(
        Bytes.fromI32(this.protocol._lastSnapshotDayID)
      );
  
      snapshot.days = day;
      snapshot.protocol = this.protocol.id;
  
      snapshot.cumulativeUniqueUsers = this.protocol.cumulativeUniqueUsers;
      snapshot.cumulativePositionCount = this.protocol.cumulativePositionCount;
      snapshot.totalPoolCount = this.protocol.totalPoolCount;
  
      snapshot.longPositionCount = this.protocol.longPositionCount;
      snapshot.shortPositionCount = this.protocol.shortPositionCount;
      snapshot.openPositionCount = this.protocol.openPositionCount;
      snapshot.closedPositionCount = this.protocol.closedPositionCount;
  
      snapshot.cumulativeUniqueDepositors =
        this.protocol.cumulativeUniqueDepositors;
      snapshot.cumulativeUniqueBorrowers =
        this.protocol.cumulativeUniqueBorrowers;
  
      snapshot.cumulativeUniqueLiquidators =
        this.protocol.cumulativeUniqueLiquidators;
      snapshot.cumulativeUniqueLiquidatees =
        this.protocol.cumulativeUniqueLiquidatees;
  
      snapshot.cumulativeCollateralIn = this.protocol.collateralInCount;
      snapshot.cumulativeCollateralOut = this.protocol.collateralOutCount;
  
      let longPositionCountDelta = snapshot.longPositionCount;
      let shortPositionCountDelta = snapshot.shortPositionCount;
      let openPositionCountDelta = snapshot.openPositionCount;
      let closedPositionCountDelta = snapshot.closedPositionCount;
      let positionCountDelta = snapshot.cumulativePositionCount;
  
      // helper.dailyTransactionCount = 0;
      // helper.dailyDepositCount = 0;
      // helper.dailyWithdrawCount = 0;
      // helper.dailyBorrowCount = 0;
      // helper.dailySwapCount = 0;
  
      // helper.hourlyTransactionCount = 0;
      // helper.hourlyDepositCount = 0;
      // helper.hourlyWithdrawCount = 0;
      // helper.hourlySwapCount = 0;
  
      // helper.dailyCollateralIn = 0;
      // helper.dailyCollateralOut = 0;
  
      let transactionCountDelta = this.protocol.transactionCount;
      let depositCountDelta = this.protocol.depositCount;
      let withdrawCountDelta = this.protocol.withdrawCount;
      let borrowCountDelta = this.protocol.borrowCount;
      let swapCountDelta = this.protocol.swapCount;
  
      if (previousSnapshot) {
        longPositionCountDelta =
          snapshot.longPositionCount - previousSnapshot.longPositionCount;
        shortPositionCountDelta =
          snapshot.shortPositionCount - previousSnapshot.shortPositionCount;
        openPositionCountDelta =
          snapshot.openPositionCount - previousSnapshot.openPositionCount;
        closedPositionCountDelta =
          snapshot.closedPositionCount - previousSnapshot.closedPositionCount;
        positionCountDelta =
          snapshot.cumulativePositionCount -
          previousSnapshot.cumulativePositionCount;
  
        transactionCountDelta =
          snapshot. -
          previousSnapshot.cumulativeCollateralIn;
        positionCountDelta =
          snapshot.cumulativePositionCount -
          previousSnapshot.cumulativePositionCount;
        positionCountDelta =
          snapshot.cumulativePositionCount -
          previousSnapshot.cumulativePositionCount;
      }
  
      snapshot.dailylongPositionCount = longPositionCountDelta;
      snapshot.dailyshortPositionCount = shortPositionCountDelta;
      snapshot.dailyopenPositionCount = openPositionCountDelta;
      snapshot.dailyclosedPositionCount = closedPositionCountDelta;
      snapshot.dailycumulativePositionCount = positionCountDelta;
  
      snapshot.dailyTransactionCount;
      snapshot.dailyDepositCount;
      snapshot.dailyWithdrawCount;
      snapshot.dailyBorrowCount;
      snapshot.dailySwapCount;
  
      snapshot.dailyCollateralIn;
      snapshot.dailyCollateralOut;
  
      snapshot.dailyActiveUsers = activity.dailyActiveUsers;
      snapshot.dailyActiveDepositors = activity.dailyActiveDepositors;
      snapshot.dailyActiveBorrowers = activity.dailyActiveBorrowers;
      snapshot.dailyActiveLiquidators = activity.dailyActiveLiquidators;
      snapshot.dailyActiveLiquidatees = activity.dailyActiveLiquidatees;
  
      snapshot.save();
      activity.save();
    }
  
    private takeUsageHourlySnapshot(hour: i32): void {
      const activity = this.activityHelper;
  
      const snapshot = new UsageMetricsHourlySnapshot(Bytes.fromI32(hour));
      const previousSnapshot = UsageMetricsHourlySnapshot.load(
        Bytes.fromI32(this.protocol._lastSnapshotHourID)
      );
  
      snapshot.hours = hour;
      snapshot.protocol = this.protocol.id;
  
      snapshot.hourlyActiveUsers;
      snapshot.cumulativeUniqueUsers = this.protocol.cumulativeUniqueUsers;
  
      snapshot.hourlyTransactionCount;
      snapshot.hourlyDepositCount;
      snapshot.hourlyWithdrawCount;
      snapshot.hourlySwapCount;
  
      snapshot.save();
  
      activity.hourlyActiveUsers = 0;
      activity.save();
    }
  }
  
  function initActivityHelper(): _ActivityHelper {
    let helper = _ActivityHelper.load(ActivityHelperID);
    if (helper) return helper;
  
    helper = new _ActivityHelper(ActivityHelperID);
    helper.dailyActiveUsers = 0;
    helper.hourlyActiveUsers = 0;
  
    helper.dailyActiveDepositors = 0;
    helper.dailyActiveBorrowers = 0;
    helper.dailyActiveLiquidators = 0;
    helper.dailyActiveLiquidatees = 0;
    helper.save();
  
    return helper;
  }
  