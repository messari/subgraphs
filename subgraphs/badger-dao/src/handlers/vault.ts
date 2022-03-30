import { BigInt, log } from "@graphprotocol/graph-ts";
import {
  BadgerSett,
  DepositAllCall,
  DepositCall,
  WithdrawAllCall,
  WithdrawCall,
} from "../../generated/badger-wbtc/BadgerSett";
import { Vault } from "../../generated/schema";
import { BIGINT_ZERO } from "../constant";
import { getOrCreateUser } from "../entities/User";
import { readValue } from "../utils/contracts";
import { updateFinancialMetrics, updateUsageMetrics, updateVaultMetrics } from "./common";
import { deposit } from "./deposit";
import { withdraw } from "./Withdraw";

export function handleDeposit(call: DepositCall): void {
  const vaultAddress = call.to.toHex();
  const vault = Vault.load(vaultAddress);

  if (!vault) {
    return;
  }

  let amount = call.inputs._amount;
  let user = getOrCreateUser(call.from);

  log.warning("[BADGER] handleDeposit - amount {}, vault {}", [amount.toString(), vaultAddress]);

  deposit(call, vault, amount);
  updateUsageMetrics(user, call.block);
  updateVaultMetrics(vault, call.block);
  updateFinancialMetrics(vault, amount, call.block);
}

export function handleDepositAll(call: DepositAllCall): void {
  const vaultAddress = call.to.toHex();
  const vault = Vault.load(vaultAddress);
  const vaultContract = BadgerSett.bind(call.to);

  if (!vault) {
    return;
  }

  let prevBalance = BigInt.fromString(vault.inputTokenBalances[0].toString());
  let newBalance = readValue<BigInt>(vaultContract.try_balance(), BIGINT_ZERO);

  let amount = newBalance.minus(prevBalance);
  let user = getOrCreateUser(call.from);

  log.warning("[BADGER] handleDeposit - prevBalance {}, amount {}, vault {}", [
    prevBalance.toString(),
    amount.toString(),
    vaultAddress,
  ]);

  deposit(call, vault, amount);
  updateUsageMetrics(user, call.block);
  updateVaultMetrics(vault, call.block);
  updateFinancialMetrics(vault, amount, call.block);
}

export function handleWithdraw(call: WithdrawCall): void {
  const vaultAddress = call.to.toHex();
  const vault = Vault.load(vaultAddress);

  if (!vault) {
    return;
  }

  let shares = call.inputs._shares;
  let user = getOrCreateUser(call.from);

  log.warning("[BADGER] handleWithdraw - shares {}, vault {}", [shares.toString(), vaultAddress]);

  withdraw(call, vault, shares);
  updateUsageMetrics(user, call.block);
  updateVaultMetrics(vault, call.block);
  updateFinancialMetrics(vault, shares, call.block);
}

export function handleWithdrawAll(call: WithdrawAllCall): void {
  const vaultAddress = call.to.toHex();
  const vault = Vault.load(vaultAddress);
  const vaultContract = BadgerSett.bind(call.to);

  if (!vault) {
    return;
  }

  let newSupply = readValue<BigInt>(vaultContract.try_totalSupply(), BIGINT_ZERO);
  let prevSupply = vault.outputTokenSupply;

  let shares = prevSupply.minus(newSupply);
  let user = getOrCreateUser(call.from);

  log.warning("[BADGER] handleWithdrawAll - newSuppply {}, shares {}, vault {}", [
    newSupply.toString(),
    shares.toString(),
    vaultAddress,
  ]);

  withdraw(call, vault, shares);
  updateUsageMetrics(user, call.block);
  updateVaultMetrics(vault, call.block);
  updateFinancialMetrics(vault, shares, call.block);
}
