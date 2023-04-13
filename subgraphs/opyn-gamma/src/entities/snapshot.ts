import { Bytes, ethereum } from "@graphprotocol/graph-ts";
import {
  FinancialsDailySnapshot,
  LiquidityPool,
  LiquidityPoolDailySnapshot,
  LiquidityPoolHourlySnapshot,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  _ProtocolSnapshotHelper,
} from "../../generated/schema";
import {
  BIGINT_ZERO,
  INT_ZERO,
  SECONDS_PER_DAY,
  SECONDS_PER_DAY_BI,
  SECONDS_PER_HOUR,
  SECONDS_PER_HOUR_BI,
  SnapshotHelperID,
} from "../common/constants";
import { getOrCreateOpynProtocol } from "./protocol";
import { getOrCreateActivityHelper } from "./usage";

export function takeSnapshots(
  event: ethereum.Event,
  pool: LiquidityPool
): void {
  const helper = getOrCreateSnapshotHelper();
  if (
    pool._lastDailySnapshotTimestamp
      .plus(SECONDS_PER_DAY_BI)
      .lt(event.block.timestamp)
  ) {
    if (pool._lastDailySnapshotTimestamp.equals(BIGINT_ZERO)) {
      // Set pool creation time data here
      pool.createdBlockNumber = event.block.number;
      pool.createdTimestamp = event.block.timestamp;
      pool.save();
    }
    takePoolDailySnapshot(event, pool);
  }
  if (
    pool._lastHourlySnapshotTimestamp
      .plus(SECONDS_PER_HOUR_BI)
      .lt(event.block.timestamp)
  ) {
    takePoolHourlySnapshot(event, pool);
  }
  if (
    helper.lastDailyFinancialsTimestamp
      .plus(SECONDS_PER_DAY_BI)
      .lt(event.block.timestamp)
  ) {
    takeFinancialsDailySnapshot(event, helper);
  }
  if (
    helper.lastDailyUsageTimestamp
      .plus(SECONDS_PER_DAY_BI)
      .lt(event.block.timestamp)
  ) {
    takeUsageMetricsDailySnapshot(event, helper);
  }
  if (
    helper.lastHourlyUsageTimestamp
      .plus(SECONDS_PER_HOUR_BI)
      .lt(event.block.timestamp)
  ) {
    takeUsageMetricsHourlySnapshot(event, helper);
  }
}

function takePoolDailySnapshot(
  event: ethereum.Event,
  pool: LiquidityPool
): void {
  const days = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const id = pool.id.concatI32(days);

  const snapshot = new LiquidityPoolDailySnapshot(id);
  const protocol = getOrCreateOpynProtocol();
  snapshot.days = days;
  snapshot.protocol = protocol.id;
  snapshot.pool = pool.id;

  snapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  snapshot.openInterestUSD = pool.openInterestUSD;
  snapshot.inputTokenBalances = pool.inputTokenBalances;
  snapshot.inputTokenWeights = pool.inputTokenWeights;
  snapshot.outputTokenSupply = pool.outputTokenSupply;
  snapshot.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  snapshot.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;
  snapshot.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  snapshot.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;

  snapshot.openPositionCount = pool.openPositionCount;
  snapshot.closedPositionCount = pool.closedPositionCount;

  snapshot.cumulativeSupplySideRevenueUSD = snapshot.dailySupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  snapshot.cumulativeProtocolSideRevenueUSD =
    snapshot.dailyProtocolSideRevenueUSD =
      pool.cumulativeProtocolSideRevenueUSD;
  snapshot.cumulativeTotalRevenueUSD = snapshot.dailyTotalRevenueUSD =
    pool.cumulativeTotalRevenueUSD;
  snapshot.cumulativeEntryPremiumUSD = snapshot.dailyEntryPremiumUSD =
    pool.cumulativeEntryPremiumUSD;
  snapshot.cumulativeExitPremiumUSD = snapshot.dailyExitPremiumUSD =
    pool.cumulativeExitPremiumUSD;
  snapshot.cumulativeTotalPremiumUSD = snapshot.dailyTotalPremiumUSD =
    pool.cumulativeTotalPremiumUSD;
  snapshot.cumulativeDepositPremiumUSD = snapshot.dailyDepositPremiumUSD =
    pool.cumulativeDepositPremiumUSD;
  snapshot.cumulativeWithdrawPremiumUSD = snapshot.dailyWithdrawPremiumUSD =
    pool.cumulativeWithdrawPremiumUSD;
  snapshot.cumulativeTotalLiquidityPremiumUSD =
    snapshot.dailyTotalLiquidityPremiumUSD =
      pool.cumulativeTotalLiquidityPremiumUSD;

  snapshot.putsMintedCount = snapshot.dailyPutsMintedCount =
    pool.putsMintedCount;
  snapshot.callsMintedCount = snapshot.dailyCallsMintedCount =
    pool.callsMintedCount;
  snapshot.contractsMintedCount = snapshot.dailyContractsMintedCount =
    pool.contractsMintedCount;
  snapshot.contractsTakenCount = snapshot.dailyContractsTakenCount =
    pool.contractsTakenCount;
  snapshot.contractsExpiredCount = snapshot.dailyContractsExpiredCount =
    pool.contractsExpiredCount;
  snapshot.contractsExercisedCount = snapshot.dailyContractsExercisedCount =
    pool.contractsExercisedCount;
  snapshot.contractsClosedCount = snapshot.dailyContractsClosedCount =
    pool.contractsClosedCount;

  snapshot.cumulativeVolumeUSD = snapshot.dailyVolumeUSD =
    pool.cumulativeVolumeUSD;
  snapshot.cumulativeVolumeByTokenAmount = snapshot.dailyVolumeByTokenAmount =
    pool.cumulativeVolumeByTokenAmount;
  snapshot.cumulativeVolumeByTokenUSD = snapshot.dailyVolumeByTokenUSD =
    pool.cumulativeVolumeByTokenUSD;

  snapshot.cumulativeDepositedVolumeByTokenAmount =
    snapshot.dailyDepositedVolumeByTokenAmount =
      pool.cumulativeDepositedVolumeByTokenAmount;
  snapshot.cumulativeDepositedVolumeByTokenUSD =
    snapshot.dailyDepositedVolumeByTokenUSD =
      pool.cumulativeDepositedVolumeByTokenUSD;
  snapshot.cumulativeDepositedVolumeUSD = snapshot.dailyDepositedVolumeUSD =
    pool.cumulativeDepositedVolumeUSD;

  snapshot.cumulativeWithdrawVolumeUSD = snapshot.dailyWithdrawVolumeUSD =
    pool.cumulativeWithdrawVolumeUSD;
  snapshot.cumulativeWithdrawVolumeByTokenAmount =
    snapshot.dailyWithdrawVolumeByTokenAmount =
      pool.cumulativeWithdrawVolumeByTokenAmount;
  snapshot.cumulativeWithdrawVolumeByTokenUSD =
    snapshot.dailyWithdrawVolumeByTokenUSD =
      pool.cumulativeWithdrawVolumeByTokenUSD;

  snapshot.cumulativeClosedVolumeUSD = snapshot.dailyClosedVolumeUSD =
    pool.cumulativeClosedVolumeUSD;
  snapshot.cumulativeExerciseVolumeUSD = snapshot.dailyExerciseVolumeUSD =
    pool.cumulativeExercisedVolumeUSD;

  const prevSnapshotDays =
    pool._lastDailySnapshotTimestamp.toI32() / SECONDS_PER_DAY;
  const prevSnapshot = LiquidityPoolDailySnapshot.load(
    pool.id.concatI32(prevSnapshotDays)
  );
  if (prevSnapshot) {
    snapshot.dailySupplySideRevenueUSD =
      pool.cumulativeSupplySideRevenueUSD.minus(
        prevSnapshot.cumulativeSupplySideRevenueUSD
      );
    snapshot.dailyProtocolSideRevenueUSD =
      pool.cumulativeProtocolSideRevenueUSD.minus(
        prevSnapshot.cumulativeProtocolSideRevenueUSD
      );
    snapshot.dailyTotalRevenueUSD = pool.cumulativeTotalRevenueUSD.minus(
      prevSnapshot.cumulativeTotalRevenueUSD
    );
    snapshot.dailyEntryPremiumUSD = pool.cumulativeEntryPremiumUSD.minus(
      prevSnapshot.cumulativeEntryPremiumUSD
    );
    snapshot.dailyExitPremiumUSD = pool.cumulativeExitPremiumUSD.minus(
      prevSnapshot.cumulativeExitPremiumUSD
    );
    snapshot.dailyTotalPremiumUSD = pool.cumulativeTotalPremiumUSD.minus(
      prevSnapshot.cumulativeTotalPremiumUSD
    );
    snapshot.dailyDepositPremiumUSD = pool.cumulativeDepositPremiumUSD.minus(
      prevSnapshot.cumulativeDepositPremiumUSD
    );
    snapshot.dailyWithdrawPremiumUSD = pool.cumulativeWithdrawPremiumUSD.minus(
      prevSnapshot.cumulativeWithdrawPremiumUSD
    );
    snapshot.dailyTotalLiquidityPremiumUSD =
      pool.cumulativeTotalLiquidityPremiumUSD.minus(
        prevSnapshot.cumulativeTotalLiquidityPremiumUSD
      );

    snapshot.dailyPutsMintedCount =
      pool.putsMintedCount - prevSnapshot.putsMintedCount;
    snapshot.dailyCallsMintedCount =
      pool.callsMintedCount - prevSnapshot.callsMintedCount;
    snapshot.dailyContractsMintedCount =
      pool.contractsMintedCount - prevSnapshot.contractsMintedCount;
    snapshot.dailyContractsTakenCount =
      pool.contractsTakenCount - prevSnapshot.contractsTakenCount;
    snapshot.dailyContractsExpiredCount =
      pool.contractsExpiredCount - prevSnapshot.contractsExpiredCount;
    snapshot.dailyContractsExercisedCount =
      pool.contractsExercisedCount - prevSnapshot.contractsExercisedCount;
    snapshot.dailyContractsClosedCount =
      pool.contractsClosedCount - prevSnapshot.contractsClosedCount;

    snapshot.dailyVolumeUSD = pool.cumulativeVolumeUSD.minus(
      prevSnapshot.cumulativeVolumeUSD
    );
    snapshot.dailyVolumeByTokenAmount = [
      pool.cumulativeVolumeByTokenAmount[0].minus(
        prevSnapshot.cumulativeVolumeByTokenAmount[0]
      ),
    ];
    snapshot.dailyVolumeByTokenUSD = [
      pool.cumulativeVolumeByTokenUSD[0].minus(
        prevSnapshot.cumulativeVolumeByTokenUSD[0]
      ),
    ];
    snapshot.dailyDepositedVolumeByTokenAmount = [
      pool.cumulativeDepositedVolumeByTokenAmount[0].minus(
        prevSnapshot.cumulativeDepositedVolumeByTokenAmount[0]
      ),
    ];
    snapshot.dailyDepositedVolumeByTokenUSD = [
      pool.cumulativeDepositedVolumeByTokenUSD[0].minus(
        prevSnapshot.cumulativeDepositedVolumeByTokenUSD[0]
      ),
    ];
    snapshot.dailyDepositedVolumeUSD = pool.cumulativeDepositedVolumeUSD.minus(
      prevSnapshot.cumulativeDepositedVolumeUSD
    );
    snapshot.dailyWithdrawVolumeUSD = pool.cumulativeWithdrawVolumeUSD.minus(
      prevSnapshot.cumulativeWithdrawVolumeUSD
    );
    snapshot.dailyWithdrawVolumeByTokenAmount = [
      pool.cumulativeWithdrawVolumeByTokenAmount[0].minus(
        prevSnapshot.cumulativeWithdrawVolumeByTokenAmount[0]
      ),
    ];
    snapshot.dailyWithdrawVolumeByTokenUSD = [
      pool.cumulativeWithdrawVolumeByTokenUSD[0].minus(
        prevSnapshot.cumulativeWithdrawVolumeByTokenUSD[0]
      ),
    ];
    snapshot.dailyClosedVolumeUSD = pool.cumulativeClosedVolumeUSD.minus(
      prevSnapshot.cumulativeClosedVolumeUSD
    );
    snapshot.dailyExerciseVolumeUSD = pool.cumulativeExercisedVolumeUSD.minus(
      prevSnapshot.cumulativeExerciseVolumeUSD
    );
  }
  snapshot.save();
  pool._lastDailySnapshotTimestamp = event.block.timestamp;
  pool.save();
}

function takePoolHourlySnapshot(
  event: ethereum.Event,
  pool: LiquidityPool
): void {
  const hours = event.block.timestamp.toI32() / SECONDS_PER_HOUR;
  const id = pool.id.concatI32(hours);

  const snapshot = new LiquidityPoolHourlySnapshot(id);
  const protocol = getOrCreateOpynProtocol();
  snapshot.hours = hours;
  snapshot.protocol = protocol.id;
  snapshot.pool = pool.id;

  snapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  snapshot.openInterestUSD = pool.openInterestUSD;
  snapshot.inputTokenBalances = pool.inputTokenBalances;
  snapshot.inputTokenWeights = pool.inputTokenWeights;
  snapshot.outputTokenSupply = pool.outputTokenSupply;
  snapshot.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  snapshot.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;
  snapshot.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  snapshot.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;

  snapshot.cumulativeSupplySideRevenueUSD =
    snapshot.hourlySupplySideRevenueUSD = pool.cumulativeSupplySideRevenueUSD;
  snapshot.cumulativeProtocolSideRevenueUSD =
    snapshot.hourlyProtocolSideRevenueUSD =
      pool.cumulativeProtocolSideRevenueUSD;
  snapshot.cumulativeTotalRevenueUSD = snapshot.hourlyTotalRevenueUSD =
    pool.cumulativeTotalRevenueUSD;
  snapshot.cumulativeEntryPremiumUSD = snapshot.hourlyEntryPremiumUSD =
    pool.cumulativeEntryPremiumUSD;
  snapshot.cumulativeExitPremiumUSD = snapshot.hourlyExitPremiumUSD =
    pool.cumulativeExitPremiumUSD;
  snapshot.cumulativeTotalPremiumUSD = snapshot.hourlyTotalPremiumUSD =
    pool.cumulativeTotalPremiumUSD;
  snapshot.cumulativeDepositPremiumUSD = snapshot.hourlyDepositPremiumUSD =
    pool.cumulativeDepositPremiumUSD;
  snapshot.cumulativeWithdrawPremiumUSD = snapshot.hourlyWithdrawPremiumUSD =
    pool.cumulativeWithdrawPremiumUSD;
  snapshot.cumulativeTotalLiquidityPremiumUSD =
    snapshot.hourlyTotalLiquidityPremiumUSD =
      pool.cumulativeTotalLiquidityPremiumUSD;

  snapshot.cumulativeVolumeUSD = snapshot.hourlyVolumeUSD =
    pool.cumulativeVolumeUSD;
  snapshot.cumulativeVolumeByTokenAmount = snapshot.hourlyVolumeByTokenAmount =
    pool.cumulativeVolumeByTokenAmount;
  snapshot.cumulativeVolumeByTokenUSD = snapshot.hourlyVolumeByTokenUSD =
    pool.cumulativeVolumeByTokenUSD;

  snapshot.cumulativeDepositVolumeByTokenAmount =
    snapshot.hourlyDepositVolumeByTokenAmount =
      pool.cumulativeDepositedVolumeByTokenAmount;
  snapshot.cumulativeDepositVolumeByTokenUSD =
    snapshot.hourlyDepositVolumeByTokenUSD =
      pool.cumulativeDepositedVolumeByTokenUSD;
  snapshot.cumulativeDepositVolumeUSD = snapshot.hourlyDepositVolumeUSD =
    pool.cumulativeDepositedVolumeUSD;

  snapshot.cumulativeWithdrawVolumeUSD = snapshot.hourlyWithdrawVolumeUSD =
    pool.cumulativeWithdrawVolumeUSD;
  snapshot.cumulativeWithdrawVolumeByTokenAmount =
    snapshot.hourlyWithdrawVolumeByTokenAmount =
      pool.cumulativeWithdrawVolumeByTokenAmount;
  snapshot.cumulativeWithdrawVolumeByTokenUSD =
    snapshot.hourlyWithdrawVolumeByTokenUSD =
      pool.cumulativeWithdrawVolumeByTokenUSD;

  const prevSnapshotHours =
    pool._lastHourlySnapshotTimestamp.toI32() / SECONDS_PER_HOUR;
  const prevSnapshot = LiquidityPoolHourlySnapshot.load(
    pool.id.concatI32(prevSnapshotHours)
  );
  if (prevSnapshot) {
    snapshot.hourlySupplySideRevenueUSD =
      pool.cumulativeSupplySideRevenueUSD.minus(
        prevSnapshot.cumulativeSupplySideRevenueUSD
      );
    snapshot.hourlyProtocolSideRevenueUSD =
      pool.cumulativeProtocolSideRevenueUSD.minus(
        prevSnapshot.cumulativeProtocolSideRevenueUSD
      );
    snapshot.hourlyTotalRevenueUSD = pool.cumulativeTotalRevenueUSD.minus(
      prevSnapshot.cumulativeTotalRevenueUSD
    );
    snapshot.hourlyEntryPremiumUSD = pool.cumulativeEntryPremiumUSD.minus(
      prevSnapshot.cumulativeEntryPremiumUSD
    );
    snapshot.hourlyExitPremiumUSD = pool.cumulativeExitPremiumUSD.minus(
      prevSnapshot.cumulativeExitPremiumUSD
    );
    snapshot.hourlyTotalPremiumUSD = pool.cumulativeTotalPremiumUSD.minus(
      prevSnapshot.cumulativeTotalPremiumUSD
    );
    snapshot.hourlyDepositPremiumUSD = pool.cumulativeDepositPremiumUSD.minus(
      prevSnapshot.cumulativeDepositPremiumUSD
    );
    snapshot.hourlyWithdrawPremiumUSD = pool.cumulativeWithdrawPremiumUSD.minus(
      prevSnapshot.cumulativeWithdrawPremiumUSD
    );
    snapshot.hourlyTotalLiquidityPremiumUSD =
      pool.cumulativeTotalLiquidityPremiumUSD.minus(
        prevSnapshot.cumulativeTotalLiquidityPremiumUSD
      );

    snapshot.hourlyVolumeUSD = pool.cumulativeVolumeUSD.minus(
      prevSnapshot.cumulativeVolumeUSD
    );
    snapshot.hourlyVolumeByTokenAmount = [
      pool.cumulativeVolumeByTokenAmount[0].minus(
        prevSnapshot.cumulativeVolumeByTokenAmount[0]
      ),
    ];
    snapshot.hourlyVolumeByTokenUSD = [
      pool.cumulativeVolumeByTokenUSD[0].minus(
        prevSnapshot.cumulativeVolumeByTokenUSD[0]
      ),
    ];
    snapshot.hourlyDepositVolumeByTokenAmount = [
      pool.cumulativeDepositedVolumeByTokenAmount[0].minus(
        prevSnapshot.cumulativeDepositVolumeByTokenAmount[0]
      ),
    ];
    snapshot.hourlyDepositVolumeByTokenUSD = [
      pool.cumulativeDepositedVolumeByTokenUSD[0].minus(
        prevSnapshot.cumulativeDepositVolumeByTokenUSD[0]
      ),
    ];
    snapshot.hourlyDepositVolumeUSD = pool.cumulativeDepositedVolumeUSD.minus(
      prevSnapshot.cumulativeDepositVolumeUSD
    );
    snapshot.hourlyWithdrawVolumeUSD = pool.cumulativeWithdrawVolumeUSD.minus(
      prevSnapshot.cumulativeWithdrawVolumeUSD
    );
    snapshot.hourlyWithdrawVolumeByTokenAmount = [
      pool.cumulativeWithdrawVolumeByTokenAmount[0].minus(
        prevSnapshot.cumulativeWithdrawVolumeByTokenAmount[0]
      ),
    ];
    snapshot.hourlyWithdrawVolumeByTokenUSD = [
      pool.cumulativeWithdrawVolumeByTokenUSD[0].minus(
        prevSnapshot.cumulativeWithdrawVolumeByTokenUSD[0]
      ),
    ];
  }
  snapshot.save();
  pool._lastHourlySnapshotTimestamp = event.block.timestamp;
  pool.save();
}

function takeFinancialsDailySnapshot(
  event: ethereum.Event,
  helper: _ProtocolSnapshotHelper
): void {
  const protocol = getOrCreateOpynProtocol();
  const days = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const id = Bytes.fromI32(days);
  const snapshot = new FinancialsDailySnapshot(id);
  snapshot.days = days;
  snapshot.protocol = protocol.id;
  snapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  snapshot.openInterestUSD = protocol.openInterestUSD;
  snapshot.openPositionCount = protocol.openPositionCount;
  snapshot.closedPositionCount = protocol.closedPositionCount;
  snapshot.cumulativeVolumeUSD = snapshot.dailyVolumeUSD =
    protocol.cumulativeVolumeUSD;
  snapshot.cumulativeExercisedVolumeUSD = snapshot.dailyExercisedVolumeUSD =
    protocol.cumulativeExercisedVolumeUSD;
  snapshot.cumulativeClosedVolumeUSD = snapshot.dailyClosedVolumeUSD =
    protocol.cumulativeClosedVolumeUSD;
  snapshot.cumulativeSupplySideRevenueUSD = snapshot.dailySupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  snapshot.cumulativeProtocolSideRevenueUSD =
    snapshot.dailyProtocolSideRevenueUSD =
      protocol.cumulativeProtocolSideRevenueUSD;
  snapshot.cumulativeTotalRevenueUSD = snapshot.dailyTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;
  snapshot.cumulativeEntryPremiumUSD = snapshot.dailyEntryPremiumUSD =
    protocol.cumulativeEntryPremiumUSD;
  snapshot.cumulativeExitPremiumUSD = snapshot.dailyExitPremiumUSD =
    protocol.cumulativeExitPremiumUSD;
  snapshot.cumulativeTotalPremiumUSD = snapshot.dailyTotalPremiumUSD =
    protocol.cumulativeTotalPremiumUSD;
  snapshot.cumulativeDepositPremiumUSD = snapshot.dailyDepositPremiumUSD =
    protocol.cumulativeDepositPremiumUSD;
  snapshot.cumulativeWithdrawPremiumUSD = snapshot.dailyWithdrawPremiumUSD =
    protocol.cumulativeWithdrawPremiumUSD;
  snapshot.cumulativeTotalLiquidityPremiumUSD =
    snapshot.dailyTotalLiquidityPremiumUSD =
      protocol.cumulativeTotalLiquidityPremiumUSD;
  snapshot.putsMintedCount = snapshot.dailyPutsMintedCount =
    protocol.putsMintedCount;
  snapshot.callsMintedCount = snapshot.dailyCallsMintedCount =
    protocol.callsMintedCount;
  snapshot.contractsMintedCount = snapshot.dailyContractsMintedCount =
    protocol.contractsMintedCount;
  snapshot.contractsTakenCount = snapshot.dailyContractsTakenCount =
    protocol.contractsTakenCount;
  snapshot.contractsExpiredCount = snapshot.dailyContractsExpiredCount =
    protocol.contractsExpiredCount;
  snapshot.contractsExercisedCount = snapshot.dailyContractsExercisedCount =
    protocol.contractsExercisedCount;
  snapshot.contractsClosedCount = snapshot.dailyContractsClosedCount =
    protocol.contractsClosedCount;
  const prevSnapshot = FinancialsDailySnapshot.load(
    helper.lastDailyFinancialsSnapshot
  );
  if (prevSnapshot) {
    snapshot.dailyVolumeUSD = protocol.cumulativeVolumeUSD.minus(
      prevSnapshot.cumulativeVolumeUSD
    );
    snapshot.dailyExercisedVolumeUSD =
      protocol.cumulativeExercisedVolumeUSD.minus(
        prevSnapshot.cumulativeExercisedVolumeUSD
      );
    snapshot.dailyClosedVolumeUSD = protocol.cumulativeClosedVolumeUSD.minus(
      prevSnapshot.cumulativeClosedVolumeUSD
    );
    snapshot.dailySupplySideRevenueUSD =
      protocol.cumulativeSupplySideRevenueUSD.minus(
        prevSnapshot.cumulativeSupplySideRevenueUSD
      );
    snapshot.dailyProtocolSideRevenueUSD =
      protocol.cumulativeProtocolSideRevenueUSD.minus(
        prevSnapshot.cumulativeProtocolSideRevenueUSD
      );
    snapshot.dailyTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.minus(
      prevSnapshot.cumulativeTotalRevenueUSD
    );
    snapshot.dailyEntryPremiumUSD = protocol.cumulativeEntryPremiumUSD.minus(
      prevSnapshot.cumulativeEntryPremiumUSD
    );
    snapshot.dailyExitPremiumUSD = protocol.cumulativeExitPremiumUSD.minus(
      prevSnapshot.cumulativeExitPremiumUSD
    );
    snapshot.dailyTotalPremiumUSD = protocol.cumulativeTotalPremiumUSD.minus(
      prevSnapshot.cumulativeTotalPremiumUSD
    );
    snapshot.dailyDepositPremiumUSD =
      protocol.cumulativeDepositPremiumUSD.minus(
        prevSnapshot.cumulativeDepositPremiumUSD
      );
    snapshot.dailyWithdrawPremiumUSD =
      protocol.cumulativeWithdrawPremiumUSD.minus(
        prevSnapshot.cumulativeWithdrawPremiumUSD
      );
    snapshot.dailyTotalLiquidityPremiumUSD =
      protocol.cumulativeTotalLiquidityPremiumUSD.minus(
        prevSnapshot.cumulativeTotalLiquidityPremiumUSD
      );

    snapshot.dailyPutsMintedCount =
      protocol.putsMintedCount - prevSnapshot.putsMintedCount;
    snapshot.dailyCallsMintedCount =
      protocol.callsMintedCount - prevSnapshot.callsMintedCount;
    snapshot.dailyContractsMintedCount =
      protocol.contractsMintedCount - prevSnapshot.contractsMintedCount;
    snapshot.dailyContractsTakenCount =
      protocol.contractsTakenCount - prevSnapshot.contractsTakenCount;
    snapshot.dailyContractsExpiredCount =
      protocol.contractsExpiredCount - prevSnapshot.contractsExpiredCount;
    snapshot.dailyContractsExercisedCount =
      protocol.contractsExercisedCount - prevSnapshot.contractsExercisedCount;
    snapshot.dailyContractsClosedCount =
      protocol.contractsClosedCount - prevSnapshot.contractsClosedCount;
  }
  snapshot.save();
  helper.lastDailyFinancialsSnapshot = snapshot.id;
  helper.lastDailyFinancialsTimestamp = event.block.timestamp;
  helper.save();
}

export function takeUsageMetricsDailySnapshot(
  event: ethereum.Event,
  helper: _ProtocolSnapshotHelper
): void {
  const days = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const id = Bytes.fromI32(days);
  const protocol = getOrCreateOpynProtocol();
  const activityHelper = getOrCreateActivityHelper();
  const usageMetrics = new UsageMetricsDailySnapshot(id);
  usageMetrics.days = days;
  usageMetrics.protocol = protocol.id;

  usageMetrics.dailyActiveUsers = activityHelper.dailyActiveUsers;
  usageMetrics.dailyUniqueLP = activityHelper.dailyUniqueLP;
  usageMetrics.dailyUniqueTakers = activityHelper.dailyUniqueTakers;
  usageMetrics.dailyTransactionCount = activityHelper.dailyTransactionCount;
  usageMetrics.dailyDepositCount = activityHelper.dailyDepositCount;
  usageMetrics.dailyWithdrawCount = activityHelper.dailyWithdrawCount;
  usageMetrics.dailySwapCount = INT_ZERO;

  usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetrics.cumulativeUniqueLP = protocol.cumulativeUniqueLP;
  usageMetrics.cumulativeUniqueTakers = protocol.cumulativeUniqueTakers;
  usageMetrics.totalPoolCount = protocol.totalPoolCount;
  usageMetrics.save();

  activityHelper.dailyActiveUsers = INT_ZERO;
  activityHelper.dailyUniqueLP = INT_ZERO;
  activityHelper.dailyUniqueTakers = INT_ZERO;
  activityHelper.dailyTransactionCount = INT_ZERO;
  activityHelper.dailyDepositCount = INT_ZERO;
  activityHelper.dailyWithdrawCount = INT_ZERO;
  activityHelper.save();
  helper.lastDailyUsageSnapshot = usageMetrics.id;
  helper.lastDailyUsageTimestamp = event.block.timestamp;
  helper.save();
}

export function takeUsageMetricsHourlySnapshot(
  event: ethereum.Event,
  helper: _ProtocolSnapshotHelper
): void {
  const hours = event.block.timestamp.toI32() / SECONDS_PER_HOUR;
  const id = Bytes.fromI32(hours);
  const protocol = getOrCreateOpynProtocol();
  const activityHelper = getOrCreateActivityHelper();
  const usageMetrics = new UsageMetricsHourlySnapshot(id);
  usageMetrics.hours = hours;
  usageMetrics.protocol = protocol.id;

  usageMetrics.hourlyActiveUsers = activityHelper.hourlyActiveUsers;
  usageMetrics.hourlyTransactionCount = activityHelper.hourlyTransactionCount;
  usageMetrics.hourlyDepositCount = activityHelper.hourlyDepositCount;
  usageMetrics.hourlyWithdrawCount = activityHelper.hourlyWithdrawCount;
  usageMetrics.hourlySwapCount = INT_ZERO;

  usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetrics.cumulativeUniqueLP = protocol.cumulativeUniqueLP;
  usageMetrics.cumulativeUniqueTakers = protocol.cumulativeUniqueTakers;
  usageMetrics.save();

  activityHelper.hourlyActiveUsers = INT_ZERO;
  activityHelper.hourlyUniqueLP = INT_ZERO;
  activityHelper.hourlyUniqueTakers = INT_ZERO;
  activityHelper.hourlyTransactionCount = INT_ZERO;
  activityHelper.hourlyDepositCount = INT_ZERO;
  activityHelper.hourlyWithdrawCount = INT_ZERO;
  activityHelper.save();
  helper.lastHourlyUsageSnapshot = usageMetrics.id;
  helper.lastHourlyUsageTimestamp = event.block.timestamp;
  helper.save();
}

function getOrCreateSnapshotHelper(): _ProtocolSnapshotHelper {
  let snapshotHelper = _ProtocolSnapshotHelper.load(SnapshotHelperID);
  if (!snapshotHelper) {
    snapshotHelper = new _ProtocolSnapshotHelper(SnapshotHelperID);
    snapshotHelper.lastDailyFinancialsTimestamp = BIGINT_ZERO;
    snapshotHelper.lastDailyUsageTimestamp = BIGINT_ZERO;
    snapshotHelper.lastHourlyUsageTimestamp = BIGINT_ZERO;
    snapshotHelper.lastDailyFinancialsSnapshot = Bytes.fromI32(0);
    snapshotHelper.lastDailyUsageSnapshot = Bytes.fromI32(0);
    snapshotHelper.lastHourlyUsageSnapshot = Bytes.fromI32(0);
  }
  return snapshotHelper;
}
