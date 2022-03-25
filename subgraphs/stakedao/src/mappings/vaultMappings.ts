import {
  DepositCall,
  WithdrawCall,
  SetGaugeCall,
  DepositAllCall,
  WithdrawAllCall,
  Vault as VaultContract,
} from "../../generated/templates/Vault/Vault";

import { BigInt, log } from "@graphprotocol/graph-ts";
import { Vault as VaultStore } from "../../generated/schema";
import { Gauge as GaugeTemplate } from "../../generated/templates";
import { _Deposit, createDepositTransaction } from "../modules/Deposit";
import { updateFinancials, updateUsageMetrics } from "../modules/Metrics";
import { createWithdrawTransaction, _Withdraw } from "../modules/Withdraw";

export function handleDeposit(call: DepositCall): void {
  const vaultAddress = call.to.toHexString();
  const vault = VaultStore.load(vaultAddress);

  if (vault) {
    let _depositAmount = call.inputs._amount;

    let amountUSD = _Deposit(vault, _depositAmount);
    createDepositTransaction(call, _depositAmount, amountUSD);
  }
  updateUsageMetrics(call.block.number, call.block.timestamp, call.from);
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
    let amountUSD = _Deposit(vault, _depositAmount);

    log.warning(
      "[handleDepositAll] TxHash: {}, prev_Balance: {}, _depositAmount: {}",
      [
        call.transaction.hash.toHexString(),
        prev_Balance.toString(),
        _depositAmount.toString(),
      ]
    );
    createDepositTransaction(call, _depositAmount, amountUSD);
  }
  updateUsageMetrics(call.block.number, call.block.timestamp, call.from);
  updateFinancials(call.block.number, call.block.timestamp);
}

export function handleWithdraw(call: WithdrawCall): void {
  const vaultAddress = call.to.toHexString();
  const vault = VaultStore.load(vaultAddress);

  if (vault) {
    let _sharesBurnt = call.inputs._shares;

    let values = _Withdraw(vault, _sharesBurnt);
    createWithdrawTransaction(call, values[0], values[1].toBigDecimal());
  }
  updateUsageMetrics(call.block.number, call.block.timestamp, call.from);
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
    let values = _Withdraw(vault, _sharesBurnt);
    createWithdrawTransaction(call, values[0], values[1].toBigDecimal());

    log.warning(
      "[handleWithdrawAll] TxHash: {}, prev_TotalSupply: {}, _sharesBurnt: {}, _withdrawAmount: {}",
      [
        call.transaction.hash.toHexString(),
        prev_TotalSupply.toString(),
        _sharesBurnt.toString(),
        values[0].toString(),
      ]
    );
  }
  updateUsageMetrics(call.block.number, call.block.timestamp, call.from);
  updateFinancials(call.block.number, call.block.timestamp);
}

export function handleSetGauge(call: SetGaugeCall): void {
  const gaugeAddress = call.inputs._gauge;
  GaugeTemplate.create(gaugeAddress)
}