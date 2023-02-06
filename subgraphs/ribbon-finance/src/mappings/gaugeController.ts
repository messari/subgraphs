import * as constants from "../common/constants";
import { Address, log } from "@graphprotocol/graph-ts";
import { getOrCreateLiquidityGauge } from "../common/initializers";
import { NewGauge } from "../../generated/GaugeController/GaugeController";

export function handleNewGauge(event: NewGauge): void {
  const gaugeAddress = event.params.addr;
  if (gaugeAddress.equals(constants.NULL.TYPE_ADDRESS)) return;
  const liquidityGauge = getOrCreateLiquidityGauge(gaugeAddress);
  const vaultAddress = Address.fromString(liquidityGauge.vault);
  if (vaultAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  log.warning("[NewGauge]  GaugeAddress: {}, vaultAddress:{}, TxnHash: {}", [
    gaugeAddress.toHexString(),
    vaultAddress.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
}
