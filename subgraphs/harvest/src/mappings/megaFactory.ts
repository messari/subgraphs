import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { CreateRegularVaultCall, CreateUniV3VaultCall, CreateRegularVaultUsingUpgradableStrategyCall } from '../../generated/MegaFactory/MegaFactory'
import { Vault as VaultStore, YieldAggregator } from '../../generated/schema'
import { Vault as VaultContract } from '../../generated/Controller/Vault'
import { MegaFactory as MegaFactoryContract } from '../../generated/MegaFactory/MegaFactory'
import { Vault as VaultTemplate} from '../../generated/templates'
import { PROTOCOL_ID, BIGDECIMAL_ZERO, MEGA_FACTORY_ADDRESS } from '../common/constants'
import { createProtocol, getOrCreateToken } from '../common/utils'

function createVault(vaultAddress: Address, blockNumber: BigInt, timestamp: BigInt): void {
    createProtocol()
    
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
        vault.createdBlockNumber = blockNumber
        vault.createdTimestamp = timestamp

        vault.save()

        let protocol = YieldAggregator.load(PROTOCOL_ID)
        if (protocol) {
            protocol.vaults.push(vault.id)
            protocol.save()
        }

        VaultTemplate.create(Address.fromString(vault.id))
    }
}

function getVaultId(vaultId: string): Address {
    const factory = MegaFactoryContract.bind(Address.fromString(MEGA_FACTORY_ADDRESS))
    const completedDeployments = factory.completedDeployments(vaultId)
    return completedDeployments.value2
}

export function handleCreateRegularVault(call: CreateRegularVaultCall): void {
    const vaultId = getVaultId(call.inputs.id)
    createVault(vaultId, call.block.number, call.block.timestamp)
}

export function handleCreateUniV3Vault(call: CreateUniV3VaultCall): void {
    const vaultId = getVaultId(call.inputs.id)
    createVault(vaultId, call.block.number, call.block.timestamp)
}

export function handleCreateRegularVaultStrategy(call: CreateRegularVaultUsingUpgradableStrategyCall): void {
    const vaultId = getVaultId(call.inputs.id)
    createVault(vaultId, call.block.number, call.block.timestamp)
}
