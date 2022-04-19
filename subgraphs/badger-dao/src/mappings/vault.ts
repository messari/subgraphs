import {
  Deposit1Call as DepositCallV2,
  DepositAllCall,
  DepositCall,
  DepositFor1Call as DepositForCallV2,
  DepositForCall,
  WithdrawAllCall,
  WithdrawCall,
} from "../../generated/bveCVX/VaultV4";
import { Vault } from "../../generated/schema";
import { createVault } from "../entities/Vault";
import { deposit } from "./deposit";
import { withdraw } from "./withdraw";

export function handleDeposit(call: DepositCall): void {
  const vaultAddress = call.to;
  const amount = call.inputs._amount;

  let vault = Vault.load(vaultAddress.toHex());
  if (vault == null) {
    vault = createVault(call, vaultAddress);
  }

  deposit(call, vault, amount);
}

export function handleDeposit2(call: DepositCallV2): void {
  const vaultAddress = call.to;
  const amount = call.inputs._amount;

  let vault = Vault.load(vaultAddress.toHex());
  if (vault == null) {
    vault = createVault(call, vaultAddress);
  }

  deposit(call, vault, amount);
}

export function handleDepositFor(call: DepositForCall): void {
  const vaultAddress = call.to;
  const amount = call.inputs._amount;

  let vault = Vault.load(vaultAddress.toHex());
  if (vault == null) {
    vault = createVault(call, vaultAddress);
  }

  deposit(call, vault, amount);
}

export function handleDepositFor2(call: DepositForCallV2): void {
  const vaultAddress = call.to;
  const amount = call.inputs._amount;

  let vault = Vault.load(vaultAddress.toHex());
  if (vault == null) {
    vault = createVault(call, vaultAddress);
  }

  deposit(call, vault, amount);
}

export function handleDepositAll(call: DepositAllCall): void {
  const vaultAddress = call.to;

  let vault = Vault.load(vaultAddress.toHex());
  if (vault == null) {
    vault = createVault(call, vaultAddress);
  }

  deposit(call, vault, null);
}

export function handleDepositAll2(call: DepositCallV2): void {
  const vaultAddress = call.to;

  let vault = Vault.load(vaultAddress.toHex());
  if (vault == null) {
    vault = createVault(call, vaultAddress);
  }

  deposit(call, vault, null);
}

export function handleWithdraw(call: WithdrawCall): void {
  const vaultAddress = call.to;
  const shares = call.inputs._shares;

  let vault = Vault.load(vaultAddress.toHex());
  if (vault == null) {
    vault = createVault(call, vaultAddress);
  }

  withdraw(call, vault, shares);
}

export function handleWithdrawAll(call: WithdrawAllCall): void {
  const vaultAddress = call.to;

  let vault = Vault.load(vaultAddress.toHex());
  if (vault == null) {
    vault = createVault(call, vaultAddress);
  }

  withdraw(call, vault, null);
}
