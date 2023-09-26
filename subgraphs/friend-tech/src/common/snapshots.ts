import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

import {
  getOrCreateActiveAccount,
  getOrCreateActiveSubject,
  getOrCreateActiveTrader,
  getOrCreateActiveTraderOfType,
  getOrCreateConnection,
  getOrCreateConnectionDailySnapshot,
  getOrCreateEthToken,
  getOrCreateFinancialsDailySnapshot,
  getOrCreateProtocol,
  getOrCreateSubject,
  getOrCreateSubjectDailySnapshot,
  getOrCreateTrader,
  getOrCreateTraderDailySnapshot,
  getOrCreateUsageMetricsDailySnapshot,
} from "./getters";
import { BIGINT_TEN, ETH_DECIMALS, INT_ONE } from "./constants";
import { getDaysSinceEpoch } from "./utils";

export function updateUsageMetricsDailySnapshot(
  traderAddress: Address,
  subjectAddress: Address,
  isBuy: boolean,
  event: ethereum.Event
): void {
  const protocol = getOrCreateProtocol();
  const snapshot = getOrCreateUsageMetricsDailySnapshot(event);

  const day = getDaysSinceEpoch(event.block.timestamp.toI32());

  const isActiveTrader = getOrCreateActiveTrader(traderAddress, day);
  const isActiveAccountForTrader = getOrCreateActiveAccount(traderAddress, day);
  const isActiveTraderOfType = getOrCreateActiveTraderOfType(
    traderAddress,
    isBuy,
    day
  );

  const isActiveSubject = getOrCreateActiveSubject(subjectAddress, day);
  const isActiveAccountForSubject = getOrCreateActiveAccount(
    subjectAddress,
    day
  );

  if (isActiveTrader) snapshot.dailyActiveTraders += INT_ONE;
  if (isActiveAccountForTrader) snapshot.dailyActiveUsers += INT_ONE;
  if (isActiveSubject) snapshot.dailyActiveSubjects += INT_ONE;
  if (isActiveAccountForSubject) snapshot.dailyActiveUsers += INT_ONE;

  if (isBuy) {
    if (isActiveTraderOfType) snapshot.dailyActiveBuyers += INT_ONE;
    snapshot.dailyBuyCount += INT_ONE;
  } else {
    if (isActiveTraderOfType) snapshot.dailyActiveSellers += INT_ONE;
    snapshot.dailySellCount += INT_ONE;
  }

  snapshot.dailyTradesCount += INT_ONE;

  snapshot.cumulativeUniqueBuyers = protocol.cumulativeUniqueBuyers;
  snapshot.cumulativeUniqueSellers = protocol.cumulativeUniqueSellers;
  snapshot.cumulativeUniqueTraders = protocol.cumulativeUniqueTraders;
  snapshot.cumulativeUniqueSubjects = protocol.cumulativeUniqueSubjects;
  snapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  snapshot.cumulativeBuyCount = protocol.cumulativeBuyCount;
  snapshot.cumulativeSellCount = protocol.cumulativeSellCount;
  snapshot.cumulativeTradesCount = protocol.cumulativeTradesCount;

  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;

  protocol.lastSnapshotDayID = day;
  protocol.lastUpdateTimestamp = event.block.timestamp;

  snapshot.save();
  protocol.save();
}

export function updateFinancialsDailySnapshot(
  amountETH: BigInt,
  subjectFeeETH: BigInt,
  protocolFeeETH: BigInt,
  isBuy: boolean,
  event: ethereum.Event
): void {
  const protocol = getOrCreateProtocol();
  const snapshot = getOrCreateFinancialsDailySnapshot(event);

  const eth = getOrCreateEthToken(event);
  const amountUSD = amountETH
    .toBigDecimal()
    .div(BIGINT_TEN.pow(ETH_DECIMALS as u8).toBigDecimal())
    .times(eth.lastPriceUSD!);
  const subjectFeeUSD = subjectFeeETH
    .toBigDecimal()
    .div(BIGINT_TEN.pow(ETH_DECIMALS as u8).toBigDecimal())
    .times(eth.lastPriceUSD!);
  const protocolFeeUSD = protocolFeeETH
    .toBigDecimal()
    .div(BIGINT_TEN.pow(ETH_DECIMALS as u8).toBigDecimal())
    .times(eth.lastPriceUSD!);

  snapshot.dailySupplySideRevenueETH =
    snapshot.dailySupplySideRevenueETH.plus(subjectFeeETH);
  snapshot.dailySupplySideRevenueUSD =
    snapshot.dailySupplySideRevenueUSD.plus(subjectFeeUSD);
  snapshot.dailyProtocolSideRevenueETH =
    snapshot.dailyProtocolSideRevenueETH.plus(protocolFeeETH);
  snapshot.dailyProtocolSideRevenueUSD =
    snapshot.dailyProtocolSideRevenueUSD.plus(protocolFeeUSD);
  snapshot.dailyTotalRevenueETH = snapshot.dailyTotalRevenueETH.plus(
    subjectFeeETH.plus(protocolFeeETH)
  );
  snapshot.dailyTotalRevenueUSD = snapshot.dailyTotalRevenueUSD.plus(
    subjectFeeUSD.plus(protocolFeeUSD)
  );

  if (isBuy) {
    snapshot.dailyBuyVolumeETH = snapshot.dailyBuyVolumeETH.plus(amountETH);
    snapshot.dailyBuyVolumeUSD = snapshot.dailyBuyVolumeUSD.plus(amountUSD);
  } else {
    snapshot.dailySellVolumeETH = snapshot.dailySellVolumeETH.plus(amountETH);
    snapshot.dailySellVolumeUSD = snapshot.dailySellVolumeUSD.plus(amountUSD);
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

  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;

  snapshot.save();
}

export function updateTraderDailySnapshot(
  traderAddress: Address,
  amountETH: BigInt,
  isBuy: boolean,
  event: ethereum.Event
): void {
  const trader = getOrCreateTrader(traderAddress, event).trader;
  const snapshot = getOrCreateTraderDailySnapshot(traderAddress, event);

  const eth = getOrCreateEthToken(event);
  const amountUSD = amountETH
    .toBigDecimal()
    .div(BIGINT_TEN.pow(ETH_DECIMALS as u8).toBigDecimal())
    .times(eth.lastPriceUSD!);

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
  const subject = getOrCreateSubject(subjectAddress, event).subject;
  const snapshot = getOrCreateSubjectDailySnapshot(subjectAddress, event);

  const eth = getOrCreateEthToken(event);
  const amountUSD = amountETH
    .toBigDecimal()
    .div(BIGINT_TEN.pow(ETH_DECIMALS as u8).toBigDecimal())
    .times(eth.lastPriceUSD!);
  const subjectFeeUSD = subjectFeeETH
    .toBigDecimal()
    .div(BIGINT_TEN.pow(ETH_DECIMALS as u8).toBigDecimal())
    .times(eth.lastPriceUSD!);

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

  const eth = getOrCreateEthToken(event);
  const amountUSD = amountETH
    .toBigDecimal()
    .div(BIGINT_TEN.pow(ETH_DECIMALS as u8).toBigDecimal())
    .times(eth.lastPriceUSD!);

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
}
