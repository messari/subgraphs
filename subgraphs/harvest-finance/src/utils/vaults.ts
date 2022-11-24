import { Address, BigInt, log } from '@graphprotocol/graph-ts'
import { VaultContract } from '../../generated/Controller/VaultContract'
import { Vault } from '../../generated/schema'
import { constants } from '../utils/constants'
import { tokens } from './tokens'
import { prices } from './prices'
import { protocols } from './protocols'
import { fees } from './fees'
import { Vault as VaultTemplate } from '../../generated/templates'

export namespace vaults {
  class VaultData {
    underlying: Address
    name: string
    symbol: string
    decimals: i32

    constructor(
      underlying: Address,
      name: string,
      symbol: string,
      decimal: i32
    ) {
      this.underlying = underlying
      this.name = name
      this.symbol = symbol
      this.decimals = decimal
    }
  }

  export function getData(address: Address): VaultData | null {
    const contract = VaultContract.bind(address)

    const underlyingCall = contract.try_underlying()
    const nameCall = contract.try_name()
    const symbolCall = contract.try_symbol()
    const decimalsCall = contract.try_decimals()

    if (underlyingCall.reverted) return null
    if (nameCall.reverted) return null
    if (symbolCall.reverted) return null
    if (decimalsCall.reverted) return null

    return new VaultData(
      underlyingCall.value,
      nameCall.value,
      symbolCall.value,
      decimalsCall.value
    )
  }

  export function extractInputTokenBalance(
    vaultAddress: Address
  ): BigInt | null {
    const contract = VaultContract.bind(vaultAddress)

    const call = contract.try_underlyingBalanceWithInvestment()

    if (call.reverted) {
      log.debug(
        'Vault.underlyingBalanceWithInvestment Reverted for address {}',
        [vaultAddress.toHexString()]
      )
      return null
    }

    return call.value
  }

  export function findOrInitialize(address: Address): Vault {
    const id = address.toHexString()

    let vault = Vault.load(id)

    if (vault) return vault

    return initialize(id)
  }

  export function initialize(id: string): Vault {
    const vault = new Vault(id)

    vault.protocol = ''
    vault.name = ''
    vault.symbol = ''
    vault.inputToken = ''
    vault.outputToken = ''
    vault.rewardTokens = []
    vault.depositLimit = constants.BIG_INT_ZERO
    vault.fees = []
    vault.createdTimestamp = constants.BIG_INT_ZERO
    vault.createdBlockNumber = constants.BIG_INT_ZERO
    vault.totalValueLockedUSD = constants.BIG_DECIMAL_ZERO
    vault.inputTokenBalance = constants.BIG_INT_ZERO
    vault.outputTokenSupply = constants.BIG_INT_ZERO
    vault.outputTokenPriceUSD = constants.BIG_DECIMAL_ZERO
    vault.pricePerShare = constants.BIG_DECIMAL_ZERO
    vault.stakedOutputTokenAmount = constants.BIG_INT_ZERO
    vault.rewardTokenEmissionsAmount = []
    vault.rewardTokenEmissionsUSD = []
    vault.cumulativeSupplySideRevenueUSD = constants.BIG_DECIMAL_ZERO
    vault.cumulativeProtocolSideRevenueUSD = constants.BIG_DECIMAL_ZERO
    vault.cumulativeTotalRevenueUSD = constants.BIG_DECIMAL_ZERO

    return vault
  }

  export function createVault(
    vaultAddress: Address,
    timestamp: BigInt,
    blockNumber: BigInt
  ): void {
    let vault = Vault.load(vaultAddress.toHexString())

    if (vault) return

    const vaultData = vaults.getData(vaultAddress)

    if (vaultData == null) {
      log.debug('VaultCall Reverted block: {}, address: {}', [
        blockNumber.toString(),
        vaultAddress.toHexString(),
      ])
      return
    }

    const underlying = vaultData.underlying

    const erc20Values = tokens.getData(underlying)

    if (erc20Values == null) {
      log.debug('Erc20Call Reverted block: {}, address: {}', [
        blockNumber.toString(),
        underlying.toHexString(),
      ])
      return
    }

    let inputToken = tokens.findOrInitialize(underlying)

    inputToken.name = erc20Values.name
    inputToken.symbol = erc20Values.symbol
    inputToken.decimals = erc20Values.decimals
    inputToken.lastPriceUSD = prices.getPricePerToken(underlying)
    inputToken.lastPriceBlockNumber = blockNumber

    inputToken.save()

    let outputToken = tokens.findOrInitialize(vaultAddress)

    outputToken.name = vaultData.name
    outputToken.symbol = vaultData.symbol
    outputToken.decimals = vaultData.decimals

    outputToken.save()

    vault = vaults.initialize(vaultAddress.toHexString())

    vault.name = vaultData.name
    vault.symbol = vaultData.symbol
    vault.inputToken = underlying.toHexString()
    vault.outputToken = vaultAddress.toHexString()
    vault.createdTimestamp = timestamp
    vault.createdBlockNumber = blockNumber

    //TODO: Parameterize this for multiple networks
    //ETH Mainnet performance fee is 30%
    const vaultFee = fees.getOrCreateVaultFee(
      vaultAddress.toHexString(),
      constants.FEE_TYPE_PERFORMANCE,
      BigInt.fromI32(30)
    )

    vault.fees = [vaultFee.id]

    const protocol = protocols.findOrInitialize(constants.CONTROLLER_ADDRESS)

    protocol.totalPoolCount = protocol.totalPoolCount + 1

    // workaround: issue with derivedFrom
    protocol._vaults = protocol._vaults
      ? protocol._vaults!.concat([vault.id])
      : [vault.id]

    protocol.save()

    vault.protocol = protocol.id

    vault.save()

    VaultTemplate.create(vaultAddress)
  }
}
