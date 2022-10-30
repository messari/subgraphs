import {
  updateFinancials,
  updateUsageMetrics,
  updateVaultSnapshots,
} from "../modules/Metrics";
import {
  DepositCall,
  WithdrawCall,
  SetGaugeCall,
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
} from "../../generated/templates/Vault/Vault";
import { Deposit } from "../modules/Deposit";
import { Withdraw } from "../modules/Withdraw";
import { Gauge as GaugeTemplate } from "../../generated/templates";
import { SetLiquidityGaugeCall } from "../../generated/Controller/Vault";

export function handleDeposit(call: DepositCall): void {
  const vaultAddress = call.to;
  const depositAmount = call.inputs._amount;

  Deposit(vaultAddress, depositAmount, null, call.transaction, call.block);

  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleDepositEvent(event: DepositEvent): void {
  const vaultAddress = event.address;
  const depositor = event.params._depositor;
  const sharesMinted = event.params._amount;

  Deposit(vaultAddress, null, sharesMinted, event.transaction, event.block);

  updateFinancials(event.block);
  updateUsageMetrics(event.block, depositor);
  updateVaultSnapshots(vaultAddress, event.block);
}

export function handleWithdraw(call: WithdrawCall): void {
  const vaultAddress = call.to;
  const sharesBurnt = call.inputs._shares;

  Withdraw(vaultAddress, null, sharesBurnt, call.transaction, call.block);

  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleWithdrawEvent(event: WithdrawEvent): void {
  const vaultAddress = event.address;
  const depositor = event.params._depositor;
  const sharesBurnt = event.params._amount;
  const withdrawAmount = event.params._amount;

  Withdraw(
    vaultAddress,
    withdrawAmount,
    sharesBurnt,
    event.transaction,
    event.block
  );

  updateFinancials(event.block);
  updateUsageMetrics(event.block, depositor);
  updateVaultSnapshots(vaultAddress, event.block);
}

export function handleSetGauge(call: SetGaugeCall): void {
  const gaugeAddress = call.inputs._gauge;

  GaugeTemplate.create(gaugeAddress);
}

export function handleSetLiquidityGauge(call: SetLiquidityGaugeCall): void {
  const gaugeAddress = call.inputs._liquidityGauge;

  GaugeTemplate.create(gaugeAddress);
}
