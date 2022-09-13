/* eslint-disable prefer-const */
import { log } from "@graphprotocol/graph-ts";
import { HypeAdded } from "../../generated/HypeRegistry/HypeRegistry";
import {
  Deposit,
  Withdraw,
  Rebalance,
} from "../../generated/templates/Hypervisor/Hypervisor";
import { Hypervisor as HypervisorContract } from "../../generated/templates/Hypervisor/Hypervisor";
import { Hypervisor as HypervisorTemplate } from "../../generated/templates";
import { getOrCreateYieldAggregator } from "../common/getters";
import {
  createDeposit,
  createRebalance,
  createWithdraw,
} from "./helpers/events";
import { updateUsageMetrics } from "./helpers/usageMetrics";
import { getOrCreateVault, updateVaultSnapshots } from "./helpers/vaults";
import { UsageType } from "../common/constants";
import { updateRevenue, updateTvl } from "./helpers/financials";
import { Vault } from "../../generated/schema";

export function handleHypeAdded(event: HypeAdded): void {
  // Do not add vault if it has already been added
  let vault = Vault.load(event.params.hype.toHex());
  if (vault) {
    return;
  }

  let hypervisorContract = HypervisorContract.bind(event.params.hype);
  let test_amount = hypervisorContract.try_getTotalAmounts();
  // Prevents subgraph crashing from bad address added to registry
  if (test_amount.reverted) {
    log.warning("Could not add {}, does not appear to be a hypervisor", [
      event.params.hype.toHex(),
    ]);
    return;
  }

  getOrCreateYieldAggregator(event.address);
  getOrCreateVault(event.params.hype, event);

  HypervisorTemplate.create(event.params.hype);
}

export function handleDeposit(event: Deposit): void {
  // Create deposit event
  createDeposit(event);

  // Update vault token supply
  let vault = getOrCreateVault(event.address, event);
  vault.inputTokenBalance = vault.inputTokenBalance.plus(event.params.shares);
  vault.outputTokenSupply = vault.outputTokenSupply!.plus(event.params.shares);
  vault.save();

  updateUsageMetrics(event.params.to, UsageType.DEPOSIT, event);
  updateTvl(event);
  updateVaultSnapshots(event);
}

export function handleWithdraw(event: Withdraw): void {
  // Create withdraw event
  createWithdraw(event);

  // Update vault token supply
  let vault = getOrCreateVault(event.address, event);
  vault.inputTokenBalance = vault.inputTokenBalance.minus(event.params.shares);
  vault.outputTokenSupply = vault.outputTokenSupply!.minus(event.params.shares);
  vault.save();

  updateUsageMetrics(event.params.to, UsageType.WITHDRAW, event);
  updateTvl(event);
  updateVaultSnapshots(event);
}

export function handleRebalance(event: Rebalance): void {
  createRebalance(event);
  updateRevenue(event);
  updateTvl(event);
  updateVaultSnapshots(event);
}
