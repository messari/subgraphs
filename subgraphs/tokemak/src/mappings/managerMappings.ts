import { BigInt, Address, BigDecimal, log, ethereum } from "@graphprotocol/graph-ts"
import {
  PoolRegistered,
} from "../../generated/Manager/Manager"
import {
  Vault as VaultContract,
} from "../../generated/Manager/Vault"
import { Vault as VaultTemplate } from "../../generated/templates"
import {
  YieldAggregator,
  Vault as VaultStore,
  VaultFee,
  RewardToken
} from "../../generated/schema"
import { getOrCreateRewardToken, getOrCreateToken } from "../common/tokens"
import {
  BIGDECIMAL_ZERO,
  PROTOCOL_ID,
  Network,
  ProtocolType,
  VaultFeeType,
  TOKE_ADDRESS,
  RewardTokenType,
  BIGINT_ZERO,
} from "../common/constants"

export function createProtocol(): YieldAggregator {
  let protocol = YieldAggregator.load(PROTOCOL_ID)
  if (!protocol) {
    protocol = new YieldAggregator(PROTOCOL_ID)
    protocol.name = "Tokemak"
    protocol.slug = "tokemak"
    protocol.network = Network.ETHEREUM
    protocol.type = ProtocolType.YIELD
    protocol.vaultIds = new Array<string>()
    protocol.save()
  }
  return protocol
}
function createRewardTokens(): void{
  const address = Address.fromString(TOKE_ADDRESS)
  getOrCreateRewardToken(address)
}

export function handlePoolRegistered(event: PoolRegistered): void {
  createProtocol()
  createRewardTokens()
  getOrCreateVault(event.params.pool, event)
}

function getOrCreateVault(vaultAddress: Address, event: ethereum.Event): VaultStore {
  // Note that the NewVault event are also emitted when endorseVault and newRelease
  // are called. So we only create it when necessary.
  let vault = VaultStore.load(vaultAddress.toHexString())
  if (!vault) {
    vault = new VaultStore(vaultAddress.toHexString())
    const vaultContract = VaultContract.bind(Address.fromString(vault.id))
    vault.protocol = PROTOCOL_ID
    vault.name = vaultContract.name()
    vault.symbol = vaultContract.symbol()
    const inputToken = getOrCreateToken(vaultContract.underlyer())
    vault.inputTokens = [inputToken.id]
    vault.inputTokenBalances = [BIGINT_ZERO]
    const outputToken = getOrCreateToken(Address.fromString(vault.id))
    vault.outputToken = outputToken.id
    vault.outputTokenSupply = BIGINT_ZERO
    vault.totalVolumeUSD = BIGDECIMAL_ZERO
    vault.totalValueLockedUSD = BIGDECIMAL_ZERO
    vault.createdBlockNumber = event.block.number
    vault.createdTimestamp = event.block.timestamp

    const rewardToken = getOrCreateRewardToken(Address.fromString(TOKE_ADDRESS))

    vault.rewardTokens = [rewardToken.id]

    const managementFeeId = "management-fee-" + vault.id
    let managementFee = new VaultFee(managementFeeId)
    managementFee.feeType = VaultFeeType.MANAGEMENT_FEE
    managementFee.feePercentage = BIGDECIMAL_ZERO
    managementFee.save()

    const performanceFeeId = "performance-fee-" + vault.id
    let performanceFee = new VaultFee(performanceFeeId)
    performanceFee.feeType = VaultFeeType.PERFORMANCE_FEE
    performanceFee.feePercentage = BIGDECIMAL_ZERO
    performanceFee.save()

    vault.fees = []
    vault.save()

    let protocol = YieldAggregator.load(PROTOCOL_ID)
    if (protocol) {
      let vaultIds = protocol.vaultIds;
      vaultIds.push(vault.id)
      protocol.vaultIds = vaultIds;
      protocol.save()
    }
  
    VaultTemplate.create(vaultAddress)
  }

  return vault
}
