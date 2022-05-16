/* eslint-disable prefer-const */
import { log } from "@graphprotocol/graph-ts"
import { HypeAdded } from "../../generated/HypeRegistry/HypeRegistry"
import { Deposit, Withdraw } from "../../generated/templates/Hypervisor/Hypervisor";
import { Hypervisor as HypervisorContract } from "../../generated/templates/Hypervisor/Hypervisor"
import { Hypervisor as HypervisorTemplate } from "../../generated/templates"
import { getOrCreateYieldAggregator } from "../common/getters"
import { createDeposit, createWithdraw } from "./helpers/events";
import { updateUsageMetrics } from "./helpers/usageMetrics"
import { getOrCreateVault } from "./helpers/vaults"
import { UsageType } from "../common/constants";


export function handleHypeAdded(event: HypeAdded): void {

    let hypervisorContract = HypervisorContract.bind(event.params.hype)
    let test_amount = hypervisorContract.try_getTotalAmounts()
    // Prevents subgraph crashing from bad address added to registry
    if (test_amount.reverted) {
        log.warning("Could not add {}, does not appear to be a hypervisor", [event.params.hype.toHex()])
        return
    }

    getOrCreateYieldAggregator(event.address)
    getOrCreateVault(event.params.hype, event.block)
    
    HypervisorTemplate.create(event.params.hype)

}


export function handleDeposit(event: Deposit): void {
    // Create deposit event
    createDeposit(event)

    // Update vault: TVL, token balances
    let vault = getOrCreateVault(event.address, event.block)

    // Update usage metrics
    updateUsageMetrics(event.params.to, UsageType.DEPOSIT, event)

    // Update Financials
}

export function handleWithdraw(event: Withdraw): void {
    // Create withdraw event
    createWithdraw(event)

    // Update vault: TVL, token balances
    let vault = getOrCreateVault(event.address, event.block)

    // Update usage metrics
    updateUsageMetrics(event.params.to, UsageType.WITHDRAW, event)

    // Update Financials
}
