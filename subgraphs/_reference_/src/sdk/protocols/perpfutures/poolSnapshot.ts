import {
  subtractTwoBigIntArrays,
  subtractTwoBigDecimalArrays,
} from "../../util/arrays";
import {
  LiquidityPoolDailySnapshot,
  LiquidityPoolHourlySnapshot,
  LiquidityPool as PoolSchema,
} from "../../../../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";
import * as constants from "../../util/constants";
import { CustomEventType, getUnixDays, getUnixHours } from "../../util/events";

/**
 * This file contains the PoolSnapshot, which is used to
 * make all of the storage changes that occur in the pool daily and hourly snapshots.
 *
 * Schema Version:  1.2.0
 * SDK Version:     1.0.0
 * Author(s):
 *  - @harsh9200
 */

export class PoolSnapshot {
  pool: PoolSchema;
  event: CustomEventType;
  dayID: i32;
  hourID: i32;

  constructor(pool: PoolSchema, event: CustomEventType) {
    this.pool = pool;
    this.event = event;
    this.dayID = getUnixDays(event.block);
    this.hourID = getUnixHours(event.block);

    this.takeSnapshots();
  }

  private takeSnapshots(): void {
    if (!this.isInitialized()) return;
    if (!this.pool._lastUpdateTimestamp) return;

    const snapshotDayID =
      this.pool._lastUpdateTimestamp.toI32() / constants.SECONDS_PER_DAY;
    const snapshotHourID =
      this.pool._lastUpdateTimestamp.toI32() / constants.SECONDS_PER_HOUR;

    if (snapshotDayID != this.dayID) {
      this.pool._lastSnapshotDayID = BigInt.fromI32(snapshotDayID);
      this.pool.save();
      this.takeDailySnapshot(snapshotDayID);
    }

    if (snapshotHourID != this.hourID) {
      this.pool._lastSnapshotHourID = BigInt.fromI32(snapshotHourID);
      this.pool.save();
      this.takeHourlySnapshot(snapshotHourID);
    }
  }

  private isInitialized(): boolean {
    return this.pool._lastSnapshotDayID && this.pool._lastSnapshotHourID
      ? true
      : false;
  }

  private takeHourlySnapshot(hour: i32): void {
    const snapshot = new LiquidityPoolHourlySnapshot(
      this.pool.id.concatI32(hour)
    );

    const previousSnapshot = LiquidityPoolHourlySnapshot.load(
      this.pool.id.concatI32(this.pool._lastSnapshotHourID!.toI32())
    );

    snapshot.hours = hour;
    snapshot.pool = this.pool.id;
    snapshot.protocol = this.pool.protocol;

    snapshot.totalValueLockedUSD = this.pool.totalValueLockedUSD;

    snapshot.cumulativeSupplySideRevenueUSD =
      this.pool.cumulativeSupplySideRevenueUSD;
    snapshot.hourlySupplySideRevenueUSD = previousSnapshot
      ? snapshot.cumulativeSupplySideRevenueUSD.minus(
          previousSnapshot.cumulativeSupplySideRevenueUSD
        )
      : snapshot.cumulativeSupplySideRevenueUSD;

    snapshot.cumulativeProtocolSideRevenueUSD =
      this.pool.cumulativeProtocolSideRevenueUSD;
    snapshot.hourlyProtocolSideRevenueUSD = previousSnapshot
      ? snapshot.cumulativeProtocolSideRevenueUSD.minus(
          previousSnapshot.cumulativeProtocolSideRevenueUSD
        )
      : snapshot.cumulativeProtocolSideRevenueUSD;

    snapshot.cumulativeTotalRevenueUSD = this.pool.cumulativeTotalRevenueUSD;
    snapshot.hourlyTotalRevenueUSD = previousSnapshot
      ? snapshot.cumulativeTotalRevenueUSD.minus(
          previousSnapshot.cumulativeTotalRevenueUSD
        )
      : snapshot.cumulativeTotalRevenueUSD;

    snapshot.hourlyFundingrate = this.pool.fundingrate;

    snapshot.hourlyLongOpenInterestUSD = this.pool.longOpenInterestUSD;
    snapshot.hourlyShortOpenInterestUSD = this.pool.shortOpenInterestUSD;
    snapshot.hourlyTotalOpenInterestUSD = this.pool.totalOpenInterestUSD;

    snapshot.cumulativeEntryPremiumUSD = this.pool.cumulativeEntryPremiumUSD;
    snapshot.hourlyEntryPremiumUSD = previousSnapshot
      ? snapshot.cumulativeEntryPremiumUSD.minus(
          previousSnapshot.cumulativeEntryPremiumUSD
        )
      : snapshot.cumulativeEntryPremiumUSD;

    snapshot.cumulativeExitPremiumUSD = this.pool.cumulativeExitPremiumUSD;
    snapshot.hourlyExitPremiumUSD = previousSnapshot
      ? snapshot.cumulativeExitPremiumUSD.minus(
          previousSnapshot.cumulativeExitPremiumUSD
        )
      : snapshot.cumulativeExitPremiumUSD;

    snapshot.cumulativeTotalPremiumUSD = this.pool.cumulativeTotalPremiumUSD;
    snapshot.hourlyTotalPremiumUSD = previousSnapshot
      ? snapshot.cumulativeTotalPremiumUSD.minus(
          previousSnapshot.cumulativeTotalPremiumUSD
        )
      : snapshot.cumulativeTotalPremiumUSD;

    snapshot.cumulativeDepositPremiumUSD =
      this.pool.cumulativeDepositPremiumUSD;
    snapshot.hourlyDepositPremiumUSD = previousSnapshot
      ? snapshot.cumulativeDepositPremiumUSD.minus(
          previousSnapshot.cumulativeDepositPremiumUSD
        )
      : snapshot.cumulativeDepositPremiumUSD;

    snapshot.cumulativeWithdrawPremiumUSD =
      this.pool.cumulativeWithdrawPremiumUSD;
    snapshot.hourlyWithdrawPremiumUSD = previousSnapshot
      ? snapshot.cumulativeWithdrawPremiumUSD.minus(
          previousSnapshot.cumulativeWithdrawPremiumUSD
        )
      : snapshot.cumulativeWithdrawPremiumUSD;

    snapshot.cumulativeTotalLiquidityPremiumUSD =
      this.pool.cumulativeTotalLiquidityPremiumUSD;
    snapshot.hourlyTotalLiquidityPremiumUSD = previousSnapshot
      ? snapshot.cumulativeTotalLiquidityPremiumUSD.minus(
          previousSnapshot.cumulativeTotalLiquidityPremiumUSD
        )
      : snapshot.cumulativeTotalLiquidityPremiumUSD;

    snapshot.cumulativeVolumeByTokenUSD = this.pool.cumulativeVolumeByTokenUSD;
    snapshot.hourlyVolumeByTokenUSD = previousSnapshot
      ? subtractTwoBigDecimalArrays(
          snapshot.cumulativeVolumeByTokenUSD,
          previousSnapshot.cumulativeVolumeByTokenUSD
        )
      : snapshot.cumulativeVolumeByTokenUSD;

    snapshot.cumulativeVolumeByTokenAmount =
      this.pool.cumulativeVolumeByTokenAmount;
    snapshot.hourlyVolumeByTokenAmount = previousSnapshot
      ? subtractTwoBigIntArrays(
          snapshot.cumulativeVolumeByTokenAmount,
          previousSnapshot.cumulativeVolumeByTokenAmount
        )
      : snapshot.cumulativeVolumeByTokenAmount;

    snapshot.cumulativeVolumeUSD = this.pool.cumulativeVolumeUSD;
    snapshot.hourlyVolumeUSD = previousSnapshot
      ? snapshot.cumulativeVolumeUSD.minus(previousSnapshot.cumulativeVolumeUSD)
      : snapshot.cumulativeVolumeUSD;

    snapshot.cumulativeInflowVolumeByTokenUSD =
      this.pool.cumulativeInflowVolumeByTokenUSD;
    snapshot.hourlyInflowVolumeByTokenUSD = previousSnapshot
      ? subtractTwoBigDecimalArrays(
          snapshot.cumulativeInflowVolumeByTokenUSD,
          previousSnapshot.cumulativeInflowVolumeByTokenUSD
        )
      : snapshot.cumulativeInflowVolumeByTokenUSD;

    snapshot.cumulativeInflowVolumeByTokenAmount =
      this.pool.cumulativeInflowVolumeByTokenAmount;
    snapshot.hourlyInflowVolumeByTokenAmount = previousSnapshot
      ? subtractTwoBigIntArrays(
          snapshot.cumulativeInflowVolumeByTokenAmount,
          previousSnapshot.cumulativeInflowVolumeByTokenAmount
        )
      : snapshot.cumulativeInflowVolumeByTokenAmount;

    snapshot.cumulativeInflowVolumeUSD = this.pool.cumulativeInflowVolumeUSD;
    snapshot.hourlyInflowVolumeUSD = previousSnapshot
      ? snapshot.cumulativeInflowVolumeUSD.minus(
          previousSnapshot.cumulativeInflowVolumeUSD
        )
      : snapshot.cumulativeInflowVolumeUSD;

    snapshot.cumulativeClosedInflowVolumeByTokenUSD =
      this.pool.cumulativeClosedInflowVolumeByTokenUSD;
    snapshot.hourlyClosedInflowVolumeByTokenUSD = previousSnapshot
      ? subtractTwoBigDecimalArrays(
          snapshot.cumulativeClosedInflowVolumeByTokenUSD,
          previousSnapshot.cumulativeClosedInflowVolumeByTokenUSD
        )
      : snapshot.cumulativeClosedInflowVolumeByTokenUSD;

    snapshot.cumulativeClosedInflowVolumeByTokenAmount =
      this.pool.cumulativeInflowVolumeByTokenAmount;
    snapshot.hourlyClosedInflowVolumeByTokenAmount = previousSnapshot
      ? subtractTwoBigIntArrays(
          snapshot.cumulativeClosedInflowVolumeByTokenAmount,
          previousSnapshot.cumulativeClosedInflowVolumeByTokenAmount
        )
      : snapshot.cumulativeClosedInflowVolumeByTokenAmount;

    snapshot.cumulativeClosedInflowVolumeUSD =
      this.pool.cumulativeClosedInflowVolumeUSD;
    snapshot.hourlyClosedInflowVolumeUSD = previousSnapshot
      ? snapshot.cumulativeClosedInflowVolumeUSD.minus(
          previousSnapshot.cumulativeClosedInflowVolumeUSD
        )
      : snapshot.cumulativeClosedInflowVolumeUSD;

    snapshot.cumulativeOutflowVolumeByTokenUSD =
      this.pool.cumulativeOutflowVolumeByTokenUSD;
    snapshot.hourlyOutflowVolumeByTokenUSD = previousSnapshot
      ? subtractTwoBigDecimalArrays(
          snapshot.cumulativeOutflowVolumeByTokenUSD,
          previousSnapshot.cumulativeOutflowVolumeByTokenUSD
        )
      : snapshot.cumulativeOutflowVolumeByTokenUSD;

    snapshot.cumulativeOutflowVolumeByTokenAmount =
      this.pool.cumulativeOutflowVolumeByTokenAmount;
    snapshot.hourlyOutflowVolumeByTokenAmount = previousSnapshot
      ? subtractTwoBigIntArrays(
          snapshot.cumulativeOutflowVolumeByTokenAmount,
          previousSnapshot.cumulativeOutflowVolumeByTokenAmount
        )
      : snapshot.cumulativeOutflowVolumeByTokenAmount;

    snapshot.cumulativeOutflowVolumeUSD = this.pool.cumulativeOutflowVolumeUSD;
    snapshot.hourlyOutflowVolumeUSD = previousSnapshot
      ? snapshot.cumulativeOutflowVolumeUSD.minus(
          previousSnapshot.cumulativeOutflowVolumeUSD
        )
      : snapshot.cumulativeOutflowVolumeUSD;

    snapshot.inputTokenBalances = this.pool.inputTokenBalances;
    snapshot.inputTokenWeights = this.pool.inputTokenWeights;
    snapshot.outputTokenSupply = this.pool.outputTokenSupply;
    snapshot.outputTokenPriceUSD = this.pool.outputTokenPriceUSD;
    snapshot.stakedOutputTokenAmount = this.pool.stakedOutputTokenAmount;
    snapshot.rewardTokenEmissionsAmount = this.pool.rewardTokenEmissionsAmount;
    snapshot.rewardTokenEmissionsUSD = this.pool.rewardTokenEmissionsUSD;

    snapshot.save();
  }

  private takeDailySnapshot(day: i32): void {
    const snapshot = new LiquidityPoolDailySnapshot(
      this.pool.id.concatI32(day)
    );
    const previousSnapshot = LiquidityPoolDailySnapshot.load(
      this.pool.id.concatI32(this.pool._lastSnapshotDayID!.toI32())
    );

    snapshot.days = day;
    snapshot.pool = this.pool.id;
    snapshot.protocol = this.pool.protocol;

    snapshot.totalValueLockedUSD = this.pool.totalValueLockedUSD;

    snapshot.cumulativeSupplySideRevenueUSD =
      this.pool.cumulativeSupplySideRevenueUSD;
    snapshot.dailySupplySideRevenueUSD = previousSnapshot
      ? snapshot.cumulativeSupplySideRevenueUSD.minus(
          previousSnapshot.cumulativeSupplySideRevenueUSD
        )
      : snapshot.cumulativeSupplySideRevenueUSD;

    snapshot.cumulativeProtocolSideRevenueUSD =
      this.pool.cumulativeProtocolSideRevenueUSD;
    snapshot.dailyProtocolSideRevenueUSD = previousSnapshot
      ? snapshot.cumulativeProtocolSideRevenueUSD.minus(
          previousSnapshot.cumulativeProtocolSideRevenueUSD
        )
      : snapshot.cumulativeProtocolSideRevenueUSD;

    snapshot.cumulativeTotalRevenueUSD = this.pool.cumulativeTotalRevenueUSD;
    snapshot.dailyTotalRevenueUSD = previousSnapshot
      ? snapshot.cumulativeTotalRevenueUSD.minus(
          previousSnapshot.cumulativeTotalRevenueUSD
        )
      : snapshot.cumulativeTotalRevenueUSD;

    snapshot.dailyFundingrate = this.pool.fundingrate;

    snapshot.dailyLongOpenInterestUSD = this.pool.longOpenInterestUSD;
    snapshot.dailyShortOpenInterestUSD = this.pool.shortOpenInterestUSD;
    snapshot.dailyTotalOpenInterestUSD = this.pool.totalOpenInterestUSD;

    snapshot.cumulativeEntryPremiumUSD = this.pool.cumulativeEntryPremiumUSD;
    snapshot.dailyEntryPremiumUSD = previousSnapshot
      ? snapshot.cumulativeEntryPremiumUSD.minus(
          previousSnapshot.cumulativeEntryPremiumUSD
        )
      : snapshot.cumulativeEntryPremiumUSD;

    snapshot.cumulativeExitPremiumUSD = this.pool.cumulativeExitPremiumUSD;
    snapshot.dailyExitPremiumUSD = previousSnapshot
      ? snapshot.cumulativeExitPremiumUSD.minus(
          previousSnapshot.cumulativeExitPremiumUSD
        )
      : snapshot.cumulativeExitPremiumUSD;

    snapshot.cumulativeTotalPremiumUSD = this.pool.cumulativeTotalPremiumUSD;
    snapshot.dailyTotalPremiumUSD = previousSnapshot
      ? snapshot.cumulativeTotalPremiumUSD.minus(
          previousSnapshot.cumulativeTotalPremiumUSD
        )
      : snapshot.cumulativeTotalPremiumUSD;

    snapshot.cumulativeDepositPremiumUSD =
      this.pool.cumulativeDepositPremiumUSD;
    snapshot.dailyDepositPremiumUSD = previousSnapshot
      ? snapshot.cumulativeDepositPremiumUSD.minus(
          previousSnapshot.cumulativeDepositPremiumUSD
        )
      : snapshot.cumulativeDepositPremiumUSD;

    snapshot.cumulativeWithdrawPremiumUSD =
      this.pool.cumulativeWithdrawPremiumUSD;
    snapshot.dailyWithdrawPremiumUSD = previousSnapshot
      ? snapshot.cumulativeWithdrawPremiumUSD.minus(
          previousSnapshot.cumulativeWithdrawPremiumUSD
        )
      : snapshot.cumulativeWithdrawPremiumUSD;

    snapshot.cumulativeTotalLiquidityPremiumUSD =
      this.pool.cumulativeTotalLiquidityPremiumUSD;
    snapshot.dailyTotalLiquidityPremiumUSD = previousSnapshot
      ? snapshot.cumulativeTotalLiquidityPremiumUSD.minus(
          previousSnapshot.cumulativeTotalLiquidityPremiumUSD
        )
      : snapshot.cumulativeTotalLiquidityPremiumUSD;

    snapshot.cumulativeVolumeByTokenUSD = this.pool.cumulativeVolumeByTokenUSD;
    snapshot.dailyVolumeByTokenUSD = previousSnapshot
      ? subtractTwoBigDecimalArrays(
          snapshot.cumulativeVolumeByTokenUSD,
          previousSnapshot.cumulativeVolumeByTokenUSD
        )
      : snapshot.cumulativeVolumeByTokenUSD;

    snapshot.cumulativeVolumeByTokenAmount =
      this.pool.cumulativeVolumeByTokenAmount;
    snapshot.dailyVolumeByTokenAmount = previousSnapshot
      ? subtractTwoBigIntArrays(
          snapshot.cumulativeVolumeByTokenAmount,
          previousSnapshot.cumulativeVolumeByTokenAmount
        )
      : snapshot.cumulativeVolumeByTokenAmount;

    snapshot.cumulativeVolumeUSD = this.pool.cumulativeVolumeUSD;
    snapshot.dailyVolumeUSD = previousSnapshot
      ? snapshot.cumulativeVolumeUSD.minus(previousSnapshot.cumulativeVolumeUSD)
      : snapshot.cumulativeVolumeUSD;

    snapshot.cumulativeInflowVolumeByTokenUSD =
      this.pool.cumulativeInflowVolumeByTokenUSD;
    snapshot.dailyInflowVolumeByTokenUSD = previousSnapshot
      ? subtractTwoBigDecimalArrays(
          snapshot.cumulativeInflowVolumeByTokenUSD,
          previousSnapshot.cumulativeInflowVolumeByTokenUSD
        )
      : snapshot.cumulativeInflowVolumeByTokenUSD;

    snapshot.cumulativeInflowVolumeByTokenAmount =
      this.pool.cumulativeInflowVolumeByTokenAmount;
    snapshot.dailyInflowVolumeByTokenAmount = previousSnapshot
      ? subtractTwoBigIntArrays(
          snapshot.cumulativeInflowVolumeByTokenAmount,
          previousSnapshot.cumulativeInflowVolumeByTokenAmount
        )
      : snapshot.cumulativeInflowVolumeByTokenAmount;

    snapshot.cumulativeInflowVolumeUSD = this.pool.cumulativeInflowVolumeUSD;
    snapshot.dailyInflowVolumeUSD = previousSnapshot
      ? snapshot.cumulativeInflowVolumeUSD.minus(
          previousSnapshot.cumulativeInflowVolumeUSD
        )
      : snapshot.cumulativeInflowVolumeUSD;

    snapshot.cumulativeClosedInflowVolumeByTokenUSD =
      this.pool.cumulativeClosedInflowVolumeByTokenUSD;
    snapshot.dailyClosedInflowVolumeByTokenUSD = previousSnapshot
      ? subtractTwoBigDecimalArrays(
          snapshot.cumulativeClosedInflowVolumeByTokenUSD,
          previousSnapshot.cumulativeClosedInflowVolumeByTokenUSD
        )
      : snapshot.cumulativeClosedInflowVolumeByTokenUSD;

    snapshot.cumulativeClosedInflowVolumeByTokenAmount =
      this.pool.cumulativeInflowVolumeByTokenAmount;
    snapshot.dailyClosedInflowVolumeByTokenAmount = previousSnapshot
      ? subtractTwoBigIntArrays(
          snapshot.cumulativeClosedInflowVolumeByTokenAmount,
          previousSnapshot.cumulativeClosedInflowVolumeByTokenAmount
        )
      : snapshot.cumulativeClosedInflowVolumeByTokenAmount;

    snapshot.cumulativeClosedInflowVolumeUSD =
      this.pool.cumulativeClosedInflowVolumeUSD;
    snapshot.dailyClosedInflowVolumeUSD = previousSnapshot
      ? snapshot.cumulativeClosedInflowVolumeUSD.minus(
          previousSnapshot.cumulativeClosedInflowVolumeUSD
        )
      : snapshot.cumulativeClosedInflowVolumeUSD;

    snapshot.cumulativeOutflowVolumeByTokenUSD =
      this.pool.cumulativeOutflowVolumeByTokenUSD;
    snapshot.dailyOutflowVolumeByTokenUSD = previousSnapshot
      ? subtractTwoBigDecimalArrays(
          snapshot.cumulativeOutflowVolumeByTokenUSD,
          previousSnapshot.cumulativeOutflowVolumeByTokenUSD
        )
      : snapshot.cumulativeOutflowVolumeByTokenUSD;

    snapshot.cumulativeOutflowVolumeByTokenAmount =
      this.pool.cumulativeOutflowVolumeByTokenAmount;
    snapshot.dailyOutflowVolumeByTokenAmount = previousSnapshot
      ? subtractTwoBigIntArrays(
          snapshot.cumulativeOutflowVolumeByTokenAmount,
          previousSnapshot.cumulativeOutflowVolumeByTokenAmount
        )
      : snapshot.cumulativeOutflowVolumeByTokenAmount;

    snapshot.cumulativeOutflowVolumeUSD = this.pool.cumulativeOutflowVolumeUSD;
    snapshot.dailyOutflowVolumeUSD = previousSnapshot
      ? snapshot.cumulativeOutflowVolumeUSD.minus(
          previousSnapshot.cumulativeOutflowVolumeUSD
        )
      : snapshot.cumulativeOutflowVolumeUSD;

    snapshot.cumulativeUniqueDepositors = this.pool.cumulativeUniqueDepositors;
    snapshot.dailyActiveDepositors = previousSnapshot
      ? snapshot.cumulativeUniqueDepositors -
        previousSnapshot.cumulativeUniqueDepositors
      : snapshot.cumulativeUniqueDepositors;

    snapshot.cumulativeUniqueBorrowers = this.pool.cumulativeUniqueBorrowers;
    snapshot.dailyActiveBorrowers = previousSnapshot
      ? snapshot.cumulativeUniqueBorrowers -
        previousSnapshot.cumulativeUniqueBorrowers
      : snapshot.cumulativeUniqueBorrowers;

    snapshot.cumulativeUniqueLiquidators =
      this.pool.cumulativeUniqueLiquidators;
    snapshot.dailyActiveLiquidators = previousSnapshot
      ? snapshot.cumulativeUniqueLiquidators -
        previousSnapshot.cumulativeUniqueLiquidators
      : snapshot.cumulativeUniqueLiquidators;

    snapshot.cumulativeUniqueLiquidatees =
      this.pool.cumulativeUniqueLiquidatees;
    snapshot.dailyActiveLiquidatees = previousSnapshot
      ? snapshot.cumulativeUniqueLiquidatees -
        previousSnapshot.cumulativeUniqueLiquidatees
      : snapshot.cumulativeUniqueLiquidatees;

    snapshot.longPositionCount = this.pool.longPositionCount;
    snapshot.dailyLongPositionCount = previousSnapshot
      ? max(snapshot.longPositionCount - previousSnapshot.longPositionCount, 0)
      : snapshot.longPositionCount;

    snapshot.shortPositionCount = this.pool.shortPositionCount;
    snapshot.dailyShortPositionCount = previousSnapshot
      ? max(
          snapshot.shortPositionCount - previousSnapshot.shortPositionCount,
          0
        )
      : snapshot.shortPositionCount;

    snapshot.openPositionCount = this.pool.openPositionCount;
    snapshot.dailyOpenPositionCount = previousSnapshot
      ? max(snapshot.openPositionCount - previousSnapshot.openPositionCount, 0)
      : snapshot.openPositionCount;

    snapshot.closedPositionCount = this.pool.closedPositionCount;
    snapshot.dailyClosedPositionCount = previousSnapshot
      ? snapshot.closedPositionCount - previousSnapshot.closedPositionCount
      : snapshot.closedPositionCount;

    snapshot.cumulativePositionCount = this.pool.cumulativePositionCount;
    snapshot.dailyCumulativePositionCount = previousSnapshot
      ? snapshot.cumulativePositionCount -
        previousSnapshot.cumulativePositionCount
      : snapshot.cumulativePositionCount;

    snapshot.inputTokenBalances = this.pool.inputTokenBalances;
    snapshot.inputTokenWeights = this.pool.inputTokenWeights;
    snapshot.outputTokenSupply = this.pool.outputTokenSupply;
    snapshot.outputTokenPriceUSD = this.pool.outputTokenPriceUSD;
    snapshot.stakedOutputTokenAmount = this.pool.stakedOutputTokenAmount;
    snapshot.rewardTokenEmissionsAmount = this.pool.rewardTokenEmissionsAmount;
    snapshot.rewardTokenEmissionsUSD = this.pool.rewardTokenEmissionsUSD;

    snapshot.save();
  }
}
