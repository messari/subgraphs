import { Address } from "@graphprotocol/graph-ts"
import { PoolRegistered } from "../../generated/Manager/Manager"
import { Vault as VaultContract } from "../../generated/Manager/Vault"
import { Vault as VaultTemplate } from "../../generated/templates"
import { Vault as VaultStore, YieldAggregator } from "../../generated/schema"
import { BIGDECIMAL_ZERO, PROTOCOL_ID } from "../common/constants"
import { createProtocol, getOrCreateToken } from "../common/utils"

export function handlePoolRegistered(event: PoolRegistered) {
    createProtocol()

    let vault = VaultStore.load(event.params.pool.toHexString())
    if (!vault) {
        vault = new VaultStore(event.params.pool.toHexString())
        
        const vaultContract = VaultContract.bind(Address.fromString(vault.id))
        vault.protocol = PROTOCOL_ID
        vault.name = vaultContract.name()
        vault.symbol = vaultContract.symbol()

        const inputToken = getOrCreateToken(vaultContract.underlyer())
        vault.inputTokens = [inputToken.id]
        vault.inputTokenBalances = [BIGDECIMAL_ZERO]

        const outputToken = getOrCreateToken(Address.fromString(vault.id))
        vault.outputToken = outputToken.id
        vault.outputTokenSupply = BIGDECIMAL_ZERO
        vault.totalVolumeUSD = BIGDECIMAL_ZERO
        vault.totalValueLockedUSD = BIGDECIMAL_ZERO
        vault.createdBlockNumber = event.block.number
        vault.createdTimestamp = event.block.timestamp

        vault.save()

        let protocol = YieldAggregator.load(PROTOCOL_ID)
        if (protocol) {
            protocol.vaults.push(vault.id)
            protocol.save()
        }

        VaultTemplate.create(Address.fromString(vault.id))
    }
}
