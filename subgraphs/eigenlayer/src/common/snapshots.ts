import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
} from "@graphprotocol/graph-ts";

import {
  getOrCreateActiveAccount,
  getOrCreateFinancialsDailySnapshot,
  getOrCreatePoolDailySnapshot,
  getOrCreateProtocol,
  getOrCreateToken,
  getOrCreateUsageMetricsDailySnapshot,
  getPool,
} from "./getters";
import { INT_ONE, SECONDS_PER_DAY } from "./constants";
import {
  addToArrayAtIndex,
  bigIntToBigDecimal,
  getDaysSinceEpoch,
} from "./utils";
import { getUsdPrice } from "../prices";

export function updateFinancialsDailySnapshot(
  isDeposit: boolean,
  amountUSD: BigDecimal,
  event: ethereum.Event
): void {
  const snapshot = getOrCreateFinancialsDailySnapshot(event);
  const protocol = getOrCreateProtocol();

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
  snapshot.cumulativeDepositCount = protocol.cumulativeDepositCount;
  snapshot.cumulativeWithdrawalCount = protocol.cumulativeWithdrawalCount;
  snapshot.cumulativeTransactionCount = protocol.cumulativeTransactionCount;

  const account = getOrCreateActiveAccount(accountAddress, event);

  if (isDeposit) {
    if (!account.deposits) {
      snapshot.dailyActiveDepositors += INT_ONE;
      account.deposits = addToArrayAtIndex(account.deposits, eventID);
      account.save();
    }
    snapshot.dailyDepositCount += INT_ONE;
  } else {
    if (!account.withdraws) {
      snapshot.dailyActiveDepositors += INT_ONE;
      account.withdraws = addToArrayAtIndex(account.deposits, eventID);
      account.save();
    }
    snapshot.dailyWithdrawalCount += INT_ONE;
  }
  snapshot.dailyTransactionCount += INT_ONE;

  snapshot.save();
}

export function updatePoolDailySnapshot(
  poolAddress: Address,
  isDeposit: boolean,
  amount: BigInt,
  amountUSD: BigDecimal,
  event: ethereum.Event
): void {
  const snapshot = getOrCreatePoolDailySnapshot(poolAddress, event);
  const pool = getPool(poolAddress);

  snapshot.totalValueLocked = pool.totalValueLocked;
  snapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  snapshot.cumulativeDepositVolume = pool.cumulativeDepositVolume;
  snapshot.cumulativeDepositVolumeUSD = pool.cumulativeDepositVolumeUSD;
  snapshot.cumulativeWithdrawalVolume = pool.cumulativeWithdrawalVolume;
  snapshot.cumulativeWithdrawalVolumeUSD = pool.cumulativeWithdrawalVolumeUSD;
  snapshot.cumulativeTotalVolume = pool.cumulativeTotalVolume;
  snapshot.cumulativeTotalVolumeUSD = pool.cumulativeTotalVolumeUSD;
  snapshot.netVolume = pool.netVolume;
  snapshot.netVolumeUSD = pool.netVolumeUSD;
  snapshot.cumulativeUniqueDepositors = pool.cumulativeUniqueDepositors;
  snapshot.cumulativeUniqueWithdrawers = pool.cumulativeUniqueWithdrawers;
  snapshot.cumulativeDepositCount = pool.cumulativeDepositCount;
  snapshot.cumulativeWithdrawalCount = pool.cumulativeWithdrawalCount;
  snapshot.cumulativeTransactionCount = pool.cumulativeTransactionCount;

  if (isDeposit) {
    snapshot.dailyDepositVolume = snapshot.dailyDepositVolume.plus(amount);
    snapshot.dailyDepositVolumeUSD =
      snapshot.dailyDepositVolumeUSD.plus(amountUSD);
    snapshot.dailyDepositCount += INT_ONE;
  } else {
    snapshot.dailyWithdrawalVolume =
      snapshot.dailyWithdrawalVolume.plus(amount);
    snapshot.dailyWithdrawalVolumeUSD =
      snapshot.dailyWithdrawalVolumeUSD.plus(amountUSD);
    snapshot.dailyWithdrawalCount += INT_ONE;
  }
  snapshot.dailyTotalVolume = snapshot.dailyDepositVolume.plus(
    snapshot.dailyWithdrawalVolume
  );
  snapshot.dailyTotalVolumeUSD = snapshot.dailyDepositVolumeUSD.plus(
    snapshot.dailyWithdrawalVolumeUSD
  );
  snapshot.dailyNetVolume = snapshot.dailyDepositVolume.minus(
    snapshot.dailyWithdrawalVolume
  );
  snapshot.dailyNetVolumeUSD = snapshot.dailyDepositVolumeUSD.minus(
    snapshot.dailyWithdrawalVolumeUSD
  );
  snapshot.dailyTransactionCount += INT_ONE;

  snapshot.save();
}
