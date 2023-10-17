import { Address, Bytes, ethereum } from "@graphprotocol/graph-ts";

import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ZERO,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  PoolType,
  ProtocolType,
} from "./constants";
import { getDaysSinceEpoch } from "./utils";
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
  Protocol,
  Token,
  UsageMetricsDailySnapshot,
} from "../../generated/schema";

export function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load(NetworkConfigs.getFactoryAddress());

  if (!protocol) {
    protocol = new Protocol(NetworkConfigs.getFactoryAddress());
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.network = NetworkConfigs.getNetwork();
    protocol.type = ProtocolType.RESTAKING;

    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;

    protocol.cumulativeDepositVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeWithdrawalVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalVolumeUSD = BIGDECIMAL_ZERO;
    protocol.netVolumeUSD = BIGDECIMAL_ZERO;

    protocol.cumulativeUniqueDepositors = INT_ZERO;
    protocol.cumulativeUniqueWithdrawers = INT_ZERO;

    protocol.cumulativeDepositCount = INT_ZERO;
    protocol.cumulativeWithdrawalCount = INT_ZERO;
    protocol.cumulativeTransactionCount = INT_ZERO;

    protocol.totalEigenPodCount = INT_ZERO;
    protocol.totalStrategyCount = INT_ZERO;
    protocol.totalPoolCount = INT_ZERO;

    protocol._lastDailySnapshotTimestamp = BIGINT_ZERO;
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

export function getOrCreateToken(
  tokenAddress: Address,
  event: ethereum.Event
): Token {
  let token = Token.load(tokenAddress);

  if (!token) {
    token = new Token(tokenAddress);

    token.name = fetchTokenName(tokenAddress);
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress) as i32;
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
  pool.inputToken = poolTokenAddress;
  pool.active = poolIsActive;

  pool.createdTimestamp = event.block.timestamp;
  pool.createdBlockNumber = event.block.number;

  pool.totalValueLocked = BIGINT_ZERO;
  pool.totalValueLockedUSD = BIGDECIMAL_ZERO;

  pool.cumulativeDepositVolume = BIGINT_ZERO;
  pool.cumulativeDepositVolumeUSD = BIGDECIMAL_ZERO;
  pool.cumulativeWithdrawalVolume = BIGINT_ZERO;
  pool.cumulativeWithdrawalVolumeUSD = BIGDECIMAL_ZERO;
  pool.cumulativeTotalVolume = BIGINT_ZERO;
  pool.cumulativeTotalVolumeUSD = BIGDECIMAL_ZERO;
  pool.netVolume = BIGINT_ZERO;
  pool.netVolumeUSD = BIGDECIMAL_ZERO;

  pool.cumulativeUniqueDepositors = INT_ZERO;
  pool.cumulativeUniqueWithdrawers = INT_ZERO;

  pool.cumulativeDepositCount = INT_ZERO;
  pool.cumulativeWithdrawalCount = INT_ZERO;
  pool.cumulativeTransactionCount = INT_ZERO;

  pool._lastDailySnapshotTimestamp = BIGINT_ZERO;
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
  const dayId = getDaysSinceEpoch(event.block.timestamp.toI32());
  let snapshot = PoolDailySnapshot.load(Bytes.fromI32(dayId));

  if (!snapshot) {
    snapshot = new PoolDailySnapshot(Bytes.fromI32(dayId));
    snapshot.day = dayId;
    snapshot.pool = poolAddress;
    snapshot.protocol = NetworkConfigs.getFactoryAddress();

    snapshot.totalValueLocked = BIGINT_ZERO;
    snapshot.totalValueLockedUSD = BIGDECIMAL_ZERO;

    snapshot.dailyDepositVolume = BIGINT_ZERO;
    snapshot.dailyDepositVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeDepositVolume = BIGINT_ZERO;
    snapshot.cumulativeDepositVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.dailyWithdrawalVolume = BIGINT_ZERO;
    snapshot.dailyWithdrawalVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeWithdrawalVolume = BIGINT_ZERO;
    snapshot.cumulativeWithdrawalVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.dailyTotalVolume = BIGINT_ZERO;
    snapshot.dailyTotalVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.cumulativeTotalVolume = BIGINT_ZERO;
    snapshot.cumulativeTotalVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.dailyNetVolume = BIGINT_ZERO;
    snapshot.dailyNetVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.netVolume = BIGINT_ZERO;
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

export function getOrCreateAccount(accountAddress: Address): Account {
  let account = Account.load(accountAddress);

  if (!account) {
    account = new Account(accountAddress);
    account.pools = [];
    account.poolBalance = [];
    account.poolBalanceUSD = [];

    account.totalValueLockedUSD = BIGDECIMAL_ZERO;

    account.deposits = [];
    account.withdrawsQueued = [];
    account.withdrawsCompleted = [];
    account._hasWithdrawnFromPool = [];
    account.save();
  }
  return account;
}

export function getOrCreateActiveAccount(
  accountAddress: Address,
  event: ethereum.Event
): ActiveAccount {
  const day = getDaysSinceEpoch(event.block.timestamp.toI32());
  const id = Bytes.empty()
    .concat(Bytes.fromI32(day))
    .concat(Bytes.fromUTF8("-"))
    .concat(accountAddress);
  let account = ActiveAccount.load(id);

  if (!account) {
    account = new ActiveAccount(id);
    account.deposits = [];
    account.withdraws = [];
    account.save();
  }
  return account;
}
