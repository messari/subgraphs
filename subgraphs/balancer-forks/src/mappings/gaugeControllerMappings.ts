import {
  NewGauge,
  RewardsOnlyGaugeCreated,
} from "../../generated/GaugeController/GaugeController";
import { Gauge as GaugeTemplate } from "../../generated/templates";

export function handleNewGauge(event: NewGauge): void {
  const gaugeAddress = event.params.addr;

  GaugeTemplate.create(gaugeAddress);
}

export function handleRewardsOnlyGaugeCreated(
  event: RewardsOnlyGaugeCreated
): void {
  const gaugeAddress = event.params.gauge;

  GaugeTemplate.create(gaugeAddress);
}
