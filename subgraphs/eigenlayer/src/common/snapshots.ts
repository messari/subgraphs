import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";

import {
  getOrCreateActiveAccount,
  getOrCreateFinancialsDailySnapshot,
  getOrCreatePoolDailySnapshot,
  getOrCreatePoolHourlySnapshot,
  getOrCreateProtocol,
  getOrCreateToken,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
  getPool,
} from "./getters";
import { INT_ONE } from "./constants";
import {
  addToArrayAtIndex,
  bigIntToBigDecimal,
  getDaysSinceEpoch,
  getHoursSinceEpoch,
} from "./utils";

export function updateFinancialsDailySnapshot(
  tokenAddress: Address,
  isDeposit: boolean,
  amount: BigInt,
  event: ethereum.Event
): void {
  const snapshot = getOrCreateFinancialsDailySnapshot(event);
  const protocol = getOrCreateProtocol();
  const token = getOrCreateToken(tokenAddress, event);
  const amountUSD = bigIntToBigDecimal(amount, token.decimals).times(
    token.lastPriceUSD!
  );

  snapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  snapshot.cumulativeDepositVolumeUSD = protocol.cumulativeDepositVolumeUSD;
  snapshot.cumulativeWithdrawalVolumeUSD =
    protocol.cumulativeWithdrawalVolumeUSD;
  snapshot.cumulativeTotalVolumeUSD = protocol.cumulativeTotalVolumeUSD;
  snapshot.netVolumeUSD = protocol.netVolumeUSD;

  if (isDeposit) {
    snapshot.dailyDepositVolumeUSD =
      snapshot.dailyDepositVolumeUSD.plus(amountUSD);
  } else {
    snapshot.dailyWithdrawalVolumeUSD =
      snapshot.dailyWithdrawalVolumeUSD.plus(amountUSD);
  }
  snapshot.dailyTotalVolumeUSD = snapshot.dailyDepositVolumeUSD.plus(
    snapshot.dailyWithdrawalVolumeUSD
  );
  snapshot.dailyNetVolumeUSD = snapshot.dailyDepositVolumeUSD.minus(
    snapshot.dailyWithdrawalVolumeUSD
  );

  snapshot.timestamp = event.block.timestamp;
  snapshot.blockNumber = event.block.number;

  snapshot.save();
}

export function updateUsageMetricsHourlySnapshot(
  accountAddress: Address,
  event: ethereum.Event
): void {
  const snapshot = getOrCreateUsageMetricsHourlySnapshot(event);
  const protocol = getOrCreateProtocol();

  const hour = getHoursSinceEpoch(event.block.timestamp.toI32());
  const id = Bytes.empty()
    .concat(Bytes.fromUTF8("hourly"))
    .concat(Bytes.fromI32(hour))
    .concat(Bytes.fromUTF8("-"))
    .concat(accountAddress);
  const account = getOrCreateActiveAccount(id);

  if (!account.deposits.length && !account.withdraws.length) {
    snapshot.hourlyActiveUsers += INT_ONE;
  }
  snapshot.hourlyTransactionCount += INT_ONE;
  snapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  snapshot.timestamp = event.block.timestamp;
  snapshot.blockNumber = event.block.number;

  snapshot.save();
}

export function updateUsageMetricsDailySnapshot(
  accountAddress: Address,
  isDeposit: boolean,
  eventID: Bytes,
  event: ethereum.Event
): void {
  const snapshot = getOrCreateUsageMetricsDailySnapshot(event);
  const protocol = getOrCreateProtocol();

  snapshot.cumulativeUniqueDepositors = protocol.cumulativeUniqueDepositors;
  snapshot.cumulativeUniqueWithdrawers = protocol.cumulativeUniqueWithdrawers;
  snapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  snapshot.cumulativeDepositCount = protocol.cumulativeDepositCount;
  snapshot.cumulativeWithdrawalCount = protocol.cumulativeWithdrawalCount;
  snapshot.cumulativeTransactionCount = protocol.cumulativeTransactionCount;
  snapshot.totalPoolCount = protocol.totalPoolCount;

  const day = getDaysSinceEpoch(event.block.timestamp.toI32());
  const id = Bytes.empty()
    .concat(Bytes.fromUTF8("daily"))
    .concat(Bytes.fromI32(day))
    .concat(Bytes.fromUTF8("-"))
    .concat(accountAddress);
  const account = getOrCreateActiveAccount(id);

  if (!account.deposits.length && !account.withdraws.length) {
    snapshot.dailyActiveUsers += INT_ONE;
  }

  if (isDeposit) {
    if (!account.deposits.length) {
      snapshot.dailyActiveDepositors += INT_ONE;
    }
    account.deposits = addToArrayAtIndex(account.deposits, eventID);
    snapshot.dailyDepositCount += INT_ONE;
  } else {
    if (!account.withdraws.length) {
      snapshot.dailyActiveWithdrawers += INT_ONE;
    }
    account.withdraws = addToArrayAtIndex(account.withdraws, eventID);
    snapshot.dailyWithdrawalCount += INT_ONE;
  }
  snapshot.dailyTransactionCount += INT_ONE;

  snapshot.timestamp = event.block.timestamp;
  snapshot.blockNumber = event.block.number;

  snapshot.save();
  account.save();
}

export function updatePoolHourlySnapshot(
  poolAddress: Address,
  event: ethereum.Event
): void {
  const snapshot = getOrCreatePoolHourlySnapshot(poolAddress, event);
  const pool = getPool(poolAddress);

  snapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  snapshot.inputTokenBalances = pool.inputTokenBalances;
  snapshot.inputTokenBalancesUSD = pool.inputTokenBalancesUSD;

  snapshot.timestamp = event.block.timestamp;
  snapshot.blockNumber = event.block.number;

  snapshot.save();
}

export function updatePoolDailySnapshot(
  poolAddress: Address,
  tokenAddress: Address,
  isDeposit: boolean,
  amount: BigInt,
  event: ethereum.Event
): void {
  const snapshot = getOrCreatePoolDailySnapshot(poolAddress, event);
  const pool = getPool(poolAddress);
  const token = getOrCreateToken(tokenAddress, event);

  snapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  snapshot.inputTokenBalances = pool.inputTokenBalances;
  snapshot.inputTokenBalancesUSD = pool.inputTokenBalancesUSD;
  snapshot.cumulativeDepositVolumeAmount = pool.cumulativeDepositVolumeAmount;
  snapshot.cumulativeDepositVolumeUSD = pool.cumulativeDepositVolumeUSD;
  snapshot.cumulativeWithdrawalVolumeAmount =
    pool.cumulativeWithdrawalVolumeAmount;
  snapshot.cumulativeWithdrawalVolumeUSD = pool.cumulativeWithdrawalVolumeUSD;
  snapshot.cumulativeTotalVolumeAmount = pool.cumulativeTotalVolumeAmount;
  snapshot.cumulativeTotalVolumeUSD = pool.cumulativeTotalVolumeUSD;
  snapshot.netVolumeAmount = pool.netVolumeAmount;
  snapshot.netVolumeUSD = pool.netVolumeUSD;
  snapshot.cumulativeUniqueDepositors = pool.cumulativeUniqueDepositors;
  snapshot.cumulativeUniqueWithdrawers = pool.cumulativeUniqueWithdrawers;
  snapshot.cumulativeDepositCount = pool.cumulativeDepositCount;
  snapshot.cumulativeWithdrawalCount = pool.cumulativeWithdrawalCount;
  snapshot.cumulativeTransactionCount = pool.cumulativeTransactionCount;

  if (isDeposit) {
    snapshot.dailyDepositVolumeAmount =
      snapshot.dailyDepositVolumeAmount.plus(amount);
    snapshot.dailyDepositVolumeUSD = bigIntToBigDecimal(
      snapshot.dailyDepositVolumeAmount
    ).times(token.lastPriceUSD!);
    snapshot.dailyDepositCount += INT_ONE;
  } else {
    snapshot.dailyWithdrawalVolumeAmount =
      snapshot.dailyWithdrawalVolumeAmount.plus(amount);
    snapshot.dailyWithdrawalVolumeUSD = bigIntToBigDecimal(
      snapshot.dailyWithdrawalVolumeAmount
    ).times(token.lastPriceUSD!);
    snapshot.dailyWithdrawalCount += INT_ONE;
  }
  snapshot.dailyTotalVolumeAmount = snapshot.dailyDepositVolumeAmount.plus(
    snapshot.dailyWithdrawalVolumeAmount
  );
  snapshot.dailyTotalVolumeUSD = snapshot.dailyDepositVolumeUSD.plus(
    snapshot.dailyWithdrawalVolumeUSD
  );
  snapshot.dailyNetVolumeAmount = snapshot.dailyDepositVolumeAmount.minus(
    snapshot.dailyWithdrawalVolumeAmount
  );
  snapshot.dailyNetVolumeUSD = snapshot.dailyDepositVolumeUSD.minus(
    snapshot.dailyWithdrawalVolumeUSD
  );
  snapshot.dailyTransactionCount += INT_ONE;

  snapshot.timestamp = event.block.timestamp;
  snapshot.blockNumber = event.block.number;

  snapshot.save();
}
