import { PoolCreated } from "../../generated/ArrakisFactory/ArrakisFactoryV1"
import { Minted } from "../../generated/templates/ArrakisVault/ArrakisVaultV1"
import { getOrCreateYieldAggregator } from "../common/getters"
import { getOrCreateVault } from "./helpers/vault"

export function handlePoolCreated(event: PoolCreated): void {
    let protocol = getOrCreateYieldAggregator(event.address)
    // Create Vault
    let vault = getOrCreateVault(event.params.pool, event.block)
    vault.protocol = event.address.toHex()
    vault.save()

}

export function handleMinted(event: Minted): void {
     // Create deposit event
    // createDeposit(event);

    // // Update vault token supply
    // let vault = getOrCreateVault(event.address, event.block);
    // vault.inputTokenBalance += event.params.shares;
    // vault.outputTokenSupply += event.params.shares;
    // vault.save();

    // updateUsageMetrics(event.params.to, UsageType.DEPOSIT, event);
    // updateTvl(event);
    // updateVaultSnapshots(event);

}