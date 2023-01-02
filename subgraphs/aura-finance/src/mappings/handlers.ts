import { dataSource, BigInt, Address } from "@graphprotocol/graph-ts";

import {
  createPoolAdd,
  createPoolShutdown,
  createDeposit,
  createWithdraw,
  createFeesUpdate,
  createRewardAdd,
} from "./helpers";
import {
  updateUsageMetrics,
  updateFinancials,
  updateVaultSnapshots,
  updateRewards,
} from "../common/metrics";
import { ZERO_ADDRESS } from "../common/constants";

import {
  PoolAdded,
  Deposited,
  Withdrawn,
  FeesUpdated,
  PoolShutdown,
} from "../../generated/Booster-v1/Booster";
import {
  BaseRewardPool,
  RewardAdded,
  RewardPaid,
} from "../../generated/Booster-v1/BaseRewardPool";

export function handlePoolAdded(event: PoolAdded): void {
  const boosterAddr = dataSource.address();

  createPoolAdd(boosterAddr, event);
}

export function handlePoolShutdown(event: PoolShutdown): void {
  const boosterAddr = dataSource.address();

  createPoolShutdown(boosterAddr, event);
}

export function handleDeposited(event: Deposited): void {
  const boosterAddr = dataSource.address();
  const poolId = event.params.poolid;

  createDeposit(boosterAddr, poolId, event);

  updateUsageMetrics(event);
  updateFinancials(event);
  updateVaultSnapshots(boosterAddr, poolId, event);
}

export function handleWithdrawn(event: Withdrawn): void {
  const boosterAddr = dataSource.address();
  const poolId = event.params.poolid;

  createWithdraw(boosterAddr, poolId, event);

  updateFinancials(event);
  updateUsageMetrics(event);
  updateVaultSnapshots(boosterAddr, poolId, event);
}

export function handleFeesUpdated(event: FeesUpdated): void {
  const boosterAddr = dataSource.address();

  createFeesUpdate(boosterAddr, event);
}

export function handleRewardAdded(event: RewardAdded): void {
  const context = dataSource.context();
  const poolId = BigInt.fromString(context.getString("poolId"));
  const rewardPoolAddr = event.address;

  const rewardPoolContract = BaseRewardPool.bind(rewardPoolAddr);
  const operatorCall = rewardPoolContract.try_operator();

  let boosterAddr = Address.fromString(ZERO_ADDRESS);
  if (!operatorCall.reverted) {
    boosterAddr = operatorCall.value;
  }

  createRewardAdd(boosterAddr, poolId, event);

  updateFinancials(event);
  updateVaultSnapshots(boosterAddr, poolId, event);
}

export function handleRewardPaid(event: RewardPaid): void {
  const context = dataSource.context();
  const poolId = BigInt.fromString(context.getString("poolId"));
  const rewardPoolAddr = event.address;

  const rewardPoolContract = BaseRewardPool.bind(rewardPoolAddr);
  const operatorCall = rewardPoolContract.try_operator();

  let boosterAddr = Address.fromString(ZERO_ADDRESS);
  if (!operatorCall.reverted) {
    boosterAddr = operatorCall.value;
  }

  updateRewards(boosterAddr, poolId, rewardPoolAddr, event);

  updateUsageMetrics(event);
  updateVaultSnapshots(boosterAddr, poolId, event);
}
