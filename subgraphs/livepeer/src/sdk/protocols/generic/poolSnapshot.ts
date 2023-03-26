import { BigInt, log } from "@graphprotocol/graph-ts";
import {
  Pool as PoolSchema,
  PoolDailySnapshot,
  PoolHourlySnapshot,
} from "../../../../generated/schema";
import { SECONDS_PER_DAY, SECONDS_PER_HOUR } from "../../util/constants";
import { CustomEventType, getUnixDays, getUnixHours } from "../../util/events";

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
    if (!this.pool.lastUpdateTimestamp) return;

    const snapshotDayID =
      this.pool.lastUpdateTimestamp!.toI32() / SECONDS_PER_DAY;
    const snapshotHourID =
      this.pool.lastUpdateTimestamp!.toI32() / SECONDS_PER_HOUR;
    log.warning(
      "[takePoolSnapshots] snapshotDayId {} snapshotHourId {} dayId {} hourID {}",
      [
        snapshotDayID.toString(),
        snapshotHourID.toString(),
        this.dayID.toString(),
        this.hourID.toString(),
      ]
    );
    if (snapshotDayID != this.dayID) {
      this.pool.lastSnapshotDayID = BigInt.fromI32(snapshotDayID);
      this.takeDailySnapshot(snapshotDayID);
      this.pool.save();
    }

    if (snapshotHourID != this.hourID) {
      this.pool.lastSnapshotHourID = BigInt.fromI32(snapshotHourID);
      this.takeHourlySnapshot(snapshotHourID);
      this.pool.save();
    }
  }

  private isInitialized(): boolean {
    return this.pool.lastSnapshotDayID && this.pool.lastSnapshotHourID
      ? true
      : false;
  }

  private takeHourlySnapshot(hour: i32): void {
    const snapshot = new PoolHourlySnapshot(this.pool.id.concatI32(hour));
    const previousSnapshot = PoolHourlySnapshot.load(
      this.pool.id.concatI32(this.pool.lastSnapshotHourID!.toI32())
    );

    snapshot.hours = hour;
    snapshot.protocol = this.pool.protocol;
    snapshot.pool = this.pool.id;
    snapshot.timestamp = this.event.block.timestamp;
    snapshot.blockNumber = this.event.block.number;

    // tvl and balances
    snapshot.totalValueLockedUSD = this.pool.totalValueLockedUSD;
    snapshot.inputTokenBalances = this.pool.inputTokenBalances;
    snapshot.rewardTokenEmissionsAmount = this.pool.rewardTokenEmissionsAmount;
    snapshot.rewardTokenEmissionsUSD = this.pool.rewardTokenEmissionsUSD;

    // revenues
    snapshot.cumulativeSupplySideRevenueUSD =
      this.pool.cumulativeSupplySideRevenueUSD;
    snapshot.cumulativeProtocolSideRevenueUSD =
      this.pool.cumulativeProtocolSideRevenueUSD;
    snapshot.cumulativeTotalRevenueUSD = this.pool.cumulativeTotalRevenueUSD;

    // deltas
    let supplySideRevenueDelta = snapshot.cumulativeSupplySideRevenueUSD;
    let protocolSideRevenueDelta = snapshot.cumulativeProtocolSideRevenueUSD;
    let totalRevenueDelta = snapshot.cumulativeTotalRevenueUSD;

    if (previousSnapshot) {
      supplySideRevenueDelta = snapshot.cumulativeSupplySideRevenueUSD.minus(
        previousSnapshot.cumulativeSupplySideRevenueUSD
      );
      protocolSideRevenueDelta =
        snapshot.cumulativeProtocolSideRevenueUSD.minus(
          previousSnapshot.cumulativeProtocolSideRevenueUSD
        );
      totalRevenueDelta = snapshot.cumulativeTotalRevenueUSD.minus(
        previousSnapshot.cumulativeTotalRevenueUSD
      );
    }
    snapshot.hourlySupplySideRevenueUSD = supplySideRevenueDelta;
    snapshot.hourlyProtocolSideRevenueUSD = protocolSideRevenueDelta;
    snapshot.hourlyTotalRevenueUSD = totalRevenueDelta;

    snapshot.save();
    log.warning("[takeHourlySnapshots] Stops on isinitialized {}", [
      this.pool.id.concatI32(this.pool.lastSnapshotHourID!.toI32()).toString(),
    ]);
  }

  private takeDailySnapshot(day: i32): void {
    const snapshot = new PoolDailySnapshot(this.pool.id.concatI32(day));
    const previousSnapshot = PoolDailySnapshot.load(
      this.pool.id.concatI32(this.pool.lastSnapshotDayID!.toI32())
    );

    snapshot.day = day;
    snapshot.protocol = this.pool.protocol;
    snapshot.pool = this.pool.id;
    snapshot.timestamp = this.event.block.timestamp;
    snapshot.blockNumber = this.event.block.number;

    // tvl and balances
    snapshot.totalValueLockedUSD = this.pool.totalValueLockedUSD;
    snapshot.inputTokenBalances = this.pool.inputTokenBalances;
    snapshot.rewardTokenEmissionsAmount = this.pool.rewardTokenEmissionsAmount;
    snapshot.rewardTokenEmissionsUSD = this.pool.rewardTokenEmissionsUSD;

    // revenues
    snapshot.cumulativeSupplySideRevenueUSD =
      this.pool.cumulativeSupplySideRevenueUSD;
    snapshot.cumulativeProtocolSideRevenueUSD =
      this.pool.cumulativeProtocolSideRevenueUSD;
    snapshot.cumulativeTotalRevenueUSD = this.pool.cumulativeTotalRevenueUSD;

    // deltas
    let supplySideRevenueDelta = snapshot.cumulativeSupplySideRevenueUSD;
    let protocolSideRevenueDelta = snapshot.cumulativeProtocolSideRevenueUSD;
    let totalRevenueDelta = snapshot.cumulativeTotalRevenueUSD;

    if (previousSnapshot) {
      supplySideRevenueDelta = snapshot.cumulativeSupplySideRevenueUSD.minus(
        previousSnapshot.cumulativeSupplySideRevenueUSD
      );
      protocolSideRevenueDelta =
        snapshot.cumulativeProtocolSideRevenueUSD.minus(
          previousSnapshot.cumulativeProtocolSideRevenueUSD
        );
      totalRevenueDelta = snapshot.cumulativeTotalRevenueUSD.minus(
        previousSnapshot.cumulativeTotalRevenueUSD
      );
    }
    snapshot.dailySupplySideRevenueUSD = supplySideRevenueDelta;
    snapshot.dailyProtocolSideRevenueUSD = protocolSideRevenueDelta;
    snapshot.dailyTotalRevenueUSD = totalRevenueDelta;

    snapshot.save();
    log.warning("[takeDailySnapshots] Stops on isinitialized {}", [
      this.pool.id.concatI32(this.pool.lastSnapshotDayID!.toI32()).toString(),
    ]);
  }
}
