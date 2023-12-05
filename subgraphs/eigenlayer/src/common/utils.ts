import { Address, BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";

import {
  BIGINT_TEN,
  ETHEREUM_AVG_BLOCKS_PER_DAY,
  ETH_DECIMALS,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
} from "./constants";
import {
  getOrCreateFinancialsDailySnapshot,
  getOrCreatePoolDailySnapshot,
  getOrCreateUsageMetricsDailySnapshot,
} from "./getters";

import {
  FinancialsDailySnapshot,
  PoolDailySnapshot,
  UsageMetricsDailySnapshot,
} from "../../generated/schema";

export function getHoursSinceEpoch(secondsSinceEpoch: number): i32 {
  return <i32>Math.floor(secondsSinceEpoch / SECONDS_PER_HOUR);
}

export function getDaysSinceEpoch(secondsSinceEpoch: number): i32 {
  return <i32>Math.floor(secondsSinceEpoch / SECONDS_PER_DAY);
}

export function bigIntToBigDecimal(
  quantity: BigInt,
  decimals: i32 = ETH_DECIMALS
): BigDecimal {
  return quantity.divDecimal(BIGINT_TEN.pow(decimals as u8).toBigDecimal());
}

export function addToArrayAtIndex<T>(x: T[], item: T, index: i32 = -1): T[] {
  if (x.length == 0) {
    return [item];
  }
  if (index == -1 || index > x.length) {
    index = x.length;
  }
  const retval = new Array<T>();
  let i = 0;
  while (i < index) {
    retval.push(x[i]);
    i += 1;
  }
  retval.push(item);
  while (i < x.length) {
    retval.push(x[i]);
    i += 1;
  }
  return retval;
}

export function removeFromArrayAtIndex<T>(x: T[], index: i32): T[] {
  const retval = new Array<T>(x.length - 1);
  let nI = 0;
  for (let i = 0; i < x.length; i++) {
    if (i != index) {
      retval[nI] = x[i];
      nI += 1;
    }
  }
  return retval;
}

export function updateArrayAtIndex<T>(x: T[], item: T, index: i32): T[] {
  if (x.length == 0) {
    return [item];
  }
  if (index == -1 || index > x.length) {
    index = x.length;
  }
  const retval = new Array<T>();
  let i = 0;
  while (i < index) {
    retval.push(x[i]);
    i += 1;
  }
  retval.push(item);
  i += 1;
  while (i < x.length) {
    retval.push(x[i]);
    i += 1;
  }
  return retval;
}

export function accountArraySort(
  pools: Array<Bytes>,
  poolBalance: Array<BigInt>,
  poolBalanceUSD: Array<BigDecimal>,
  _hasWithdrawnFromPool: Array<boolean>
): void {
  if (
    pools.length != poolBalance.length ||
    pools.length != poolBalanceUSD.length ||
    pools.length != _hasWithdrawnFromPool.length
  ) {
    return;
  }

  const sorter: Array<Array<string>> = [];
  for (let i = 0; i < pools.length; i++) {
    sorter[i] = [
      pools[i].toHexString(),
      poolBalance[i].toString(),
      poolBalanceUSD[i].toString(),
      _hasWithdrawnFromPool[i].toString(),
    ];
  }

  sorter.sort(function (a: Array<string>, b: Array<string>): i32 {
    if (a[0] < b[0]) {
      return -1;
    }
    return 1;
  });

  for (let i = 0; i < sorter.length; i++) {
    pools[i] = Bytes.fromHexString(sorter[i][0]);
    poolBalance[i] = BigInt.fromString(sorter[i][1]);
    poolBalanceUSD[i] = BigDecimal.fromString(sorter[i][2]);
    _hasWithdrawnFromPool[i] = sorter[i][3] == "true";
  }
}

export function findPreviousPoolDailySnapshot(
  poolAddress: Address,
  currentSnapshotDay: number
): PoolDailySnapshot | null {
  let previousDay = (currentSnapshotDay - 1) as i32;
  let previousId = Bytes.empty()
    .concat(poolAddress)
    .concat(Bytes.fromUTF8("-"))
    .concat(Bytes.fromI32(previousDay));
  let previousSnapshot = PoolDailySnapshot.load(previousId);

  while (!previousSnapshot && previousDay > 0) {
    previousDay--;
    previousId = Bytes.empty()
      .concat(poolAddress)
      .concat(Bytes.fromUTF8("-"))
      .concat(Bytes.fromI32(previousDay));
    previousSnapshot = PoolDailySnapshot.load(previousId);
  }
  return previousSnapshot;
}

export function fillInMissingPoolDailySnapshots(
  poolAddress: Address,
  currentSnapshotDay: i32
): void {
  const previousSnapshot = findPreviousPoolDailySnapshot(
    poolAddress,
    currentSnapshotDay
  );
  if (previousSnapshot) {
    let counter = 1;
    for (let i = previousSnapshot.day + 1; i < currentSnapshotDay; i++) {
      const snapshot = getOrCreatePoolDailySnapshot(poolAddress, i as i32);

      snapshot.totalValueLockedUSD = previousSnapshot.totalValueLockedUSD;
      snapshot.inputTokenBalances = previousSnapshot.inputTokenBalances;
      snapshot.inputTokenBalancesUSD = previousSnapshot.inputTokenBalancesUSD;
      snapshot.cumulativeDepositVolumeAmount =
        previousSnapshot.cumulativeDepositVolumeAmount;
      snapshot.cumulativeDepositVolumeUSD =
        previousSnapshot.cumulativeDepositVolumeUSD;
      snapshot.cumulativeWithdrawalVolumeAmount =
        previousSnapshot.cumulativeWithdrawalVolumeAmount;
      snapshot.cumulativeWithdrawalVolumeUSD =
        previousSnapshot.cumulativeWithdrawalVolumeUSD;
      snapshot.cumulativeTotalVolumeAmount =
        previousSnapshot.cumulativeTotalVolumeAmount;
      snapshot.cumulativeTotalVolumeUSD =
        previousSnapshot.cumulativeTotalVolumeUSD;
      snapshot.netVolumeAmount = previousSnapshot.netVolumeAmount;
      snapshot.netVolumeUSD = previousSnapshot.netVolumeUSD;
      snapshot.cumulativeUniqueDepositors =
        previousSnapshot.cumulativeUniqueDepositors;
      snapshot.cumulativeUniqueWithdrawers =
        previousSnapshot.cumulativeUniqueWithdrawers;
      snapshot.cumulativeDepositCount = previousSnapshot.cumulativeDepositCount;
      snapshot.cumulativeWithdrawalCount =
        previousSnapshot.cumulativeWithdrawalCount;
      snapshot.cumulativeTransactionCount =
        previousSnapshot.cumulativeTransactionCount;

      snapshot.timestamp = previousSnapshot.timestamp!.plus(
        BigInt.fromI32((counter * SECONDS_PER_DAY) as i32)
      );
      snapshot.blockNumber = previousSnapshot.blockNumber!.plus(
        BigInt.fromI32((counter * ETHEREUM_AVG_BLOCKS_PER_DAY) as i32)
      );
      counter++;

      snapshot.save();
    }
  }
}

export function findPreviousUsageMetricsDailySnapshot(
  currentSnapshotDay: number
): UsageMetricsDailySnapshot | null {
  let previousDay = (currentSnapshotDay - 1) as i32;
  let previousId = Bytes.fromI32(previousDay);
  let previousSnapshot = UsageMetricsDailySnapshot.load(previousId);

  while (!previousSnapshot && previousDay > 0) {
    previousDay--;
    previousId = Bytes.fromI32(previousDay);
    previousSnapshot = UsageMetricsDailySnapshot.load(previousId);
  }
  return previousSnapshot;
}

export function fillInMissingUsageMetricsDailySnapshots(
  currentSnapshotDay: i32
): void {
  const previousSnapshot =
    findPreviousUsageMetricsDailySnapshot(currentSnapshotDay);
  if (previousSnapshot) {
    let counter = 1;
    for (let i = previousSnapshot.day + 1; i < currentSnapshotDay; i++) {
      const snapshot = getOrCreateUsageMetricsDailySnapshot(i as i32);

      snapshot.cumulativeUniqueDepositors =
        previousSnapshot.cumulativeUniqueDepositors;
      snapshot.cumulativeUniqueWithdrawers =
        previousSnapshot.cumulativeUniqueWithdrawers;
      snapshot.cumulativeUniqueUsers = previousSnapshot.cumulativeUniqueUsers;
      snapshot.cumulativeDepositCount = previousSnapshot.cumulativeDepositCount;
      snapshot.cumulativeWithdrawalCount =
        previousSnapshot.cumulativeWithdrawalCount;
      snapshot.cumulativeTransactionCount =
        previousSnapshot.cumulativeTransactionCount;
      snapshot.totalPoolCount = previousSnapshot.totalPoolCount;

      snapshot.timestamp = previousSnapshot.timestamp!.plus(
        BigInt.fromI32((counter * SECONDS_PER_DAY) as i32)
      );
      snapshot.blockNumber = previousSnapshot.blockNumber!.plus(
        BigInt.fromI32((counter * ETHEREUM_AVG_BLOCKS_PER_DAY) as i32)
      );
      counter++;

      snapshot.save();
    }
  }
}

export function findPreviousFinancialsDailySnapshot(
  currentSnapshotDay: number
): FinancialsDailySnapshot | null {
  let previousDay = (currentSnapshotDay - 1) as i32;
  let previousId = Bytes.fromI32(previousDay);
  let previousSnapshot = FinancialsDailySnapshot.load(previousId);

  while (!previousSnapshot && previousDay > 0) {
    previousDay--;
    previousId = Bytes.fromI32(previousDay);
    previousSnapshot = FinancialsDailySnapshot.load(previousId);
  }
  return previousSnapshot;
}

export function fillInMissingFinancialsDailySnapshots(
  currentSnapshotDay: i32
): void {
  const previousSnapshot =
    findPreviousFinancialsDailySnapshot(currentSnapshotDay);
  if (previousSnapshot) {
    let counter = 1;
    for (let i = previousSnapshot.day + 1; i < currentSnapshotDay; i++) {
      const snapshot = getOrCreateFinancialsDailySnapshot(i as i32);

      snapshot.totalValueLockedUSD = previousSnapshot.totalValueLockedUSD;
      snapshot.cumulativeDepositVolumeUSD =
        previousSnapshot.cumulativeDepositVolumeUSD;
      snapshot.cumulativeWithdrawalVolumeUSD =
        previousSnapshot.cumulativeWithdrawalVolumeUSD;
      snapshot.cumulativeTotalVolumeUSD =
        previousSnapshot.cumulativeTotalVolumeUSD;
      snapshot.netVolumeUSD = previousSnapshot.netVolumeUSD;

      snapshot.timestamp = previousSnapshot.timestamp!.plus(
        BigInt.fromI32((counter * SECONDS_PER_DAY) as i32)
      );
      snapshot.blockNumber = previousSnapshot.blockNumber!.plus(
        BigInt.fromI32((counter * ETHEREUM_AVG_BLOCKS_PER_DAY) as i32)
      );
      counter++;

      snapshot.save();
    }
  }
}
