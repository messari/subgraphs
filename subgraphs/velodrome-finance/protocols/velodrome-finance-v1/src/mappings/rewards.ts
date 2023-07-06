import { Address } from "@graphprotocol/graph-ts";

import { updatePoolMetrics } from "../../../../src/common/metrics";
import {
  createGauge,
  killGauge,
  updateRewards,
  updateStaked,
} from "../../../../src/mappings/helpers/rewards";
import {
  getLiquidityPool,
  getLiquidityGauge,
} from "../../../../src/common/getters";
import { VELO_ADDRESS } from "../common/constants";

import {
  Deposit,
  DistributeReward,
  GaugeCreated,
  GaugeKilled,
  GaugeRevived,
  Withdraw,
} from "../../../../generated/Voter/Voter";

export function handleGaugeCreated(event: GaugeCreated): void {
  const pool = getLiquidityPool(event.params.pool);
  if (!pool) return;

  createGauge(pool, event.params.gauge, VELO_ADDRESS);
  updatePoolMetrics(pool, event.block);
}

export function handleGaugeKilled(event: GaugeKilled): void {
  const gauge = getLiquidityGauge(event.params.gauge);
  if (!gauge) return;

  const pool = getLiquidityPool(Address.fromString(gauge.pool));
  if (!pool) return;

  killGauge(pool, gauge);
  updatePoolMetrics(pool, event.block);
}

export function handleGaugeRevived(event: GaugeRevived): void {
  const gauge = getLiquidityGauge(event.params.gauge);
  if (!gauge) return;

  gauge.active = true;
  gauge.save();
}

// Deposits of LP tokens into gauges
export function handleDeposit(event: Deposit): void {
  const gauge = getLiquidityGauge(event.params.gauge);
  if (!gauge) return;

  const pool = getLiquidityPool(Address.fromString(gauge.pool));
  if (!pool) return;

  updateStaked(pool, event.params.amount, true);
  updatePoolMetrics(pool, event.block);
}

// Withdraws of LP tokens from gauges
export function handleWithdraw(event: Withdraw): void {
  const gauge = getLiquidityGauge(event.params.gauge);
  if (!gauge) return;

  const pool = getLiquidityPool(Address.fromString(gauge.pool));
  if (!pool) return;

  updateStaked(pool, event.params.amount, false);
  updatePoolMetrics(pool, event.block);
}

export function handleDistributeReward(event: DistributeReward): void {
  const gauge = getLiquidityGauge(event.params.gauge);
  if (!gauge) return;

  const pool = getLiquidityPool(Address.fromString(gauge.pool));
  if (!pool) return;

  updateRewards(pool, event.params.amount);
  updatePoolMetrics(pool, event.block);
}
