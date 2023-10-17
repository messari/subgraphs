import { Address, Bytes, ethereum, log } from "@graphprotocol/graph-ts";

import {
  INT_FOUR,
  INT_THREE,
  INT_TWO,
  INT_ZERO,
  PoolType,
  WITHDRAWAL_QUEUED_DATA_TYPE,
  WITHDRAWAL_QUEUED_SIGNATURE,
  ZERO_ADDRESS,
} from "../common/constants";
import {
  createPool,
  getOrCreateAccount,
  getOrCreateToken,
  getPool,
} from "../common/getters";
import {
  updatePoolIsActive,
  updateTVL,
  updateUsage,
  updateVolume,
} from "../common/metrics";

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
import {
  completeWithdraw,
  createDeposit,
  createWithdraw,
} from "../common/events";
import {
  updateFinancialsDailySnapshot,
  updatePoolDailySnapshot,
  updateUsageMetricsDailySnapshot,
} from "../common/snapshots";
import { getUsdPrice } from "../prices";
import { bigIntToBigDecimal } from "../common/utils";

/////////////////////////////////////////
/////////// Native Restaking ////////////
/////////////////////////////////////////

export function handlePodDeployed(event: PodDeployed): void {
  // let hasRestaked = false;
  // const eigenPod = EigenPod.bind(event.params.eigenPod);
  // const hasRestaked = eigenPod.hasRestaked();
  // const restakedGwei = eigenPod.restakedExecutionLayerGwei();
  // const hasRestakedCall = eigenPod.try_hasRestaked();
  // if (!hasRestakedCall.reverted) {
  // hasRestaked = hasRestakedCall.value;
  // } else {
  //   log.warning(
  //     "[handlePodDeployed] eigenPod.try_hasRestaked reverted for podAddress: {}",
  //     [event.params.eigenPod.toHexString()]
  //   );
  // }
  // if (hasRestaked) {
  // log.warning(
  //   "[handlePodDeployed] pod: {} owner: {} hasRestaked: {} restakedGwei: {}",
  //   [
  //     event.params.eigenPod.toHexString(),
  //     event.params.podOwner.toHexString(),
  //     hasRestaked.toString(),
  //     restakedGwei.toString(),
  //   ]
  // );
  // }
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

  const strategyContract = Strategy.bind(strategyAddress);
  const amountCall = strategyContract.try_sharesToUnderlying(shares);
  if (amountCall.reverted) {
    log.error(
      "[handleDeposit] strategyContract.try_sharesToUnderlying() reverted for strategy: {}",
      [strategyAddress.toHexString()]
    );
    return;
  }
  const amount = amountCall.value;
  const amountUSD = getUsdPrice(
    Address.fromBytes(token.id),
    bigIntToBigDecimal(amount, token.decimals),
    event.block
  );

  const depositID = createDeposit(
    Address.fromBytes(pool.id),
    Address.fromBytes(token.id),
    Address.fromBytes(account.id),
    shares,
    amount,
    amountUSD,
    event
  );
  updateUsage(
    Address.fromBytes(pool.id),
    Address.fromBytes(account.id),
    true,
    amount,
    amountUSD,
    depositID
  );
  updateTVL(Address.fromBytes(pool.id), true, amount, amountUSD);
  updateVolume(Address.fromBytes(pool.id), true, amount, amountUSD);
  updatePoolDailySnapshot(
    Address.fromBytes(pool.id),
    true,
    amount,
    amountUSD,
    event
  );
  updateUsageMetricsDailySnapshot(
    Address.fromBytes(account.id),
    true,
    depositID,
    event
  );
  updateFinancialsDailySnapshot(true, amountUSD, event);
}

export function handleShareWithdrawalQueued(
  event: ShareWithdrawalQueued
): void {
  const depositorAddress = event.params.depositor;
  const nonce = event.params.nonce;
  const strategyAddress = event.params.strategy;
  const shares = event.params.shares;

  const pool = getPool(strategyAddress);
  const token = getOrCreateToken(Address.fromBytes(pool.inputToken), event);
  const account = getOrCreateAccount(depositorAddress);

  const strategyContract = Strategy.bind(strategyAddress);
  const amountCall = strategyContract.try_sharesToUnderlying(shares);
  if (amountCall.reverted) {
    log.error(
      "[handleShareWithdrawalQueued] strategyContract.try_sharesToUnderlying() reverted for strategy: {}",
      [strategyAddress.toHexString()]
    );
    return;
  }
  const amount = amountCall.value;
  const amountUSD = getUsdPrice(
    Address.fromBytes(token.id),
    bigIntToBigDecimal(amount, token.decimals),
    event.block
  );

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

  const withdrawID = createWithdraw(
    Address.fromBytes(pool.id),
    Address.fromBytes(token.id),
    Address.fromBytes(account.id),
    withdrawerAddress,
    delegatedAddress,
    withdrawalRoot,
    nonce,
    shares,
    amount,
    amountUSD,
    event
  );
  updateUsage(
    Address.fromBytes(pool.id),
    Address.fromBytes(account.id),
    false,
    amount,
    amountUSD,
    withdrawID
  );
  updateTVL(Address.fromBytes(pool.id), false, amount, amountUSD);
  updateVolume(Address.fromBytes(pool.id), false, amount, amountUSD);
  updatePoolDailySnapshot(
    Address.fromBytes(pool.id),
    false,
    amount,
    amountUSD,
    event
  );
  updateUsageMetricsDailySnapshot(
    Address.fromBytes(account.id),
    false,
    withdrawID,
    event
  );
  updateFinancialsDailySnapshot(false, amountUSD, event);
}

export function handleWithdrawalCompleted(event: WithdrawalCompleted): void {
  const depositorAddress = event.params.depositor;
  const nonce = event.params.nonce;

  completeWithdraw(depositorAddress, nonce, event);
}
