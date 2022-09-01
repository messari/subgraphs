import {
  DistributeReward,
  GaugeCreated,
  GaugeKilled,
  GaugeRevived,
} from "../../generated/Voter/Voter";

export function handleGaugeCreated(event: GaugeCreated): void {}

export function handleGaugeKilled(event: GaugeKilled): void {}

export function handleGaugeRevived(event: GaugeRevived): void {}

export function handleDistributeReward(event: DistributeReward): void {}
