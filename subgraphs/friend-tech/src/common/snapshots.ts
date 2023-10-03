import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";

import {
  getOrCreateConnection,
  getOrCreateConnectionDailySnapshot,
  getOrCreateProtocol,
  getOrCreateSubject,
  getOrCreateSubjectDailySnapshot,
  getOrCreateTrader,
  getOrCreateTraderDailySnapshot,
} from "./getters";
import { INT_ONE, SECONDS_PER_DAY } from "./constants";
import { addToArrayAtIndex, getDaysSinceEpoch } from "./utils";
import { getUsdPriceForEthAmount } from "./prices";

import {
  FinancialsDailySnapshot,
  Protocol,
  UsageMetricsDailySnapshot,
} from "../../generated/schema";

export function takeUsageMetricsDailySnapshot(
  protocol: Protocol,
  event: ethereum.Event
): void {
  const day = getDaysSinceEpoch(event.block.timestamp.toI32());
  const snapshot = new UsageMetricsDailySnapshot(Bytes.fromI32(day));

  snapshot.day = day;
  snapshot.protocol = protocol.id;
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;

  snapshot.cumulativeUniqueBuyers = protocol.cumulativeUniqueBuyers;
  snapshot.cumulativeUniqueSellers = protocol.cumulativeUniqueSellers;
  snapshot.cumulativeUniqueTraders = protocol.cumulativeUniqueTraders;
  snapshot.cumulativeUniqueSubjects = protocol.cumulativeUniqueSubjects;
  snapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  snapshot.cumulativeBuyCount = protocol.cumulativeBuyCount;
  snapshot.cumulativeSellCount = protocol.cumulativeSellCount;
  snapshot.cumulativeTradesCount = protocol.cumulativeTradesCount;

  let activeBuyersDelta = snapshot.cumulativeUniqueBuyers;
  let activeSellersDelta = snapshot.cumulativeUniqueSellers;
  let activeTradersDelta = snapshot.cumulativeUniqueTraders;
  let activeSubjectsDelta = snapshot.cumulativeUniqueSubjects;
  let activeUsersDelta = snapshot.cumulativeUniqueUsers;
  let buyCountDelta = snapshot.cumulativeBuyCount;
  let sellCountDelta = snapshot.cumulativeSellCount;
  let tradesCountDelta = snapshot.cumulativeTradesCount;

  const previousDay = getDaysSinceEpoch(
    protocol._lastDailySnapshotTimestamp!.toI32()
  );
  const previousSnapshot = UsageMetricsDailySnapshot.load(
    Bytes.fromI32(previousDay)
  );
  if (previousSnapshot) {
    activeBuyersDelta =
      snapshot.cumulativeUniqueBuyers - previousSnapshot.cumulativeUniqueBuyers;
    activeSellersDelta =
      snapshot.cumulativeUniqueSellers -
      previousSnapshot.cumulativeUniqueSellers;
    activeTradersDelta =
      snapshot.cumulativeUniqueTraders -
      previousSnapshot.cumulativeUniqueTraders;
    activeSubjectsDelta =
      snapshot.cumulativeUniqueSubjects -
      previousSnapshot.cumulativeUniqueSubjects;
    activeUsersDelta =
      snapshot.cumulativeUniqueUsers - previousSnapshot.cumulativeUniqueUsers;
    buyCountDelta =
      snapshot.cumulativeBuyCount - previousSnapshot.cumulativeBuyCount;
    sellCountDelta =
      snapshot.cumulativeSellCount - previousSnapshot.cumulativeSellCount;
    tradesCountDelta =
      snapshot.cumulativeTradesCount - previousSnapshot.cumulativeTradesCount;
  }
  snapshot.dailyActiveBuyers = activeBuyersDelta;
  snapshot.dailyActiveSellers = activeSellersDelta;
  snapshot.dailyActiveTraders = activeTradersDelta;
  snapshot.dailyActiveSubjects = activeSubjectsDelta;
  snapshot.dailyActiveUsers = activeUsersDelta;
  snapshot.dailyBuyCount = buyCountDelta;
  snapshot.dailySellCount = sellCountDelta;
  snapshot.dailyTradesCount = tradesCountDelta;

  snapshot.save();
}

export function takeFinancialsDailySnapshot(
  protocol: Protocol,
  event: ethereum.Event
): void {
  const day = getDaysSinceEpoch(event.block.timestamp.toI32());
  const snapshot = new FinancialsDailySnapshot(Bytes.fromI32(day));

  snapshot.day = day;
  snapshot.protocol = protocol.id;
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;

  snapshot.totalValueLockedETH = protocol.totalValueLockedETH;
  snapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  snapshot.cumulativeSupplySideRevenueETH =
    protocol.cumulativeSupplySideRevenueETH;
  snapshot.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  snapshot.cumulativeProtocolSideRevenueETH =
    protocol.cumulativeProtocolSideRevenueETH;
  snapshot.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  snapshot.cumulativeTotalRevenueETH = protocol.cumulativeTotalRevenueETH;
  snapshot.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  snapshot.cumulativeBuyVolumeETH = protocol.cumulativeBuyVolumeETH;
  snapshot.cumulativeBuyVolumeUSD = protocol.cumulativeBuyVolumeUSD;
  snapshot.cumulativeSellVolumeETH = protocol.cumulativeSellVolumeETH;
  snapshot.cumulativeSellVolumeUSD = protocol.cumulativeSellVolumeUSD;
  snapshot.cumulativeTotalVolumeETH = protocol.cumulativeTotalVolumeETH;
  snapshot.cumulativeTotalVolumeUSD = protocol.cumulativeTotalVolumeUSD;
  snapshot.netVolumeETH = protocol.netVolumeETH;
  snapshot.netVolumeUSD = protocol.netVolumeUSD;

  let supplySideRevenueETHDelta = snapshot.cumulativeSupplySideRevenueETH;
  let supplySideRevenueUSDDelta = snapshot.cumulativeSupplySideRevenueUSD;
  let protocolSideRevenueETHDelta = snapshot.cumulativeProtocolSideRevenueETH;
  let protocolSideRevenueUSDDelta = snapshot.cumulativeProtocolSideRevenueUSD;
  let totalRevenueETHDelta = snapshot.cumulativeTotalRevenueETH;
  let totalRevenueUSDDelta = snapshot.cumulativeTotalRevenueUSD;
  let buyVolumeETHDelta = snapshot.cumulativeBuyVolumeETH;
  let buyVolumeUSDDelta = snapshot.cumulativeBuyVolumeUSD;
  let sellVolumeETHDelta = snapshot.cumulativeSellVolumeETH;
  let sellVolumeUSDDelta = snapshot.cumulativeSellVolumeUSD;
  let totalVolumeETHDelta = snapshot.cumulativeTotalVolumeETH;
  let totalVolumeUSDDelta = snapshot.cumulativeTotalVolumeUSD;
  let netVolumeETHDelta = snapshot.netVolumeETH;
  let netVolumeUSDDelta = snapshot.netVolumeUSD;

  const previousDay = getDaysSinceEpoch(
    protocol._lastDailySnapshotTimestamp!.toI32()
  );
  const previousSnapshot = FinancialsDailySnapshot.load(
    Bytes.fromI32(previousDay)
  );
  if (previousSnapshot) {
    supplySideRevenueETHDelta = snapshot.cumulativeSupplySideRevenueETH.minus(
      previousSnapshot.cumulativeSupplySideRevenueETH
    );
    supplySideRevenueUSDDelta = snapshot.cumulativeSupplySideRevenueUSD.minus(
      previousSnapshot.cumulativeSupplySideRevenueUSD
    );
    protocolSideRevenueETHDelta =
      snapshot.cumulativeProtocolSideRevenueETH.minus(
        previousSnapshot.cumulativeProtocolSideRevenueETH
      );
    protocolSideRevenueUSDDelta =
      snapshot.cumulativeProtocolSideRevenueUSD.minus(
        previousSnapshot.cumulativeProtocolSideRevenueUSD
      );
    totalRevenueETHDelta = snapshot.cumulativeTotalRevenueETH.minus(
      previousSnapshot.cumulativeTotalRevenueETH
    );
    totalRevenueUSDDelta = snapshot.cumulativeTotalRevenueUSD.minus(
      previousSnapshot.cumulativeTotalRevenueUSD
    );
    buyVolumeETHDelta = snapshot.cumulativeBuyVolumeETH.minus(
      previousSnapshot.cumulativeBuyVolumeETH
    );
    buyVolumeUSDDelta = snapshot.cumulativeBuyVolumeUSD.minus(
      previousSnapshot.cumulativeBuyVolumeUSD
    );
    sellVolumeETHDelta = snapshot.cumulativeSellVolumeETH.minus(
      previousSnapshot.cumulativeSellVolumeETH
    );
    sellVolumeUSDDelta = snapshot.cumulativeSellVolumeUSD.minus(
      previousSnapshot.cumulativeSellVolumeUSD
    );
    totalVolumeETHDelta = snapshot.cumulativeTotalVolumeETH.minus(
      previousSnapshot.cumulativeTotalVolumeETH
    );
    totalVolumeUSDDelta = snapshot.cumulativeTotalVolumeUSD.minus(
      previousSnapshot.cumulativeTotalVolumeUSD
    );
    netVolumeETHDelta = snapshot.netVolumeETH.minus(
      previousSnapshot.netVolumeETH
    );
    netVolumeUSDDelta = snapshot.netVolumeUSD.minus(
      previousSnapshot.netVolumeUSD
    );
  }
  snapshot.dailySupplySideRevenueETH = supplySideRevenueETHDelta;
  snapshot.dailySupplySideRevenueUSD = supplySideRevenueUSDDelta;
  snapshot.dailyProtocolSideRevenueETH = protocolSideRevenueETHDelta;
  snapshot.dailyProtocolSideRevenueUSD = protocolSideRevenueUSDDelta;
  snapshot.dailyTotalRevenueETH = totalRevenueETHDelta;
  snapshot.dailyTotalRevenueUSD = totalRevenueUSDDelta;
  snapshot.dailyBuyVolumeETH = buyVolumeETHDelta;
  snapshot.dailyBuyVolumeUSD = buyVolumeUSDDelta;
  snapshot.dailySellVolumeETH = sellVolumeETHDelta;
  snapshot.dailySellVolumeUSD = sellVolumeUSDDelta;
  snapshot.dailyTotalVolumeETH = totalVolumeETHDelta;
  snapshot.dailyTotalVolumeUSD = totalVolumeUSDDelta;
  snapshot.dailyNetVolumeETH = netVolumeETHDelta;
  snapshot.dailyNetVolumeUSD = netVolumeUSDDelta;

  snapshot.save();
}

export function updateProtocolSnapshots(event: ethereum.Event): void {
  const protocol = getOrCreateProtocol();
  if (
    protocol._lastDailySnapshotTimestamp
      .plus(BigInt.fromI32(SECONDS_PER_DAY))
      .lt(event.block.timestamp)
  ) {
    takeUsageMetricsDailySnapshot(protocol, event);
    takeFinancialsDailySnapshot(protocol, event);

    protocol._lastDailySnapshotTimestamp = event.block.timestamp;
    protocol.save();
  }
}

export function updateTraderDailySnapshot(
  traderAddress: Address,
  amountETH: BigInt,
  isBuy: boolean,
  event: ethereum.Event
): void {
  const trader = getOrCreateTrader(traderAddress, event);
  const snapshot = getOrCreateTraderDailySnapshot(traderAddress, event);
  const amountUSD = getUsdPriceForEthAmount(amountETH, event);

  if (isBuy) {
    snapshot.dailyBuyVolumeETH = snapshot.dailyBuyVolumeETH.plus(amountETH);
    snapshot.dailyBuyVolumeUSD = snapshot.dailyBuyVolumeUSD.plus(amountUSD);
    snapshot.dailyBuyCount += INT_ONE;
  } else {
    snapshot.dailySellVolumeETH = snapshot.dailySellVolumeETH.plus(amountETH);
    snapshot.dailySellVolumeUSD = snapshot.dailySellVolumeUSD.plus(amountUSD);
    snapshot.dailySellCount += INT_ONE;
  }

  snapshot.dailyTotalVolumeETH = snapshot.dailyBuyVolumeETH.plus(
    snapshot.dailySellVolumeETH
  );
  snapshot.dailyTotalVolumeUSD = snapshot.dailyBuyVolumeUSD.plus(
    snapshot.dailySellVolumeUSD
  );
  snapshot.dailyNetVolumeETH = snapshot.dailyBuyVolumeETH.minus(
    snapshot.dailySellVolumeETH
  );
  snapshot.dailyNetVolumeUSD = snapshot.dailyBuyVolumeUSD.minus(
    snapshot.dailySellVolumeUSD
  );
  snapshot.dailyTradesCount += INT_ONE;

  snapshot.cumulativeBuyVolumeETH = trader.cumulativeBuyVolumeETH;
  snapshot.cumulativeBuyVolumeUSD = trader.cumulativeBuyVolumeUSD;
  snapshot.cumulativeSellVolumeETH = trader.cumulativeSellVolumeETH;
  snapshot.cumulativeSellVolumeUSD = trader.cumulativeSellVolumeUSD;
  snapshot.cumulativeTotalVolumeETH = trader.cumulativeTotalVolumeETH;
  snapshot.cumulativeTotalVolumeUSD = trader.cumulativeTotalVolumeUSD;
  snapshot.netVolumeETH = trader.netVolumeETH;
  snapshot.netVolumeUSD = trader.netVolumeUSD;

  snapshot.cumulativeBuyCount = trader.cumulativeBuyCount;
  snapshot.cumulativeSellCount = trader.cumulativeSellCount;
  snapshot.cumulativeTradesCount = trader.cumulativeTradesCount;

  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;

  snapshot.save();
}

export function updateSubjectDailySnapshot(
  subjectAddress: Address,
  supply: BigInt,
  amountETH: BigInt,
  subjectFeeETH: BigInt,
  isBuy: boolean,
  event: ethereum.Event
): void {
  const subject = getOrCreateSubject(subjectAddress, event);
  const snapshot = getOrCreateSubjectDailySnapshot(subjectAddress, event);

  const amountUSD = getUsdPriceForEthAmount(amountETH, event);
  const subjectFeeUSD = getUsdPriceForEthAmount(subjectFeeETH, event);

  snapshot.dailyRevenueETH = snapshot.dailyRevenueETH.plus(subjectFeeETH);
  snapshot.dailyRevenueUSD = snapshot.dailyRevenueUSD.plus(subjectFeeUSD);

  if (isBuy) {
    snapshot.dailyBuyVolumeETH = snapshot.dailyBuyVolumeETH.plus(amountETH);
    snapshot.dailyBuyVolumeUSD = snapshot.dailyBuyVolumeUSD.plus(amountUSD);
    snapshot.dailyBuyCount += INT_ONE;
  } else {
    snapshot.dailySellVolumeETH = snapshot.dailySellVolumeETH.plus(amountETH);
    snapshot.dailySellVolumeUSD = snapshot.dailySellVolumeUSD.plus(amountUSD);
    snapshot.dailySellCount += INT_ONE;
  }

  snapshot.dailyTotalVolumeETH = snapshot.dailyBuyVolumeETH.plus(
    snapshot.dailySellVolumeETH
  );
  snapshot.dailyTotalVolumeUSD = snapshot.dailyBuyVolumeUSD.plus(
    snapshot.dailySellVolumeUSD
  );
  snapshot.dailyNetVolumeETH = snapshot.dailyBuyVolumeETH.minus(
    snapshot.dailySellVolumeETH
  );
  snapshot.dailyNetVolumeUSD = snapshot.dailyBuyVolumeUSD.minus(
    snapshot.dailySellVolumeUSD
  );
  snapshot.dailyTradesCount += INT_ONE;

  snapshot.supply = supply;
  snapshot.sharePriceETH = amountETH;
  snapshot.sharePriceUSD = amountUSD;

  snapshot.cumulativeRevenueETH = subject.cumulativeRevenueETH;
  snapshot.cumulativeRevenueUSD = subject.cumulativeRevenueUSD;
  snapshot.cumulativeBuyVolumeETH = subject.cumulativeBuyVolumeETH;
  snapshot.cumulativeBuyVolumeUSD = subject.cumulativeBuyVolumeUSD;
  snapshot.cumulativeSellVolumeETH = subject.cumulativeSellVolumeETH;
  snapshot.cumulativeSellVolumeUSD = subject.cumulativeSellVolumeUSD;
  snapshot.cumulativeTotalVolumeETH = subject.cumulativeTotalVolumeETH;
  snapshot.cumulativeTotalVolumeUSD = subject.cumulativeTotalVolumeUSD;
  snapshot.netVolumeETH = subject.netVolumeETH;
  snapshot.netVolumeUSD = subject.netVolumeUSD;

  snapshot.cumulativeBuyCount = subject.cumulativeBuyCount;
  snapshot.cumulativeSellCount = subject.cumulativeSellCount;
  snapshot.cumulativeTradesCount = subject.cumulativeTradesCount;

  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;

  snapshot.save();
}

export function updateConnectionDailySnapshot(
  traderAddress: Address,
  subjectAddress: Address,
  amountETH: BigInt,
  isBuy: boolean,
  event: ethereum.Event
): void {
  const connection = getOrCreateConnection(
    traderAddress,
    subjectAddress,
    event
  );
  const snapshot = getOrCreateConnectionDailySnapshot(
    traderAddress,
    subjectAddress,
    event
  );
  const amountUSD = getUsdPriceForEthAmount(amountETH, event);

  if (isBuy) {
    snapshot.dailyBuyVolumeETH = snapshot.dailyBuyVolumeETH.plus(amountETH);
    snapshot.dailyBuyVolumeUSD = snapshot.dailyBuyVolumeUSD.plus(amountUSD);
    snapshot.dailyBuyCount += INT_ONE;
  } else {
    snapshot.dailySellVolumeETH = snapshot.dailySellVolumeETH.plus(amountETH);
    snapshot.dailySellVolumeUSD = snapshot.dailySellVolumeUSD.plus(amountUSD);
    snapshot.dailySellCount += INT_ONE;
  }

  snapshot.dailyTotalVolumeETH = snapshot.dailyBuyVolumeETH.plus(
    snapshot.dailySellVolumeETH
  );
  snapshot.dailyTotalVolumeUSD = snapshot.dailyBuyVolumeUSD.plus(
    snapshot.dailySellVolumeUSD
  );
  snapshot.dailyNetVolumeETH = snapshot.dailyBuyVolumeETH.minus(
    snapshot.dailySellVolumeETH
  );
  snapshot.dailyNetVolumeUSD = snapshot.dailyBuyVolumeUSD.minus(
    snapshot.dailySellVolumeUSD
  );
  snapshot.dailyTradesCount += INT_ONE;

  snapshot.shares = connection.shares;
  snapshot.cumulativeBuyVolumeETH = connection.cumulativeBuyVolumeETH;
  snapshot.cumulativeBuyVolumeUSD = connection.cumulativeBuyVolumeUSD;
  snapshot.cumulativeSellVolumeETH = connection.cumulativeSellVolumeETH;
  snapshot.cumulativeSellVolumeUSD = connection.cumulativeSellVolumeUSD;
  snapshot.cumulativeTotalVolumeETH = connection.cumulativeTotalVolumeETH;
  snapshot.cumulativeTotalVolumeUSD = connection.cumulativeTotalVolumeUSD;
  snapshot.netVolumeETH = connection.netVolumeETH;
  snapshot.netVolumeUSD = connection.netVolumeUSD;

  snapshot.cumulativeBuyCount = connection.cumulativeBuyCount;
  snapshot.cumulativeSellCount = connection.cumulativeSellCount;
  snapshot.cumulativeTradesCount = connection.cumulativeTradesCount;

  snapshot.createdBlockNumber = event.block.number;
  snapshot.createdTimestamp = event.block.timestamp;

  snapshot.save();

  const traderSnapshot = getOrCreateTraderDailySnapshot(traderAddress, event);
  if (!traderSnapshot.connections.includes(snapshot.id)) {
    traderSnapshot.connections = addToArrayAtIndex(
      traderSnapshot.connections,
      snapshot.id
    );
  }
  traderSnapshot.save();

  const subjectSnapshot = getOrCreateSubjectDailySnapshot(
    subjectAddress,
    event
  );
  if (!subjectSnapshot.connections.includes(snapshot.id)) {
    subjectSnapshot.connections = addToArrayAtIndex(
      subjectSnapshot.connections,
      snapshot.id
    );
  }
  subjectSnapshot.save();
}
