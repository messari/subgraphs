import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";

import {
  getOrCreateAccount,
  getOrCreateProtocol,
  getOrCreateToken,
  getPool,
} from "./getters";
import {
  accountArraySort,
  addToArrayAtIndex,
  bigIntToBigDecimal,
  updateArrayAtIndex,
} from "./utils";
import { BIGINT_MINUS_ONE, INT_ONE } from "./constants";

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
  tokenAddress: Address,
  isDeposit: boolean,
  amount: BigInt,
  event: ethereum.Event
): void {
  const protocol = getOrCreateProtocol();
  const pool = getPool(poolAddress);
  const token = getOrCreateToken(tokenAddress, event);

  if (isDeposit) {
    pool.inputTokenBalances = [pool.inputTokenBalances[0].plus(amount)];
  } else {
    pool.inputTokenBalances = [pool.inputTokenBalances[0].minus(amount)];
  }
  pool.inputTokenBalancesUSD = [
    bigIntToBigDecimal(pool.inputTokenBalances[0]).times(token.lastPriceUSD!),
  ];

  const oldPoolTVL = pool.totalValueLockedUSD;
  pool.totalValueLockedUSD = pool.inputTokenBalancesUSD[0];
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(
    pool.totalValueLockedUSD.minus(oldPoolTVL)
  );

  pool.save();
  protocol.save();
}

export function updateVolume(
  poolAddress: Address,
  tokenAddress: Address,
  isDeposit: boolean,
  amount: BigInt,
  event: ethereum.Event
): void {
  const protocol = getOrCreateProtocol();
  const pool = getPool(poolAddress);
  const token = getOrCreateToken(tokenAddress, event);

  if (isDeposit) {
    pool.cumulativeDepositVolumeAmount =
      pool.cumulativeDepositVolumeAmount.plus(amount);

    const oldPoolCumulativeDepositVolumeUSD = pool.cumulativeDepositVolumeUSD;
    pool.cumulativeDepositVolumeUSD = bigIntToBigDecimal(
      pool.cumulativeDepositVolumeAmount
    ).times(token.lastPriceUSD!);
    protocol.cumulativeDepositVolumeUSD =
      protocol.cumulativeDepositVolumeUSD.plus(
        pool.cumulativeDepositVolumeUSD.minus(oldPoolCumulativeDepositVolumeUSD)
      );
  } else {
    pool.cumulativeWithdrawalVolumeAmount =
      pool.cumulativeWithdrawalVolumeAmount.plus(amount);

    const oldPoolCumulativeWithdrawalVolumeUSD =
      pool.cumulativeWithdrawalVolumeUSD;
    pool.cumulativeWithdrawalVolumeUSD = bigIntToBigDecimal(
      pool.cumulativeWithdrawalVolumeAmount
    ).times(token.lastPriceUSD!);
    protocol.cumulativeWithdrawalVolumeUSD =
      protocol.cumulativeWithdrawalVolumeUSD.plus(
        pool.cumulativeWithdrawalVolumeUSD.minus(
          oldPoolCumulativeWithdrawalVolumeUSD
        )
      );
  }
  pool.cumulativeTotalVolumeAmount = pool.cumulativeDepositVolumeAmount.plus(
    pool.cumulativeWithdrawalVolumeAmount
  );
  pool.cumulativeTotalVolumeUSD = pool.cumulativeDepositVolumeUSD.plus(
    pool.cumulativeWithdrawalVolumeUSD
  );
  protocol.cumulativeTotalVolumeUSD = protocol.cumulativeDepositVolumeUSD.plus(
    protocol.cumulativeWithdrawalVolumeUSD
  );

  pool.netVolumeAmount = pool.cumulativeDepositVolumeAmount.minus(
    pool.cumulativeWithdrawalVolumeAmount
  );
  pool.netVolumeUSD = pool.cumulativeDepositVolumeUSD.minus(
    pool.cumulativeWithdrawalVolumeUSD
  );
  protocol.netVolumeUSD = protocol.cumulativeDepositVolumeUSD.minus(
    protocol.cumulativeWithdrawalVolumeUSD
  );

  pool.save();
  protocol.save();
}

export function updateUsage(
  poolAddress: Address,
  tokenAddress: Address,
  accountAddress: Address,
  isDeposit: boolean,
  amount: BigInt,
  eventID: Bytes,
  event: ethereum.Event
): void {
  const protocol = getOrCreateProtocol();
  const pool = getPool(poolAddress);
  const account = getOrCreateAccount(accountAddress);
  const token = getOrCreateToken(tokenAddress, event);

  if (
    !account.deposits.length &&
    !account.withdrawsQueued.length &&
    !account.withdrawsCompleted.length
  ) {
    protocol.cumulativeUniqueUsers += INT_ONE;
  }

  if (isDeposit) {
    if (!account.deposits.length) {
      protocol.cumulativeUniqueDepositors += INT_ONE;
    }
    account.deposits = addToArrayAtIndex(account.deposits, eventID);
    pool.cumulativeDepositCount += INT_ONE;
    protocol.cumulativeDepositCount += INT_ONE;
  } else {
    amount = amount.times(BIGINT_MINUS_ONE);

    if (!account.withdrawsQueued.length && !account.withdrawsCompleted.length) {
      protocol.cumulativeUniqueWithdrawers += INT_ONE;
    }

    pool.cumulativeWithdrawalCount += INT_ONE;
    protocol.cumulativeWithdrawalCount += INT_ONE;
  }
  pool.cumulativeTransactionCount += INT_ONE;
  protocol.cumulativeTransactionCount += INT_ONE;

  if (!account.pools.includes(pool.id)) {
    pool.cumulativeUniqueDepositors += INT_ONE;

    let pools = account.pools;
    let poolBalances = account.poolBalances;
    let poolBalancesUSD = account.poolBalancesUSD;
    let _hasWithdrawnFromPool = account._hasWithdrawnFromPool;

    pools = addToArrayAtIndex(pools, pool.id);
    poolBalances = addToArrayAtIndex(poolBalances, amount);
    poolBalancesUSD = addToArrayAtIndex(
      poolBalancesUSD,
      bigIntToBigDecimal(amount).times(token.lastPriceUSD!)
    );
    _hasWithdrawnFromPool = addToArrayAtIndex(_hasWithdrawnFromPool, false);

    accountArraySort(
      pools,
      poolBalances,
      poolBalancesUSD,
      _hasWithdrawnFromPool
    );

    account.pools = pools;
    account.poolBalances = poolBalances;
    account.poolBalancesUSD = poolBalancesUSD;
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

    const newPoolBalances = account.poolBalances[index].plus(amount);
    const newPoolBalancesUSD = account.poolBalancesUSD[index].plus(
      bigIntToBigDecimal(newPoolBalances).times(token.lastPriceUSD!)
    );

    account.poolBalances = updateArrayAtIndex(
      account.poolBalances,
      newPoolBalances,
      index
    );
    account.poolBalancesUSD = updateArrayAtIndex(
      account.poolBalancesUSD,
      newPoolBalancesUSD,
      index
    );
  }

  account.save();
  pool.save();
  protocol.save();
}
