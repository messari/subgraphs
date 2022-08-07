import { NewGauge } from "../../generated/GaugeController/GaugeController";
import { Gauge as GaugeTemplate } from "../../generated/templates";

export function handleNewGauge(event: NewGauge): void {
  const gaugeAddress = event.params.addr;

  GaugeTemplate.create(gaugeAddress);
}
