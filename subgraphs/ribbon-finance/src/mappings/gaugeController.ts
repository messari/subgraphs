import * as constants from "../common/constants";
import { getOrCreateLiquidityGauge } from "../common/initializers";
import { NewGauge } from "../../generated/templates/LiquidityGauge/GaugeController";

export function handleNewGauge(event: NewGauge): void {
  const gaugeAddress = event.params.addr;
  if (gaugeAddress.equals(constants.NULL.TYPE_ADDRESS)) return;
  getOrCreateLiquidityGauge(gaugeAddress);
}
