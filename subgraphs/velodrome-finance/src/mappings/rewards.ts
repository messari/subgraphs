import { Address } from "@graphprotocol/graph-ts";
import {
  Deposit,
  DistributeReward,
  GaugeCreated,
  GaugeKilled,
  GaugeRevived,
  Withdraw,
} from "../../generated/Voter/Voter";
import { updatePoolMetrics } from "../common/metrics";
import { createLiquidityGauge } from "./helpers/entities";
import {
  createGauge,
  killGauge,
  updateRewards,
  updateStaked,
} from "./helpers/rewards";
import { getLiquidityPool, getLiquidityGauge } from "../common/getters";

export function handleGaugeCreated(event: GaugeCreated): void {
  const pool = getLiquidityPool(event.params.pool);
  if (!pool) return;

  const gauge = createLiquidityGauge(
    event.params.gauge,
    Address.fromString(pool.id)
  );

  createGauge(pool);
  updatePoolMetrics(Address.fromString(gauge.pool), pool, event.block);
}

export function handleGaugeKilled(event: GaugeKilled): void {
  const gauge = getLiquidityGauge(event.params.gauge);
  if (!gauge) return;

  const pool = getLiquidityPool(Address.fromString(gauge.pool));
  if (!pool) return;

  killGauge(pool, gauge);
  updatePoolMetrics(Address.fromString(gauge.pool), pool, event.block);
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
  updatePoolMetrics(Address.fromString(gauge.pool), pool, event.block);
}

// Withdraws of LP tokens from gauges
export function handleWithdraw(event: Withdraw): void {
  const gauge = getLiquidityGauge(event.params.gauge);
  if (!gauge) return;

  const pool = getLiquidityPool(Address.fromString(gauge.pool));
  if (!pool) return;

  updateStaked(pool, event.params.amount, false);
  updatePoolMetrics(Address.fromString(gauge.pool), pool, event.block);
}

export function handleDistributeReward(event: DistributeReward): void {
  const gauge = getLiquidityGauge(event.params.gauge);
  if (!gauge) return;

  const pool = getLiquidityPool(Address.fromString(gauge.pool));
  if (!pool) return;

  updateRewards(pool, event.params.amount);
  updatePoolMetrics(Address.fromString(gauge.pool), pool, event.block);
}
