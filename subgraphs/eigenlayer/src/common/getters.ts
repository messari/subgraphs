import { Address, Bytes, ethereum } from "@graphprotocol/graph-ts";

import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  ETH_ADDRESS,
  ETH_NAME,
  ETH_SYMBOL,
  INT_ZERO,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  PoolType,
  ProtocolType,
} from "./constants";
import { getDaysSinceEpoch, getHoursSinceEpoch } from "./utils";
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol } from "./tokens";
import { getUsdPricePerToken } from "../prices";
import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";

import {
  Account,
  ActiveAccount,
  FinancialsDailySnapshot,
  Pool,
  PoolDailySnapshot,
  PoolHourlySnapshot,
  Protocol,
  Token,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
} from "../../generated/schema";

export function getOrCreateToken(
  tokenAddress: Address,
  event: ethereum.Event
): Token {
  let token = Token.load(tokenAddress);

  if (!token) {
    token = new Token(tokenAddress);

    if (tokenAddress == Address.fromString(ETH_ADDRESS)) {
      token.name = ETH_NAME;
      token.symbol = ETH_SYMBOL;
      token.decimals = 18;
    } else {
      token.name = fetchTokenName(tokenAddress);
      token.symbol = fetchTokenSymbol(tokenAddress);
      token.decimals = fetchTokenDecimals(tokenAddress) as i32;
    }
    token.lastPriceBlockNumber = event.block.number;
  }

  if (!token.lastPriceUSD || token.lastPriceBlockNumber! < event.block.number) {
    token.lastPriceUSD = BIGDECIMAL_ZERO;

    const price = getUsdPricePerToken(tokenAddress);
    if (!price.reverted) {
      token.lastPriceUSD = price.usdPrice;
    }
    token.lastPriceBlockNumber = event.block.number;
  }
  token.save();

  return token;
}

export function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load(NetworkConfigs.getFactoryAddress());

  if (!protocol) {
    protocol = new Protocol(NetworkConfigs.getFactoryAddress());
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.network = NetworkConfigs.getNetwork();
    protocol.type = ProtocolType.GENERIC;

    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeDepositVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeWithdrawalVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalVolumeUSD = BIGDECIMAL_ZERO;
    protocol.netVolumeUSD = BIGDECIMAL_ZERO;

    protocol.cumulativeUniqueDepositors = INT_ZERO;
    protocol.cumulativeUniqueWithdrawers = INT_ZERO;
    protocol.cumulativeUniqueUsers = INT_ZERO;
    protocol.cumulativeDepositCount = INT_ZERO;
    protocol.cumulativeWithdrawalCount = INT_ZERO;
    protocol.cumulativeTransactionCount = INT_ZERO;

    protocol.totalEigenPodCount = INT_ZERO;
    protocol.totalStrategyCount = INT_ZERO;
    protocol.totalPoolCount = INT_ZERO;
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();

  protocol.save();
  return protocol;
}

export function getOrCreateUsageMetricsDailySnapshot(
  event: ethereum.Event
): UsageMetricsDailySnapshot {
  const dayId = getDaysSinceEpoch(event.block.timestamp.toI32());
  let snapshot = UsageMetricsDailySnapshot.load(Bytes.fromI32(dayId));

  if (!snapshot) {
    snapshot = new UsageMetricsDailySnapshot(Bytes.fromI32(dayId));
    snapshot.day = dayId;
    snapshot.protocol = NetworkConfigs.getFactoryAddress();

    snapshot.dailyActiveDepositors = INT_ZERO;
    snapshot.cumulativeUniqueDepositors = INT_ZERO;
    snapshot.dailyActiveWithdrawers = INT_ZERO;
    snapshot.cumulativeUniqueWithdrawers = INT_ZERO;
    snapshot.dailyActiveUsers = INT_ZERO;
    snapshot.cumulativeUniqueUsers = INT_ZERO;
    snapshot.dailyDepositCount = INT_ZERO;
    snapshot.cumulativeDepositCount = INT_ZERO;
    snapshot.dailyWithdrawalCount = INT_ZERO;
    snapshot.cumulativeWithdrawalCount = INT_ZERO;
    snapshot.dailyTransactionCount = INT_ZERO;
    snapshot.cumulativeTransactionCount = INT_ZERO;
    snapshot.totalPoolCount = INT_ZERO;

    snapshot.timestamp = event.block.timestamp;
    snapshot.blockNumber = event.block.number;
    snapshot.save();
  }

  return snapshot;
}

export function getOrCreateUsageMetricsHourlySnapshot(
  event: ethereum.Event
): UsageMetricsHourlySnapshot {
  const hourId = getHoursSinceEpoch(event.block.timestamp.toI32());
  let snapshot = UsageMetricsHourlySnapshot.load(Bytes.fromI32(hourId));

  if (!snapshot) {
    snapshot = new UsageMetricsHourlySnapshot(Bytes.fromI32(hourId));
    snapshot.hour = hourId;
    snapshot.protocol = NetworkConfigs.getFactoryAddress();

    snapshot.hourlyActiveUsers = INT_ZERO;
    snapshot.cumulativeUniqueUsers = INT_ZERO;
    snapshot.hourlyTransactionCount = INT_ZERO;
    snapshot.cumulativeTransactionCount = INT_ZERO;

    snapshot.timestamp = event.block.timestamp;
    snapshot.blockNumber = event.block.number;
    snapshot.save();
  }

  return snapshot;
}

export function getOrCreateFinancialsDailySnapshot(
  event: ethereum.Event
): FinancialsDailySnapshot {
  const dayId = getDaysSinceEpoch(event.block.timestamp.toI32());
  let snapshot = FinancialsDailySnapshot.load(Bytes.fromI32(dayId));

  if (!snapshot) {
    snapshot = new FinancialsDailySnapshot(Bytes.fromI32(dayId));
    snapshot.day = dayId;
    snapshot.protocol = NetworkConfigs.getFactoryAddress();

    snapshot.totalValueLockedUSD = BIGDECIMAL_ZERO;
    snapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.dailyDepositVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeDepositVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.dailyWithdrawalVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeWithdrawalVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.dailyTotalVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeTotalVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.dailyNetVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.netVolumeUSD = BIGDECIMAL_ZERO;

    snapshot.timestamp = event.block.timestamp;
    snapshot.blockNumber = event.block.number;
    snapshot.save();
  }
  return snapshot;
}

export function createPool(
  poolAddress: Address,
  poolName: string,
  poolSymbol: string,
  poolType: string,
  poolTokenAddress: Address,
  poolIsActive: boolean,
  event: ethereum.Event
): Pool {
  const protocol = getOrCreateProtocol();
  const pool = new Pool(poolAddress);
  pool.protocol = protocol.id;
  pool.name = poolName;
  pool.symbol = poolSymbol;
  pool.type = poolType;
  pool.inputTokens = [poolTokenAddress];
  pool.active = poolIsActive;
  pool.createdTimestamp = event.block.timestamp;
  pool.createdBlockNumber = event.block.number;

  pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
  pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
  pool.inputTokenBalances = [BIGINT_ZERO];
  pool.inputTokenBalancesUSD = [BIGDECIMAL_ZERO];
  pool.cumulativeDepositVolumeAmount = BIGINT_ZERO;
  pool.cumulativeDepositVolumeUSD = BIGDECIMAL_ZERO;
  pool.cumulativeWithdrawalVolumeAmount = BIGINT_ZERO;
  pool.cumulativeWithdrawalVolumeUSD = BIGDECIMAL_ZERO;
  pool.cumulativeTotalVolumeAmount = BIGINT_ZERO;
  pool.cumulativeTotalVolumeUSD = BIGDECIMAL_ZERO;
  pool.netVolumeAmount = BIGINT_ZERO;
  pool.netVolumeUSD = BIGDECIMAL_ZERO;

  pool.cumulativeUniqueDepositors = INT_ZERO;
  pool.cumulativeUniqueWithdrawers = INT_ZERO;
  pool.cumulativeDepositCount = INT_ZERO;
  pool.cumulativeWithdrawalCount = INT_ZERO;
  pool.cumulativeTransactionCount = INT_ZERO;
  pool.save();

  if (poolType == PoolType.EIGEN_POD) {
    protocol.totalEigenPodCount += 1;
  } else {
    protocol.totalStrategyCount += 1;
  }
  protocol.totalPoolCount += 1;
  protocol.save();

  return pool;
}

export function getPool(poolAddress: Address): Pool {
  return Pool.load(poolAddress)!;
}

export function getOrCreatePoolDailySnapshot(
  poolAddress: Address,
  event: ethereum.Event
): PoolDailySnapshot {
  const day = getDaysSinceEpoch(event.block.timestamp.toI32());
  const id = Bytes.empty()
    .concat(poolAddress)
    .concat(Bytes.fromUTF8("-"))
    .concat(Bytes.fromI32(day));
  let snapshot = PoolDailySnapshot.load(id);

  if (!snapshot) {
    snapshot = new PoolDailySnapshot(id);
    snapshot.day = day;
    snapshot.pool = poolAddress;
    snapshot.protocol = NetworkConfigs.getFactoryAddress();

    snapshot.totalValueLockedUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.inputTokenBalances = [BIGINT_ZERO];
    snapshot.inputTokenBalancesUSD = [BIGDECIMAL_ZERO];
    snapshot.dailyDepositVolumeAmount = BIGINT_ZERO;
    snapshot.dailyDepositVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeDepositVolumeAmount = BIGINT_ZERO;
    snapshot.cumulativeDepositVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.dailyWithdrawalVolumeAmount = BIGINT_ZERO;
    snapshot.dailyWithdrawalVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeWithdrawalVolumeAmount = BIGINT_ZERO;
    snapshot.cumulativeWithdrawalVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.dailyTotalVolumeAmount = BIGINT_ZERO;
    snapshot.dailyTotalVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeTotalVolumeAmount = BIGINT_ZERO;
    snapshot.cumulativeTotalVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.dailyNetVolumeAmount = BIGINT_ZERO;
    snapshot.dailyNetVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.netVolumeAmount = BIGINT_ZERO;
    snapshot.netVolumeUSD = BIGDECIMAL_ZERO;

    snapshot.cumulativeUniqueDepositors = INT_ZERO;
    snapshot.cumulativeUniqueWithdrawers = INT_ZERO;
    snapshot.dailyDepositCount = INT_ZERO;
    snapshot.cumulativeDepositCount = INT_ZERO;
    snapshot.dailyWithdrawalCount = INT_ZERO;
    snapshot.cumulativeWithdrawalCount = INT_ZERO;
    snapshot.dailyTransactionCount = INT_ZERO;
    snapshot.cumulativeTransactionCount = INT_ZERO;

    snapshot.timestamp = event.block.timestamp;
    snapshot.blockNumber = event.block.number;
    snapshot.save();
  }
  return snapshot;
}

export function getOrCreatePoolHourlySnapshot(
  poolAddress: Address,
  event: ethereum.Event
): PoolHourlySnapshot {
  const hour = getHoursSinceEpoch(event.block.timestamp.toI32());
  const id = Bytes.empty()
    .concat(poolAddress)
    .concat(Bytes.fromUTF8("-"))
    .concat(Bytes.fromI32(hour));
  let snapshot = PoolHourlySnapshot.load(id);

  if (!snapshot) {
    snapshot = new PoolHourlySnapshot(id);
    snapshot.hour = hour;
    snapshot.pool = poolAddress;
    snapshot.protocol = NetworkConfigs.getFactoryAddress();

    snapshot.totalValueLockedUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.inputTokenBalances = [BIGINT_ZERO];
    snapshot.inputTokenBalancesUSD = [BIGDECIMAL_ZERO];

    snapshot.timestamp = event.block.timestamp;
    snapshot.blockNumber = event.block.number;
    snapshot.save();
  }
  return snapshot;
}

export function getOrCreateAccount(accountAddress: Address): Account {
  let account = Account.load(accountAddress);

  if (!account) {
    account = new Account(accountAddress);
    account.pools = [];
    account.poolBalances = [];
    account.poolBalancesUSD = [];

    account.deposits = [];
    account.withdrawsQueued = [];
    account.withdrawsCompleted = [];
    account._hasWithdrawnFromPool = [];
    account.save();
  }
  return account;
}

export function getOrCreateActiveAccount(id: Bytes): ActiveAccount {
  let account = ActiveAccount.load(id);

  if (!account) {
    account = new ActiveAccount(id);
    account.deposits = [];
    account.withdraws = [];
    account.save();
  }
  return account;
}
