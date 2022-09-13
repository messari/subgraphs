import { Address } from "@graphprotocol/graph-ts";
import {
  DistributeReward,
  GaugeCreated,
  GaugeKilled,
  GaugeRevived
} from "../../generated/Voter/Voter";
import { updatePoolMetrics } from "../common/metrics";
import { getOrCreateGauge } from "./helpers/entities";
import { createGauge, killGauge, updateRewards } from "./helpers/rewards";

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

export function handleDistributeReward(event: DistributeReward): void {
  updateRewards(event);
  let gauge = getOrCreateGauge(event.params.gauge);
  updatePoolMetrics(Address.fromString(gauge.pool), event.block);
}
