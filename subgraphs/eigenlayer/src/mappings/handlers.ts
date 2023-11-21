import { Address, Bytes, ethereum, log } from "@graphprotocol/graph-ts";

import {
  BIGINT_ZERO,
  ETH_ADDRESS,
  INT_FOUR,
  INT_ONE,
  INT_THREE,
  INT_TWO,
  INT_ZERO,
  PoolType,
  TRANSFER_DATA_TYPE,
  TRANSFER_SIGNATURE,
  WITHDRAWAL_QUEUED_DATA_TYPE,
  WITHDRAWAL_QUEUED_SIGNATURE,
  ZERO_ADDRESS,
} from "../common/constants";
import {
  createPool,
  getOrCreateAccount,
  getOrCreateToken,
  getPool,
  getPoolBalance,
} from "../common/getters";
import {
  updatePoolIsActive,
  updateTVL,
  updateUsage,
  updateVolume,
} from "../common/metrics";
import {
  createDeposit,
  createWithdraw,
  getWithdraw,
  updateWithdraw,
} from "../common/events";
import {
  updateFinancialsDailySnapshot,
  updatePoolDailySnapshot,
  updatePoolHourlySnapshot,
  updateUsageMetricsDailySnapshot,
  updateUsageMetricsHourlySnapshot,
} from "../common/snapshots";

import { PodDeployed } from "../../generated/EigenPodManager/EigenPodManager";
import { EigenPod } from "../../generated/EigenPodManager/EigenPod";
import {
  Deposit,
  ShareWithdrawalQueued,
  StrategyAddedToDepositWhitelist,
  StrategyRemovedFromDepositWhitelist,
  WithdrawalCompleted,
} from "../../generated/StrategyManager/StrategyManager";
import { Strategy } from "../../generated/StrategyManager/Strategy";

/////////////////////////////////////////
/////////// Native Restaking ////////////
/////////////////////////////////////////

export function handlePodDeployed(event: PodDeployed): void {
  const podAddress = event.params.eigenPod;

  // As per communication on EigenLayer's discord, currently native staking is technically not proven restaked
  // i.e. delegateable without the proof system launching in the upcoming M2 release,
  // so that’s why hasRestaked is false for all EigenPods for now.
  // ref: https://discord.com/channels/1089434273720832071/1090553231031140382/1162436943066443846
  let isActive = false;
  const eigenPod = EigenPod.bind(podAddress);
  const hasRestakedCall = eigenPod.try_hasRestaked();
  if (!hasRestakedCall.reverted) {
    isActive = hasRestakedCall.value;
  } else {
    log.warning(
      "[handlePodDeployed] eigenPod.try_hasRestaked reverted for podAddress: {}",
      [event.params.eigenPod.toHexString()]
    );
  }

  const underlyingToken = getOrCreateToken(
    Address.fromString(ETH_ADDRESS),
    event
  );

  const poolName = "EigenPod-" + underlyingToken.name;
  const poolSymbol = "E-" + underlyingToken.symbol;
  createPool(
    podAddress,
    poolName,
    poolSymbol,
    PoolType.EIGEN_POD,
    Address.fromBytes(underlyingToken.id),
    isActive,
    event
  );
}

/////////////////////////////////////////
///////////// LST Restaking /////////////
/////////////////////////////////////////

export function handleStrategyAdded(
  event: StrategyAddedToDepositWhitelist
): void {
  const strategyAddress = event.params.strategy;
  const strategyContract = Strategy.bind(strategyAddress);
  const underlyingTokenCall = strategyContract.try_underlyingToken();
  if (underlyingTokenCall.reverted) {
    log.error(
      "[handleStrategyAdded] strategyContract.try_underlyingToken() reverted for strategy: {}",
      [strategyAddress.toHexString()]
    );
    return;
  }
  const underlyingToken = getOrCreateToken(underlyingTokenCall.value, event);

  const poolName = "Strategy-" + underlyingToken.name;
  const poolSymbol = "S-" + underlyingToken.symbol;
  createPool(
    strategyAddress,
    poolName,
    poolSymbol,
    PoolType.STRATEGY,
    Address.fromBytes(underlyingToken.id),
    true,
    event
  );
}

export function handleStrategyRemoved(
  event: StrategyRemovedFromDepositWhitelist
): void {
  const strategyAddress = event.params.strategy;

  updatePoolIsActive(strategyAddress, false);
}

export function handleDeposit(event: Deposit): void {
  const strategyAddress = event.params.strategy;
  const tokenAddress = event.params.token;
  const depositorAddress = event.params.depositor;
  const shares = event.params.shares;

  const pool = getPool(strategyAddress);
  const token = getOrCreateToken(tokenAddress, event);
  const account = getOrCreateAccount(depositorAddress);

  let amount = BIGINT_ZERO;
  const receipt = event.receipt;
  if (!receipt) {
    log.error("[handleDeposit] No event receipt. Tx: {}", [
      event.transaction.hash.toHexString(),
    ]);
    return;
  }
  const logs = receipt.logs;
  if (!logs) {
    log.error("[handleDeposit] No logs for event receipt. Tx: {}", [
      event.transaction.hash.toHexString(),
    ]);
    return;
  }

  for (let i = 0; i < logs.length; i++) {
    const thisLog = logs.at(i);
    const logTopicSignature = thisLog.topics.at(INT_ZERO);

    if (logTopicSignature.equals(TRANSFER_SIGNATURE)) {
      const logTopicTo = ethereum
        .decode("address", thisLog.topics.at(INT_TWO))!
        .toAddress();

      if (logTopicTo.equals(Address.fromBytes(pool.id))) {
        const decoded = ethereum.decode(TRANSFER_DATA_TYPE, thisLog.data);
        if (!decoded) continue;

        const logData = decoded.toTuple();
        amount = logData[INT_ZERO].toBigInt();
        break;
      }
    }
  }

  const depositID = createDeposit(
    Address.fromBytes(pool.id),
    Address.fromBytes(token.id),
    Address.fromBytes(account.id),
    shares,
    amount,
    event
  );
  updateUsage(
    Address.fromBytes(pool.id),
    Address.fromBytes(token.id),
    Address.fromBytes(account.id),
    true,
    amount,
    depositID,
    event
  );

  const poolBalance = getPoolBalance(Address.fromBytes(pool.id));

  updateTVL(
    Address.fromBytes(pool.id),
    Address.fromBytes(token.id),
    poolBalance,
    event
  );
  updateVolume(
    Address.fromBytes(pool.id),
    Address.fromBytes(token.id),
    true,
    amount,
    event
  );
  updatePoolHourlySnapshot(Address.fromBytes(pool.id), event);
  updatePoolDailySnapshot(
    Address.fromBytes(pool.id),
    Address.fromBytes(token.id),
    true,
    amount,
    event
  );
  updateUsageMetricsHourlySnapshot(Address.fromBytes(account.id), event);
  updateUsageMetricsDailySnapshot(
    Address.fromBytes(account.id),
    true,
    depositID,
    event
  );
  updateFinancialsDailySnapshot(
    Address.fromBytes(token.id),
    true,
    amount,
    event
  );
}

export function handleShareWithdrawalQueued(
  event: ShareWithdrawalQueued
): void {
  const depositorAddress = event.params.depositor;
  const nonce = event.params.nonce;
  const strategyAddress = event.params.strategy;
  const shares = event.params.shares;

  const pool = getPool(strategyAddress);
  const token = getOrCreateToken(Address.fromBytes(pool.inputTokens[0]), event);
  const account = getOrCreateAccount(depositorAddress);

  let withdrawerAddress = Address.fromString(ZERO_ADDRESS);
  let delegatedAddress = Address.fromString(ZERO_ADDRESS);
  let withdrawalRoot = Bytes.empty();

  const receipt = event.receipt;
  if (!receipt) {
    log.error("[handleShareWithdrawalQueued] No event receipt. Tx: {}", [
      event.transaction.hash.toHexString(),
    ]);
    return;
  }
  const logs = receipt.logs;
  if (!logs) {
    log.error(
      "[handleShareWithdrawalQueued] No logs for event receipt. Tx: {}",
      [event.transaction.hash.toHexString()]
    );
    return;
  }

  for (let i = 0; i < logs.length; i++) {
    const thisLog = logs.at(i);
    const logTopicSignature = thisLog.topics.at(INT_ZERO);

    if (logTopicSignature.equals(WITHDRAWAL_QUEUED_SIGNATURE)) {
      const decoded = ethereum.decode(
        WITHDRAWAL_QUEUED_DATA_TYPE,
        thisLog.data
      );
      if (!decoded) continue;

      const logData = decoded.toTuple();
      withdrawerAddress = logData[INT_TWO].toAddress();
      delegatedAddress = logData[INT_THREE].toAddress();
      withdrawalRoot = logData[INT_FOUR].toBytes();
      break;
    }
  }

  createWithdraw(
    Address.fromBytes(pool.id),
    Address.fromBytes(token.id),
    Address.fromBytes(account.id),
    withdrawerAddress,
    delegatedAddress,
    withdrawalRoot,
    nonce,
    shares,
    event
  );
}

export function handleWithdrawalCompleted(event: WithdrawalCompleted): void {
  const depositorAddress = event.params.depositor;
  const withdrawalRoot = event.params.withdrawalRoot;

  const withdraw = getWithdraw(depositorAddress, withdrawalRoot);
  if (!withdraw) return;

  const withdrawID = withdraw.id;
  const poolID = withdraw.pool;
  const tokenID = withdraw.token;
  const accountID = withdraw.depositor;

  let amount = BIGINT_ZERO;
  const receipt = event.receipt;
  if (!receipt) {
    log.error("[handleWithdrawalCompleted] No event receipt. Tx: {}", [
      event.transaction.hash.toHexString(),
    ]);
    return;
  }
  const logs = receipt.logs;
  if (!logs) {
    log.error("[handleWithdrawalCompleted] No logs for event receipt. Tx: {}", [
      event.transaction.hash.toHexString(),
    ]);
    return;
  }

  for (let i = 0; i < logs.length; i++) {
    const thisLog = logs.at(i);
    const logTopicSignature = thisLog.topics.at(INT_ZERO);

    if (logTopicSignature.equals(TRANSFER_SIGNATURE)) {
      const logTopicFrom = ethereum
        .decode("address", thisLog.topics.at(INT_ONE))!
        .toAddress();

      if (logTopicFrom.equals(Address.fromBytes(poolID))) {
        const decoded = ethereum.decode(TRANSFER_DATA_TYPE, thisLog.data);
        if (!decoded) continue;

        const logData = decoded.toTuple();
        amount = logData[INT_ZERO].toBigInt();
        break;
      }
    }
  }

  updateUsage(
    Address.fromBytes(poolID),
    Address.fromBytes(tokenID),
    Address.fromBytes(accountID),
    false,
    amount,
    withdrawID,
    event
  );

  const poolBalance = getPoolBalance(Address.fromBytes(poolID));

  updateTVL(
    Address.fromBytes(poolID),
    Address.fromBytes(tokenID),
    poolBalance,
    event
  );
  updateVolume(
    Address.fromBytes(poolID),
    Address.fromBytes(tokenID),
    false,
    amount,
    event
  );
  updatePoolHourlySnapshot(Address.fromBytes(poolID), event);
  updatePoolDailySnapshot(
    Address.fromBytes(poolID),
    Address.fromBytes(tokenID),
    false,
    amount,
    event
  );
  updateUsageMetricsHourlySnapshot(Address.fromBytes(accountID), event);
  updateUsageMetricsDailySnapshot(
    Address.fromBytes(accountID),
    false,
    withdrawID,
    event
  );
  updateFinancialsDailySnapshot(
    Address.fromBytes(tokenID),
    false,
    amount,
    event
  );
  updateWithdraw(
    Address.fromBytes(accountID),
    Address.fromBytes(tokenID),
    withdrawID,
    amount,
    event
  );
}
