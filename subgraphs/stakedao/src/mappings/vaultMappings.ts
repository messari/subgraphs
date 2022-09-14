import {
  DepositCall,
  WithdrawCall,
  SetGaugeCall,
} from "../../generated/templates/Vault/Vault";
import { _Deposit } from "../modules/Deposit";
import { _Withdraw } from "../modules/Withdraw";
import { Vault as VaultStore } from "../../generated/schema";
import { Gauge as GaugeTemplate } from "../../generated/templates";
import { updateFinancials, updateUsageMetrics, updateVaultSnapshots } from "../modules/Metrics";

export function handleDeposit(call: DepositCall): void {
  const vaultAddress = call.to;
  const depositAmount = call.inputs._amount;
  const vault = VaultStore.load(vaultAddress.toHexString());

  if (vault) {
    _Deposit(call.to, call.transaction, call.block, vault, depositAmount);
  }
  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleWithdraw(call: WithdrawCall): void {
  const vaultAddress = call.to;
  const vault = VaultStore.load(vaultAddress.toHexString());

  if (vault) {
    let _sharesBurnt = call.inputs._shares;

    _Withdraw(
      call.to,
      call.transaction,
      call.block,
      vault,
      _sharesBurnt
    );
  }
  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleSetGauge(call: SetGaugeCall): void {
  const gaugeAddress = call.inputs._gauge;
  GaugeTemplate.create(gaugeAddress);
}
