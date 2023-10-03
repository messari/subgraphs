import { Address, Bytes, ethereum } from "@graphprotocol/graph-ts";

import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  ETH_ADDRESS,
  ETH_DECIMALS,
  ETH_NAME,
  ETH_SYMBOL,
  INT_ZERO,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  ProtocolType,
} from "./constants";
import { getUsdPricePerEth } from "./prices";
import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { AccountResponse, ActiveAccountResponse } from "./types";
import { getDaysSinceEpoch } from "./utils";

import {
  _Account,
  _ActiveAccount,
  Connection,
  ConnectionDailySnapshot,
  FinancialsDailySnapshot,
  Protocol,
  Subject,
  SubjectDailySnapshot,
  Token,
  Trader,
  TraderDailySnapshot,
  UsageMetricsDailySnapshot,
} from "../../generated/schema";

export function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load(NetworkConfigs.getFactoryAddress());

  if (!protocol) {
    protocol = new Protocol(NetworkConfigs.getFactoryAddress());
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.network = NetworkConfigs.getNetwork();
    protocol.type = ProtocolType.SOCIAL;

    protocol.totalValueLockedETH = BIGINT_ZERO;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueETH = BIGINT_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueETH = BIGINT_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueETH = BIGINT_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    protocol.cumulativeBuyVolumeETH = BIGINT_ZERO;
    protocol.cumulativeBuyVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSellVolumeETH = BIGINT_ZERO;
    protocol.cumulativeSellVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalVolumeETH = BIGINT_ZERO;
    protocol.cumulativeTotalVolumeUSD = BIGDECIMAL_ZERO;
    protocol.netVolumeETH = BIGINT_ZERO;
    protocol.netVolumeUSD = BIGDECIMAL_ZERO;

    protocol.cumulativeUniqueBuyers = INT_ZERO;
    protocol.cumulativeUniqueSellers = INT_ZERO;
    protocol.cumulativeUniqueTraders = INT_ZERO;
    protocol.cumulativeUniqueSubjects = INT_ZERO;
    protocol.cumulativeUniqueUsers = INT_ZERO;

    protocol.cumulativeBuyCount = INT_ZERO;
    protocol.cumulativeSellCount = INT_ZERO;
    protocol.cumulativeTradesCount = INT_ZERO;

    protocol.lastSnapshotDayID = INT_ZERO;
    protocol.lastUpdateTimestamp = BIGINT_ZERO;
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();

  protocol.save();
  return protocol;
}

export function getOrCreateEthToken(event: ethereum.Event): Token {
  const ethAddress = Address.fromString(ETH_ADDRESS);
  let token = Token.load(ethAddress);

  if (!token) {
    token = new Token(ethAddress);

    token.name = ETH_NAME;
    token.symbol = ETH_SYMBOL;
    token.decimals = ETH_DECIMALS as i32;
    token.lastPriceBlockNumber = event.block.number;
  }

  if (!token.lastPriceUSD || token.lastPriceBlockNumber! < event.block.number) {
    const priceUSD = getUsdPricePerEth();

    token.lastPriceUSD = priceUSD;
    token.lastPriceBlockNumber = event.block.number;
  }
  token.save();
  return token;
}

export function getOrCreateTrader(
  traderAddress: Address,
  event: ethereum.Event
): Trader {
  let trader = Trader.load(traderAddress);

  if (!trader) {
    trader = new Trader(traderAddress);

    trader.cumulativeBuyVolumeETH = BIGINT_ZERO;
    trader.cumulativeBuyVolumeUSD = BIGDECIMAL_ZERO;
    trader.cumulativeSellVolumeETH = BIGINT_ZERO;
    trader.cumulativeSellVolumeUSD = BIGDECIMAL_ZERO;
    trader.cumulativeTotalVolumeETH = BIGINT_ZERO;
    trader.cumulativeTotalVolumeUSD = BIGDECIMAL_ZERO;
    trader.netVolumeETH = BIGINT_ZERO;
    trader.netVolumeUSD = BIGDECIMAL_ZERO;

    trader.cumulativeBuyCount = INT_ZERO;
    trader.cumulativeSellCount = INT_ZERO;
    trader.cumulativeTradesCount = INT_ZERO;

    trader.registeredAt = event.block.number;

    trader.connections = [];

    trader.save();
  }
  return trader;
}

export function getOrCreateSubject(
  subjectAddress: Address,
  event: ethereum.Event
): Subject {
  let subject = Subject.load(subjectAddress);

  if (!subject) {
    subject = new Subject(subjectAddress);

    subject.cumulativeRevenueETH = BIGINT_ZERO;
    subject.cumulativeRevenueUSD = BIGDECIMAL_ZERO;
    subject.cumulativeBuyVolumeETH = BIGINT_ZERO;
    subject.cumulativeBuyVolumeUSD = BIGDECIMAL_ZERO;
    subject.cumulativeSellVolumeETH = BIGINT_ZERO;
    subject.cumulativeSellVolumeUSD = BIGDECIMAL_ZERO;
    subject.cumulativeTotalVolumeETH = BIGINT_ZERO;
    subject.cumulativeTotalVolumeUSD = BIGDECIMAL_ZERO;
    subject.netVolumeETH = BIGINT_ZERO;
    subject.netVolumeUSD = BIGDECIMAL_ZERO;

    subject.cumulativeBuyCount = INT_ZERO;
    subject.cumulativeSellCount = INT_ZERO;
    subject.cumulativeTradesCount = INT_ZERO;

    subject.registeredAt = event.block.number;

    subject.supply = BIGINT_ZERO;
    subject.sharePriceETH = BIGINT_ZERO;
    subject.sharePriceUSD = BIGDECIMAL_ZERO;

    subject.connections = [];

    subject.save();
  }
  return subject;
}

export function getOrCreateConnection(
  traderAddress: Address,
  subjectAddress: Address,
  event: ethereum.Event
): Connection {
  const id = Bytes.empty()
    .concat(traderAddress)
    .concat(Bytes.fromUTF8("-"))
    .concat(subjectAddress);

  let connection = Connection.load(id);

  if (!connection) {
    connection = new Connection(id);

    connection.trader = traderAddress;
    connection.subject = subjectAddress;
    connection.shares = BIGINT_ZERO;

    connection.cumulativeBuyVolumeETH = BIGINT_ZERO;
    connection.cumulativeBuyVolumeUSD = BIGDECIMAL_ZERO;
    connection.cumulativeSellVolumeETH = BIGINT_ZERO;
    connection.cumulativeSellVolumeUSD = BIGDECIMAL_ZERO;
    connection.cumulativeTotalVolumeETH = BIGINT_ZERO;
    connection.cumulativeTotalVolumeUSD = BIGDECIMAL_ZERO;
    connection.netVolumeETH = BIGINT_ZERO;
    connection.netVolumeUSD = BIGDECIMAL_ZERO;

    connection.cumulativeBuyCount = INT_ZERO;
    connection.cumulativeSellCount = INT_ZERO;
    connection.cumulativeTradesCount = INT_ZERO;

    connection.createdTimestamp = event.block.timestamp;
    connection.createdBlockNumber = event.block.number;

    connection.save();
  }
  return connection;
}

export function getOrCreateAccount(accountAddress: Address): AccountResponse {
  let isNewAccount = false;
  let account = _Account.load(accountAddress);
  if (!account) {
    isNewAccount = true;
    account = new _Account(accountAddress);
    account.isBuyer = false;
    account.isSeller = false;
    account.isSubject = false;
    account.save();
  }
  return { account, isNewAccount };
}

export function getOrCreateActiveAccount(
  accountAddress: Address,
  day: i32
): ActiveAccountResponse {
  let isNewActiveAccount = false;
  const id = Bytes.empty()
    .concat(accountAddress)
    .concat(Bytes.fromUTF8("-"))
    .concat(Bytes.fromI32(day));

  let activeAccount = _ActiveAccount.load(id);
  if (!activeAccount) {
    isNewActiveAccount = true;
    activeAccount = new _ActiveAccount(id);
    activeAccount.isActiveBuyer = false;
    activeAccount.isActiveSeller = false;
    activeAccount.isActiveSubject = false;
    activeAccount.save();
  }
  return { activeAccount, isNewActiveAccount };
}

export function getOrCreateUsageMetricsDailySnapshot(
  event: ethereum.Event
): UsageMetricsDailySnapshot {
  const day = getDaysSinceEpoch(event.block.timestamp.toI32());

  let snapshot = UsageMetricsDailySnapshot.load(Bytes.fromI32(day));

  if (!snapshot) {
    snapshot = new UsageMetricsDailySnapshot(Bytes.fromI32(day));

    snapshot.day = day;
    snapshot.protocol = NetworkConfigs.getFactoryAddress();

    snapshot.dailyActiveBuyers = INT_ZERO;
    snapshot.cumulativeUniqueBuyers = INT_ZERO;
    snapshot.dailyActiveSellers = INT_ZERO;
    snapshot.cumulativeUniqueSellers = INT_ZERO;
    snapshot.dailyActiveTraders = INT_ZERO;
    snapshot.cumulativeUniqueTraders = INT_ZERO;
    snapshot.dailyActiveSubjects = INT_ZERO;
    snapshot.cumulativeUniqueSubjects = INT_ZERO;
    snapshot.dailyActiveUsers = INT_ZERO;
    snapshot.cumulativeUniqueUsers = INT_ZERO;

    snapshot.dailyBuyCount = INT_ZERO;
    snapshot.cumulativeBuyCount = INT_ZERO;
    snapshot.dailySellCount = INT_ZERO;
    snapshot.cumulativeSellCount = INT_ZERO;
    snapshot.dailyTradesCount = INT_ZERO;
    snapshot.cumulativeTradesCount = INT_ZERO;

    snapshot.timestamp = event.block.timestamp;
    snapshot.blockNumber = event.block.number;

    snapshot.save();
  }
  return snapshot;
}

export function getOrCreateFinancialsDailySnapshot(
  event: ethereum.Event
): FinancialsDailySnapshot {
  const day = getDaysSinceEpoch(event.block.timestamp.toI32());

  let snapshot = FinancialsDailySnapshot.load(Bytes.fromI32(day));

  if (!snapshot) {
    snapshot = new FinancialsDailySnapshot(Bytes.fromI32(day));

    snapshot.day = day;
    snapshot.protocol = NetworkConfigs.getFactoryAddress();

    snapshot.totalValueLockedETH = BIGINT_ZERO;
    snapshot.totalValueLockedUSD = BIGDECIMAL_ZERO;

    snapshot.dailySupplySideRevenueETH = BIGINT_ZERO;
    snapshot.cumulativeSupplySideRevenueETH = BIGINT_ZERO;
    snapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.dailyProtocolSideRevenueETH = BIGINT_ZERO;
    snapshot.cumulativeProtocolSideRevenueETH = BIGINT_ZERO;
    snapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.dailyTotalRevenueETH = BIGINT_ZERO;
    snapshot.cumulativeTotalRevenueETH = BIGINT_ZERO;
    snapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    snapshot.dailyBuyVolumeETH = BIGINT_ZERO;
    snapshot.cumulativeBuyVolumeETH = BIGINT_ZERO;
    snapshot.dailyBuyVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeBuyVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.dailySellVolumeETH = BIGINT_ZERO;
    snapshot.cumulativeSellVolumeETH = BIGINT_ZERO;
    snapshot.dailySellVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeSellVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.dailyTotalVolumeETH = BIGINT_ZERO;
    snapshot.cumulativeTotalVolumeETH = BIGINT_ZERO;
    snapshot.dailyTotalVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeTotalVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.dailyNetVolumeETH = BIGINT_ZERO;
    snapshot.netVolumeETH = BIGINT_ZERO;
    snapshot.dailyNetVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.netVolumeUSD = BIGDECIMAL_ZERO;

    snapshot.timestamp = event.block.timestamp;
    snapshot.blockNumber = event.block.number;

    snapshot.save();
  }
  return snapshot;
}

export function getOrCreateTraderDailySnapshot(
  traderAddress: Address,
  event: ethereum.Event
): TraderDailySnapshot {
  const day = getDaysSinceEpoch(event.block.timestamp.toI32());
  const id = Bytes.empty()
    .concat(Bytes.fromI32(day))
    .concat(Bytes.fromUTF8("-"))
    .concat(traderAddress);

  let snapshot = TraderDailySnapshot.load(id);

  if (!snapshot) {
    snapshot = new TraderDailySnapshot(id);

    snapshot.day = day;
    snapshot.protocol = NetworkConfigs.getFactoryAddress();
    snapshot.trader = traderAddress;

    snapshot.dailyBuyVolumeETH = BIGINT_ZERO;
    snapshot.cumulativeBuyVolumeETH = BIGINT_ZERO;
    snapshot.dailyBuyVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeBuyVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.dailySellVolumeETH = BIGINT_ZERO;
    snapshot.cumulativeSellVolumeETH = BIGINT_ZERO;
    snapshot.dailySellVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeSellVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.dailyTotalVolumeETH = BIGINT_ZERO;
    snapshot.cumulativeTotalVolumeETH = BIGINT_ZERO;
    snapshot.dailyTotalVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeTotalVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.dailyNetVolumeETH = BIGINT_ZERO;
    snapshot.netVolumeETH = BIGINT_ZERO;
    snapshot.dailyNetVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.netVolumeUSD = BIGDECIMAL_ZERO;

    snapshot.dailyBuyCount = INT_ZERO;
    snapshot.cumulativeBuyCount = INT_ZERO;
    snapshot.dailySellCount = INT_ZERO;
    snapshot.cumulativeSellCount = INT_ZERO;
    snapshot.dailyTradesCount = INT_ZERO;
    snapshot.cumulativeTradesCount = INT_ZERO;

    snapshot.connections = [];

    snapshot.timestamp = event.block.timestamp;
    snapshot.blockNumber = event.block.number;

    snapshot.save();
  }
  return snapshot;
}

export function getOrCreateSubjectDailySnapshot(
  subjectAddress: Address,
  event: ethereum.Event
): SubjectDailySnapshot {
  const day = getDaysSinceEpoch(event.block.timestamp.toI32());
  const id = Bytes.empty()
    .concat(Bytes.fromI32(day))
    .concat(Bytes.fromUTF8("-"))
    .concat(subjectAddress);

  let snapshot = SubjectDailySnapshot.load(id);

  if (!snapshot) {
    snapshot = new SubjectDailySnapshot(id);

    snapshot.day = day;
    snapshot.protocol = NetworkConfigs.getFactoryAddress();
    snapshot.subject = subjectAddress;

    snapshot.dailyRevenueETH = BIGINT_ZERO;
    snapshot.cumulativeRevenueETH = BIGINT_ZERO;
    snapshot.dailyRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeRevenueUSD = BIGDECIMAL_ZERO;

    snapshot.dailyBuyVolumeETH = BIGINT_ZERO;
    snapshot.cumulativeBuyVolumeETH = BIGINT_ZERO;
    snapshot.dailyBuyVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeBuyVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.dailySellVolumeETH = BIGINT_ZERO;
    snapshot.cumulativeSellVolumeETH = BIGINT_ZERO;
    snapshot.dailySellVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeSellVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.dailyTotalVolumeETH = BIGINT_ZERO;
    snapshot.cumulativeTotalVolumeETH = BIGINT_ZERO;
    snapshot.dailyTotalVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeTotalVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.dailyNetVolumeETH = BIGINT_ZERO;
    snapshot.netVolumeETH = BIGINT_ZERO;
    snapshot.dailyNetVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.netVolumeUSD = BIGDECIMAL_ZERO;

    snapshot.dailyBuyCount = INT_ZERO;
    snapshot.cumulativeBuyCount = INT_ZERO;
    snapshot.dailySellCount = INT_ZERO;
    snapshot.cumulativeSellCount = INT_ZERO;
    snapshot.dailyTradesCount = INT_ZERO;
    snapshot.cumulativeTradesCount = INT_ZERO;

    snapshot.supply = BIGINT_ZERO;
    snapshot.sharePriceETH = BIGINT_ZERO;
    snapshot.sharePriceUSD = BIGDECIMAL_ZERO;

    snapshot.connections = [];

    snapshot.timestamp = event.block.timestamp;
    snapshot.blockNumber = event.block.number;

    snapshot.save();
  }
  return snapshot;
}

export function getOrCreateConnectionDailySnapshot(
  traderAddress: Address,
  subjectAddress: Address,
  event: ethereum.Event
): ConnectionDailySnapshot {
  const day = getDaysSinceEpoch(event.block.timestamp.toI32());
  const id = Bytes.empty()
    .concat(Bytes.fromI32(day))
    .concat(Bytes.fromUTF8("-"))
    .concat(traderAddress)
    .concat(Bytes.fromUTF8("-"))
    .concat(subjectAddress);

  let snapshot = ConnectionDailySnapshot.load(id);

  if (!snapshot) {
    snapshot = new ConnectionDailySnapshot(id);

    snapshot.day = day;
    snapshot.protocol = NetworkConfigs.getFactoryAddress();
    snapshot.trader = traderAddress;
    snapshot.subject = subjectAddress;
    snapshot.shares = BIGINT_ZERO;

    snapshot.dailyBuyVolumeETH = BIGINT_ZERO;
    snapshot.cumulativeBuyVolumeETH = BIGINT_ZERO;
    snapshot.dailyBuyVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeBuyVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.dailySellVolumeETH = BIGINT_ZERO;
    snapshot.cumulativeSellVolumeETH = BIGINT_ZERO;
    snapshot.dailySellVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeSellVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.dailyTotalVolumeETH = BIGINT_ZERO;
    snapshot.cumulativeTotalVolumeETH = BIGINT_ZERO;
    snapshot.dailyTotalVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeTotalVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.dailyNetVolumeETH = BIGINT_ZERO;
    snapshot.netVolumeETH = BIGINT_ZERO;
    snapshot.dailyNetVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.netVolumeUSD = BIGDECIMAL_ZERO;

    snapshot.dailyBuyCount = INT_ZERO;
    snapshot.cumulativeBuyCount = INT_ZERO;
    snapshot.dailySellCount = INT_ZERO;
    snapshot.cumulativeSellCount = INT_ZERO;
    snapshot.dailyTradesCount = INT_ZERO;
    snapshot.cumulativeTradesCount = INT_ZERO;

    snapshot.createdTimestamp = event.block.timestamp;
    snapshot.createdBlockNumber = event.block.number;

    snapshot.save();
  }
  return snapshot;
}
