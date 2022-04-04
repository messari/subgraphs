import {
  DepositCall,
  WithdrawCall,
  SetGaugeCall,
  DepositAllCall,
  WithdrawAllCall,
  Vault as VaultContract,
} from "../../generated/templates/Vault/Vault";

import { _Deposit,  } from "../modules/Deposit";
import { _Withdraw } from "../modules/Withdraw";
import { BigInt, log } from "@graphprotocol/graph-ts";
import { Vault as VaultStore } from "../../generated/schema";
import { Gauge as GaugeTemplate } from "../../generated/templates";
import { updateFinancials, updateUsageMetrics } from "../modules/Metrics";

export function handleDeposit(call: DepositCall): void {
  const vaultAddress = call.to.toHexString();
  const vault = VaultStore.load(vaultAddress);

  if (vault) {
    let _depositAmount = call.inputs._amount;

    _Deposit(call, vault, _depositAmount);
  }
  updateUsageMetrics(call.block, call.from);
  updateFinancials(call.block.number, call.block.timestamp);
}

export function handleDepositAll(call: DepositAllCall): void {
  const vaultAddress = call.to.toHexString();
  const vault = VaultStore.load(vaultAddress);
  const vaultContract = VaultContract.bind(call.to);

  if (vault) {
    let prev_Balance = BigInt.fromString(
      vault.inputTokenBalances[0].toString()
    );
    let new_Balance = vaultContract.balance();
    let _depositAmount = new_Balance.minus(prev_Balance);
    
    _Deposit(call, vault, _depositAmount);

    log.warning(
      "[handleDepositAll] TxHash: {}, prev_Balance: {}, _depositAmount: {}",
      [
        call.transaction.hash.toHexString(),
        prev_Balance.toString(),
        _depositAmount.toString(),
      ]
    );
  }
  updateUsageMetrics(call.block, call.from);
  updateFinancials(call.block.number, call.block.timestamp);
}

export function handleWithdraw(call: WithdrawCall): void {
  const vaultAddress = call.to.toHexString();
  const vault = VaultStore.load(vaultAddress);

  if (vault) {
    let _sharesBurnt = call.inputs._shares;

    _Withdraw(call, vault, _sharesBurnt);
  }
  updateUsageMetrics(call.block, call.from);
  updateFinancials(call.block.number, call.block.timestamp);
}

export function handleWithdrawAll(call: WithdrawAllCall): void {
  const vaultAddress = call.to.toHexString();
  const vault = VaultStore.load(vaultAddress);
  const vaultContract = VaultContract.bind(call.to);

  if (vault) {
    let new_TotalSupply = vaultContract.totalSupply();
    let prev_TotalSupply = BigInt.fromString(
      vault.outputTokenSupply.toString()
    );

    let _sharesBurnt = prev_TotalSupply.minus(new_TotalSupply);
    
    _Withdraw(call, vault, _sharesBurnt);

    log.warning(
      "[handleWithdrawAll] TxHash: {}, prev_TotalSupply: {}, _sharesBurnt: {}",
      [
        call.transaction.hash.toHexString(),
        prev_TotalSupply.toString(),
        _sharesBurnt.toString(),
      ]
    );
  }
  updateUsageMetrics(call.block, call.from);
  updateFinancials(call.block.number, call.block.timestamp);
}

export function handleSetGauge(call: SetGaugeCall): void {
  const gaugeAddress = call.inputs._gauge;
  GaugeTemplate.create(gaugeAddress)
}