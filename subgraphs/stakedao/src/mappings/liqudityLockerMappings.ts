import * as utils from "../common/utils";
import { log } from "@graphprotocol/graph-ts";
import * as constants from "../common/constants";
import {
  GaugeSet,
  VaultToggled,
} from "../../generated/curveStrategy/LiquidityLockerStrategy";
import { getOrCreateVault } from "../common/initializers";
import { Gauge as GaugeTemplate } from "../../generated/templates";

export function handleGaugeSet(event: GaugeSet): void {
  const tokenAddress = event.params._token;
  const gaugeAddress = event.params._gauge;
  const liquidityLockerStrategyAddress = event.address;

  let multiGaugeAddress = utils.getMultiGaugeFromLiquidityLocker(
    gaugeAddress,
    liquidityLockerStrategyAddress
  );
  GaugeTemplate.create(multiGaugeAddress);

  const vaultAddress = utils.getVaultFromGauge(multiGaugeAddress);
  if (vaultAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  const vault = getOrCreateVault(vaultAddress, event.block);
  vault.fees = utils
    .getLiquidityLockersVaultFees(liquidityLockerStrategyAddress, vaultAddress)
    .stringIds();

  vault.save();

  log.warning(
    "[GaugeSet] - VaultId: {}, tokenAddress: {}, gaugeAddress: {}, TxHash: {}",
    [
      vault.id,
      tokenAddress.toHexString(),
      multiGaugeAddress.toHexString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleVaultToggled(event: VaultToggled): void {
  const vaultAddress = event.params._vault;
  const vault = getOrCreateVault(vaultAddress, event.block);

  log.warning("[VaultToggled] - VaultId: {}, TxHash: {}", [
    vault.id,
    event.transaction.hash.toHexString(),
  ]);
}
