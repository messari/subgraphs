import { dataSource, BigInt } from "@graphprotocol/graph-ts";

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

import {
  PoolAdded,
  Deposited,
  Withdrawn,
  FeesUpdated,
  PoolShutdown,
} from "../../generated/Booster/Booster";
import {
  RewardAdded,
  RewardPaid,
} from "../../generated/Booster/BaseRewardPool";

export function handlePoolAdded(event: PoolAdded): void {
  createPoolAdd(event);
}

export function handlePoolShutdown(event: PoolShutdown): void {
  createPoolShutdown(event);
}

export function handleDeposited(event: Deposited): void {
  const poolId = event.params.poolid;

  createDeposit(poolId, event);

  updateUsageMetrics(event);
  updateFinancials(event);
  updateVaultSnapshots(poolId, event);
}

export function handleWithdrawn(event: Withdrawn): void {
  const poolId = event.params.poolid;

  createWithdraw(poolId, event);

  updateFinancials(event);
  updateUsageMetrics(event);
  updateVaultSnapshots(poolId, event);
}

export function handleFeesUpdated(event: FeesUpdated): void {
  createFeesUpdate(event);
}

export function handleRewardAdded(event: RewardAdded): void {
  const context = dataSource.context();
  const poolId = BigInt.fromString(context.getString("poolId"));

  createRewardAdd(poolId, event);

  updateFinancials(event);
  updateVaultSnapshots(poolId, event);
}

export function handleRewardPaid(event: RewardPaid): void {
  const context = dataSource.context();
  const poolId = BigInt.fromString(context.getString("poolId"));

  const poolRewardsAddress = event.address;

  updateRewards(poolId, poolRewardsAddress, event);

  updateUsageMetrics(event);
  updateVaultSnapshots(poolId, event);
}
