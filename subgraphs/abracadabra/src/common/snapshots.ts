import { BigInt, ethereum } from "@graphprotocol/graph-ts";

import {
  ActivityInterval,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
} from "./constants";
import {
  getMarket,
  getOrCreateActivityHelper,
  getOrCreateLendingProtocol,
} from "./getters";
import { getSnapshotRates } from "./utils/utils";

import {
  FinancialsDailySnapshot,
  LendingProtocol,
  Market,
  MarketDailySnapshot,
  MarketHourlySnapshot,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
} from "../../generated/schema";

export function takeProtocolSnapshots(event: ethereum.Event): void {
  const protocol = getOrCreateLendingProtocol();
  if (
    protocol._lastDailySnapshotTimestamp
      .plus(BigInt.fromI32(SECONDS_PER_DAY))
      .lt(event.block.timestamp)
  ) {
    const dayID = event.block.timestamp.toI64() / SECONDS_PER_DAY;
    takeUsageMetricsDailySnapshot(protocol, dayID, event);
    takeFinancialsDailySnapshot(protocol, dayID, event);

    protocol._lastDailySnapshotTimestamp = event.block.timestamp;
    protocol.save();
  }
  if (
    protocol._lastHourlySnapshotTimestamp
      .plus(BigInt.fromI32(SECONDS_PER_HOUR))
      .lt(event.block.timestamp)
  ) {
    const hourID = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
    takeUsageMetricsHourlySnapshot(protocol, hourID, event);

    protocol._lastHourlySnapshotTimestamp = event.block.timestamp;
    protocol.save();
  }
}

function takeFinancialsDailySnapshot(
  protocol: LendingProtocol,
  id: i64,
  event: ethereum.Event
): void {
  const previousSnapshotID =
    protocol._lastDailySnapshotTimestamp!.toI64() / SECONDS_PER_DAY;
  const previousSnapshot = FinancialsDailySnapshot.load(
    previousSnapshotID.toString()
  );
  const snapshot = new FinancialsDailySnapshot(id.toString());
  snapshot.protocol = protocol.id;
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;
  snapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  snapshot.mintedTokenSupplies = protocol.mintedTokenSupplies;
  snapshot.protocolControlledValueUSD = protocol.protocolControlledValueUSD;

  // Revenue //
  snapshot.dailySupplySideRevenueUSD = previousSnapshot
    ? protocol.cumulativeSupplySideRevenueUSD.minus(
        previousSnapshot.cumulativeSupplySideRevenueUSD
      )
    : protocol.cumulativeSupplySideRevenueUSD;
  snapshot.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  snapshot.dailyProtocolSideRevenueUSD = previousSnapshot
    ? protocol.cumulativeProtocolSideRevenueUSD.minus(
        previousSnapshot.cumulativeProtocolSideRevenueUSD
      )
    : protocol.cumulativeProtocolSideRevenueUSD;
  snapshot.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  snapshot.dailyTotalRevenueUSD = previousSnapshot
    ? protocol.cumulativeTotalRevenueUSD.minus(
        previousSnapshot.cumulativeTotalRevenueUSD
      )
    : protocol.cumulativeTotalRevenueUSD;
  snapshot.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;

  // Lending Activities //
  snapshot.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
  snapshot.dailyDepositUSD = previousSnapshot
    ? protocol.cumulativeDepositUSD.minus(previousSnapshot.cumulativeDepositUSD)
    : protocol.cumulativeDepositUSD;
  snapshot.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
  snapshot.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
  snapshot.dailyBorrowUSD = previousSnapshot
    ? protocol.cumulativeBorrowUSD.minus(previousSnapshot.cumulativeBorrowUSD)
    : protocol.cumulativeBorrowUSD;
  snapshot.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
  snapshot.dailyLiquidateUSD = previousSnapshot
    ? protocol.cumulativeLiquidateUSD.minus(
        previousSnapshot.cumulativeLiquidateUSD
      )
    : protocol.cumulativeLiquidateUSD;
  snapshot.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;
  snapshot.dailyWithdrawUSD = previousSnapshot
    ? protocol.cumulativeWithdrawUSD.minus(
        previousSnapshot.cumulativeWithdrawUSD
      )
    : protocol.cumulativeWithdrawUSD;
  snapshot.cumulativeWithdrawUSD = protocol.cumulativeWithdrawUSD;
  snapshot.dailyRepayUSD = previousSnapshot
    ? protocol.cumulativeRepayUSD.minus(previousSnapshot.cumulativeRepayUSD)
    : protocol.cumulativeRepayUSD;
  snapshot.cumulativeRepayUSD = protocol.cumulativeRepayUSD;

  snapshot.save();
}

function takeUsageMetricsHourlySnapshot(
  protocol: LendingProtocol,
  id: i64,
  event: ethereum.Event
): void {
  const activity = getOrCreateActivityHelper(
    ActivityInterval.HOURLY.concat("-").concat(id.toString())
  );
  const snapshot = new UsageMetricsHourlySnapshot(id.toString());
  snapshot.protocol = protocol.id;
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;

  snapshot.hourlyActiveUsers = activity.activeUsers;
  snapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  snapshot.hourlyTransactionCount = activity.transactionCount;
  snapshot.hourlyDepositCount = activity.depositCount;
  snapshot.hourlyBorrowCount = activity.borrowCount;
  snapshot.hourlyLiquidateCount = activity.liquidateCount;
  snapshot.hourlyWithdrawCount = activity.withdrawCount;
  snapshot.hourlyRepayCount = activity.repayCount;

  snapshot.save();
}

function takeUsageMetricsDailySnapshot(
  protocol: LendingProtocol,
  id: i64,
  event: ethereum.Event
): void {
  const activity = getOrCreateActivityHelper(
    ActivityInterval.DAILY.concat("-").concat(id.toString())
  );
  const snapshot = new UsageMetricsDailySnapshot(id.toString());
  snapshot.protocol = protocol.id;
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;

  snapshot.dailyActiveUsers = activity.activeUsers;
  snapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  snapshot.dailyActiveDepositors = activity.activeDepositors;
  snapshot.cumulativeUniqueDepositors = protocol.cumulativeUniqueDepositors;
  snapshot.dailyActiveBorrowers = activity.activeBorrowers;
  snapshot.cumulativeUniqueBorrowers = protocol.cumulativeUniqueBorrowers;
  snapshot.dailyActiveLiquidators = activity.activeLiquidators;
  snapshot.cumulativeUniqueLiquidators = protocol.cumulativeUniqueLiquidators;
  snapshot.dailyActiveLiquidatees = activity.activeLiquidatees;
  snapshot.cumulativeUniqueLiquidatees = protocol.cumulativeUniqueLiquidatees;

  snapshot.dailyTransactionCount = activity.transactionCount;
  snapshot.dailyDepositCount = activity.depositCount;
  snapshot.dailyBorrowCount = activity.borrowCount;
  snapshot.dailyLiquidateCount = activity.liquidateCount;
  snapshot.dailyWithdrawCount = activity.withdrawCount;
  snapshot.dailyRepayCount = activity.repayCount;

  snapshot.totalPoolCount = protocol.totalPoolCount;

  snapshot.save();
}

export function takeMarketSnapshots(
  marketId: string,
  event: ethereum.Event
): void {
  const market = getMarket(marketId);
  if (!market) {
    return;
  }

  if (
    market._lastDailySnapshotTimestamp
      .plus(BigInt.fromI32(SECONDS_PER_DAY))
      .lt(event.block.timestamp)
  ) {
    const dayID = event.block.timestamp.toI64() / SECONDS_PER_DAY;
    takeMarketDailySnapshot(market, dayID, event);

    market._lastDailySnapshotTimestamp = event.block.timestamp;
    market.save();
  }
  if (
    market._lastHourlySnapshotTimestamp
      .plus(BigInt.fromI32(SECONDS_PER_HOUR))
      .lt(event.block.timestamp)
  ) {
    const hourID = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
    takeMarketHourlySnapshot(market, hourID, event);

    market._lastHourlySnapshotTimestamp = event.block.timestamp;
    market.save();
  }
}

function takeMarketHourlySnapshot(
  market: Market,
  id: i64,
  event: ethereum.Event
): void {
  const previousSnapshotID =
    market._lastHourlySnapshotTimestamp!.toI64() / SECONDS_PER_HOUR;
  const previousSnapshot = MarketHourlySnapshot.load(
    previousSnapshotID.toString()
  );
  const snapshot = new MarketHourlySnapshot(
    market.id.concat("-").concat(id.toString())
  );
  snapshot.protocol = getOrCreateLendingProtocol().id;
  snapshot.market = market.id;
  snapshot.inputTokenBalance = market.inputTokenBalance;
  snapshot.outputTokenSupply = market.outputTokenSupply;
  snapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
  snapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  snapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  snapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  snapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  snapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  snapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  snapshot.cumulativeWithdrawUSD = market.cumulativeWithdrawUSD;
  snapshot.cumulativeRepayUSD = market.cumulativeRepayUSD;
  snapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
  snapshot.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD;
  snapshot.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD;
  snapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  snapshot.exchangeRate = market.exchangeRate;
  snapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  snapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
  snapshot.rates = getSnapshotRates(market.rates, id.toString());
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;

  snapshot.hourlyDepositUSD = previousSnapshot
    ? market.cumulativeDepositUSD.minus(previousSnapshot.cumulativeDepositUSD)
    : market.cumulativeDepositUSD;
  snapshot.hourlyBorrowUSD = previousSnapshot
    ? market.cumulativeBorrowUSD.minus(previousSnapshot.cumulativeBorrowUSD)
    : market.cumulativeBorrowUSD;
  snapshot.hourlyLiquidateUSD = previousSnapshot
    ? market.cumulativeLiquidateUSD.minus(
        previousSnapshot.cumulativeLiquidateUSD
      )
    : market.cumulativeLiquidateUSD;
  snapshot.hourlyWithdrawUSD = previousSnapshot
    ? market.cumulativeWithdrawUSD.minus(previousSnapshot.cumulativeWithdrawUSD)
    : market.cumulativeWithdrawUSD;
  snapshot.hourlyRepayUSD = previousSnapshot
    ? market.cumulativeRepayUSD.minus(previousSnapshot.cumulativeRepayUSD)
    : market.cumulativeRepayUSD;
  snapshot.hourlyTotalRevenueUSD = previousSnapshot
    ? market.cumulativeTotalRevenueUSD.minus(
        previousSnapshot.cumulativeTotalRevenueUSD
      )
    : market.cumulativeTotalRevenueUSD;
  snapshot.hourlySupplySideRevenueUSD = previousSnapshot
    ? market.cumulativeSupplySideRevenueUSD.minus(
        previousSnapshot.cumulativeSupplySideRevenueUSD
      )
    : market.cumulativeSupplySideRevenueUSD;
  snapshot.hourlyProtocolSideRevenueUSD = previousSnapshot
    ? market.cumulativeProtocolSideRevenueUSD.minus(
        previousSnapshot.cumulativeProtocolSideRevenueUSD
      )
    : market.cumulativeProtocolSideRevenueUSD;

  snapshot.save();
}

function takeMarketDailySnapshot(
  market: Market,
  id: i64,
  event: ethereum.Event
): void {
  const previousSnapshotID =
    market._lastDailySnapshotTimestamp!.toI64() / SECONDS_PER_DAY;
  const previousSnapshot = MarketDailySnapshot.load(
    previousSnapshotID.toString()
  );
  const snapshot = new MarketDailySnapshot(
    market.id.concat("-").concat(id.toString())
  );
  snapshot.protocol = getOrCreateLendingProtocol().id;
  snapshot.market = market.id;
  snapshot.inputTokenBalance = market.inputTokenBalance;
  snapshot.outputTokenSupply = market.outputTokenSupply;
  snapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
  snapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  snapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
  snapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  snapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
  snapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  snapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
  snapshot.cumulativeWithdrawUSD = market.cumulativeWithdrawUSD;
  snapshot.cumulativeRepayUSD = market.cumulativeRepayUSD;
  snapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
  snapshot.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD;
  snapshot.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD;
  snapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  snapshot.exchangeRate = market.exchangeRate;
  snapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  snapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
  snapshot.rates = getSnapshotRates(market.rates, id.toString());
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;

  snapshot.dailyDepositUSD = previousSnapshot
    ? market.cumulativeDepositUSD.minus(previousSnapshot.cumulativeDepositUSD)
    : market.cumulativeDepositUSD;
  snapshot.dailyBorrowUSD = previousSnapshot
    ? market.cumulativeBorrowUSD.minus(previousSnapshot.cumulativeBorrowUSD)
    : market.cumulativeBorrowUSD;
  snapshot.dailyLiquidateUSD = previousSnapshot
    ? market.cumulativeLiquidateUSD.minus(
        previousSnapshot.cumulativeLiquidateUSD
      )
    : market.cumulativeLiquidateUSD;
  snapshot.dailyWithdrawUSD = previousSnapshot
    ? market.cumulativeWithdrawUSD.minus(previousSnapshot.cumulativeWithdrawUSD)
    : market.cumulativeWithdrawUSD;
  snapshot.dailyRepayUSD = previousSnapshot
    ? market.cumulativeRepayUSD.minus(previousSnapshot.cumulativeRepayUSD)
    : market.cumulativeRepayUSD;
  snapshot.dailyTotalRevenueUSD = previousSnapshot
    ? market.cumulativeTotalRevenueUSD.minus(
        previousSnapshot.cumulativeTotalRevenueUSD
      )
    : market.cumulativeTotalRevenueUSD;
  snapshot.dailySupplySideRevenueUSD = previousSnapshot
    ? market.cumulativeSupplySideRevenueUSD.minus(
        previousSnapshot.cumulativeSupplySideRevenueUSD
      )
    : market.cumulativeSupplySideRevenueUSD;
  snapshot.dailyProtocolSideRevenueUSD = previousSnapshot
    ? market.cumulativeProtocolSideRevenueUSD.minus(
        previousSnapshot.cumulativeProtocolSideRevenueUSD
      )
    : market.cumulativeProtocolSideRevenueUSD;

  snapshot.save();
}
