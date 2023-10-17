import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
} from "@graphprotocol/graph-ts";

import {
  getOrCreateAccount,
  getOrCreateProtocol,
  getOrCreateToken,
  getPool,
} from "./getters";
import { getUsdPrice } from "../prices";
import {
  accountArraySort,
  addToArrayAtIndex,
  bigIntToBigDecimal,
  updateArrayAtIndex,
} from "./utils";
import { BIGDECIMAL_MINUS_ONE, BIGINT_MINUS_ONE, INT_ONE } from "./constants";

export function updatePoolIsActive(
  poolAddress: Address,
  isActive: boolean
): void {
  const pool = getPool(poolAddress);
  pool.active = isActive;
  pool.save();
}

export function updateTVL(
  poolAddress: Address,
  isDeposit: boolean,
  amount: BigInt,
  amountUSD: BigDecimal
): void {
  const protocol = getOrCreateProtocol();
  const pool = getPool(poolAddress);

  if (isDeposit) {
    pool.totalValueLocked = pool.totalValueLocked.plus(amount);
    pool.totalValueLockedUSD = pool.totalValueLockedUSD.plus(amountUSD);
    protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(amountUSD);
  } else {
    pool.totalValueLocked = pool.totalValueLocked.minus(amount);
    pool.totalValueLockedUSD = pool.totalValueLockedUSD.minus(amountUSD);
    protocol.totalValueLockedUSD =
      protocol.totalValueLockedUSD.minus(amountUSD);
  }

  pool.save();
  protocol.save();
}

export function updateVolume(
  poolAddress: Address,
  isDeposit: boolean,
  amount: BigInt,
  amountUSD: BigDecimal
): void {
  const protocol = getOrCreateProtocol();
  const pool = getPool(poolAddress);

  if (isDeposit) {
    pool.cumulativeDepositVolume = pool.cumulativeDepositVolume.plus(amount);
    pool.cumulativeDepositVolumeUSD =
      pool.cumulativeDepositVolumeUSD.plus(amountUSD);
    protocol.cumulativeDepositVolumeUSD =
      protocol.cumulativeDepositVolumeUSD.plus(amountUSD);
  } else {
    pool.cumulativeWithdrawalVolume =
      pool.cumulativeWithdrawalVolume.plus(amount);
    pool.cumulativeWithdrawalVolumeUSD =
      pool.cumulativeWithdrawalVolumeUSD.plus(amountUSD);
    protocol.cumulativeWithdrawalVolumeUSD =
      protocol.cumulativeWithdrawalVolumeUSD.plus(amountUSD);
  }
  pool.cumulativeTotalVolume = pool.cumulativeDepositVolume.plus(
    pool.cumulativeWithdrawalVolume
  );
  pool.cumulativeTotalVolumeUSD = pool.cumulativeDepositVolumeUSD.plus(
    pool.cumulativeWithdrawalVolumeUSD
  );
  protocol.cumulativeTotalVolumeUSD = protocol.cumulativeDepositVolumeUSD.plus(
    pool.cumulativeWithdrawalVolumeUSD
  );

  pool.netVolume = pool.cumulativeDepositVolume.minus(
    pool.cumulativeWithdrawalVolume
  );
  pool.netVolumeUSD = pool.cumulativeDepositVolumeUSD.minus(
    pool.cumulativeWithdrawalVolumeUSD
  );
  protocol.netVolumeUSD = protocol.cumulativeDepositVolumeUSD.minus(
    pool.cumulativeWithdrawalVolumeUSD
  );

  pool.save();
  protocol.save();
}

export function updateUsage(
  poolAddress: Address,
  accountAddress: Address,
  isDeposit: boolean,
  amount: BigInt,
  amountUSD: BigDecimal,
  eventID: Bytes
): void {
  const protocol = getOrCreateProtocol();
  const pool = getPool(poolAddress);
  const account = getOrCreateAccount(accountAddress);

  if (isDeposit) {
    if (!account.deposits.length) {
      protocol.cumulativeUniqueDepositors += INT_ONE;
      account.deposits = addToArrayAtIndex(account.deposits, eventID);
    }

    pool.cumulativeDepositCount += INT_ONE;
    protocol.cumulativeDepositCount += INT_ONE;
  } else {
    amount = amount.times(BIGINT_MINUS_ONE);
    amountUSD = amountUSD.times(BIGDECIMAL_MINUS_ONE);

    if (!account.withdrawsQueued.length && !account.withdrawsCompleted.length) {
      protocol.cumulativeUniqueWithdrawers += INT_ONE;
      account.withdrawsQueued = addToArrayAtIndex(
        account.withdrawsQueued,
        eventID
      );
    }

    pool.cumulativeWithdrawalCount += INT_ONE;
    protocol.cumulativeWithdrawalCount += INT_ONE;
  }
  pool.cumulativeTransactionCount += INT_ONE;
  protocol.cumulativeTransactionCount += INT_ONE;

  if (!account.pools.includes(pool.id)) {
    pool.cumulativeUniqueDepositors += INT_ONE;

    let pools = account.pools;
    let poolBalance = account.poolBalance;
    let poolBalanceUSD = account.poolBalanceUSD;
    let _hasWithdrawnFromPool = account._hasWithdrawnFromPool;

    pools = addToArrayAtIndex(pools, pool.id);
    poolBalance = addToArrayAtIndex(poolBalance, amount);
    poolBalanceUSD = addToArrayAtIndex(poolBalanceUSD, amountUSD);
    _hasWithdrawnFromPool = addToArrayAtIndex(_hasWithdrawnFromPool, false);

    accountArraySort(pools, poolBalance, poolBalanceUSD, _hasWithdrawnFromPool);

    account.pools = pools;
    account.poolBalance = poolBalance;
    account.poolBalanceUSD = poolBalanceUSD;
    account._hasWithdrawnFromPool = _hasWithdrawnFromPool;
  } else {
    const index = account.pools.indexOf(pool.id);

    if (!isDeposit) {
      if (!account._hasWithdrawnFromPool[index]) {
        pool.cumulativeUniqueWithdrawers += INT_ONE;
      }
      account._hasWithdrawnFromPool = updateArrayAtIndex(
        account._hasWithdrawnFromPool,
        true,
        index
      );
    }

    const newPoolBalance = account.poolBalance[index].plus(amount);
    const newPoolBalanceUSD = account.poolBalanceUSD[index].plus(amountUSD);

    account.poolBalance = updateArrayAtIndex(
      account.poolBalance,
      newPoolBalance,
      index
    );
    account.poolBalanceUSD = updateArrayAtIndex(
      account.poolBalanceUSD,
      newPoolBalanceUSD,
      index
    );
  }
  account.totalValueLockedUSD = account.totalValueLockedUSD.plus(amountUSD);

  account.save();
  pool.save();
  protocol.save();
}
