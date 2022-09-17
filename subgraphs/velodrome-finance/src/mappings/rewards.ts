import { Address } from "@graphprotocol/graph-ts";
import {
  Deposit,
  DistributeReward,
  GaugeCreated,
  GaugeKilled,
  GaugeRevived,
  Withdraw
} from "../../generated/Voter/Voter";
import { updatePoolMetrics } from "../common/metrics";
import { getOrCreateGauge } from "./helpers/entities";
import { createGauge, killGauge, updateRewards, updateStaked } from "./helpers/rewards";

export function handleGaugeCreated(event: GaugeCreated): void {
  createGauge(event);
  let gauge = getOrCreateGauge(event.params.gauge);
  updatePoolMetrics(Address.fromString(gauge.pool), event.block);
}

export function handleGaugeKilled(event: GaugeKilled): void {
  killGauge(event);
  let gauge = getOrCreateGauge(event.params.gauge);
  updatePoolMetrics(Address.fromString(gauge.pool), event.block);
}

export function handleGaugeRevived(event: GaugeRevived): void {
  let gauge = getOrCreateGauge(event.params.gauge);
  gauge.active = true;
  gauge.save();
}

// Deposits of LP tokens into gauges
export function handleDeposit(event: Deposit): void {
  updateStaked(event.params.gauge, event.params.amount, true)
  let gauge = getOrCreateGauge(event.params.gauge)
  updatePoolMetrics(Address.fromString(gauge.pool), event.block);
}

// Withdraws of LP tokens from gauges
export function handleWithdraw(event: Withdraw): void {
  updateStaked(event.params.gauge, event.params.amount, false)
  let gauge = getOrCreateGauge(event.params.gauge)
  updatePoolMetrics(Address.fromString(gauge.pool), event.block);
}

export function handleDistributeReward(event: DistributeReward): void {
  updateRewards(event);
  let gauge = getOrCreateGauge(event.params.gauge);
  updatePoolMetrics(Address.fromString(gauge.pool), event.block);
}
