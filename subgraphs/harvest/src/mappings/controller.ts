import { Address } from '@graphprotocol/graph-ts'
import { AddVaultAndStrategyCall } from '../../generated/Controller/Controller'
import { Vault as VaultContract } from '../../generated/Controller/Vault'
import { Vault as VaultStore, YieldAggregator } from '../../generated/schema'
import { Vault as VaultTemplate} from '../../generated/templates'
import { BIGDECIMAL_ZERO, PROTOCOL_ID } from '../common/constants'
import { createProtocol, getOrCreateToken } from '../common/utils'

export function handleAddVaultAndStrategy(call: AddVaultAndStrategyCall): void {
    createProtocol()
    
    let vaultAddress = call.inputs._vault
    let vault = VaultStore.load(vaultAddress.toHex())
    if (!vault) {
        vault = new VaultStore(vaultAddress.toHex())

        const vaultContract = VaultContract.bind(Address.fromString(vault.id))
        vault.protocol = PROTOCOL_ID
        vault.name = vaultContract.name()
        vault.symbol = vaultContract.symbol()

        const inputToken = getOrCreateToken(vaultContract.underlying())
        vault.inputTokens = [inputToken.id]
        vault.inputTokenBalances = [BIGDECIMAL_ZERO]

        const outputToken = getOrCreateToken(Address.fromString(vault.id))
        vault.outputToken = outputToken.id
        vault.outputTokenSupply = BIGDECIMAL_ZERO
        vault.totalVolumeUSD = BIGDECIMAL_ZERO
        vault.totalValueLockedUSD = BIGDECIMAL_ZERO
        vault.createdBlockNumber = call.block.number
        vault.createdTimestamp = call.block.timestamp

        vault.save()

        let protocol = YieldAggregator.load(PROTOCOL_ID)
        if (protocol) {
            protocol.vaults.push(vault.id)
            protocol.save()
        }

        VaultTemplate.create(Address.fromString(vault.id))
    }
}
