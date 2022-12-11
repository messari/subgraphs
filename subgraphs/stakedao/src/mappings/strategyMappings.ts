import * as utils from "../common/utils";
import { Harvested } from "../modules/Strategy";
import {
  SetWithdrawalFeeCall,
  SetPerformanceFeeCall,
  Harvested as HarvestedEvent,
} from "../../generated/templates/Strategy/Strategy";
import { getOrCreateVault } from "../common/initializers";
import { Address, dataSource, log } from "@graphprotocol/graph-ts";

export function handleSetPerformanceFee(call: SetPerformanceFeeCall): void {
  const strategyAddress = call.to;

  const context = dataSource.context();
  const vaultAddress = Address.fromString(context.getString("vaultAddress"));

  const vault = getOrCreateVault(vaultAddress, call.block);

  vault.fees = utils.getVaultFees(vaultAddress, strategyAddress).stringIds();
  vault.save();

  log.warning("[setPerformanceFee] Vault: {}, PerformanceFee: {}, TxHash: {}", [
    vaultAddress.toHexString(),
    call.inputs._performanceFee.toString(),
    call.transaction.hash.toHexString(),
  ]);
}

export function handleSetWithdrawalFee(call: SetWithdrawalFeeCall): void {
  const strategyAddress = call.to;

  const context = dataSource.context();
  const vaultAddress = Address.fromString(context.getString("vaultAddress"));

  const vault = getOrCreateVault(vaultAddress, call.block);

  vault.fees = utils.getVaultFees(vaultAddress, strategyAddress).stringIds();
  vault.save();

  log.warning("[setWithdrawalFee] Vault: {}, withdrawalFee: {}, TxHash: {}", [
    vaultAddress.toHexString(),
    call.inputs._withdrawalFee.toString(),
    call.transaction.hash.toHexString(),
  ]);
}

export function handleHarvested(event: HarvestedEvent): void {
  const strategyAddress = event.address;
  const wantEarned = event.params.wantEarned.toBigDecimal();

  const context = dataSource.context();
  const vaultAddress = Address.fromString(context.getString("vaultAddress"));

  Harvested(
    vaultAddress,
    strategyAddress,
    wantEarned,
    event.transaction,
    event.block
  );
}
