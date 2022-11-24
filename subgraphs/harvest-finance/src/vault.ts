import { Address, BigInt } from '@graphprotocol/graph-ts'
import {
  Deposit as DepositEvent,
  Transfer as TransferEvent,
  Withdraw as WithdrawEvent,
} from '../generated/Controller/VaultContract'
import { Vault } from '../generated/schema'
import { Token } from '../generated/schema'
import { prices } from './utils/prices'
import { deposits } from './utils/deposits'
import { withdraws } from './utils/withdraws'
import { metrics } from './utils/metrics'
import { decimals } from './utils'
import { vaults } from './utils/vaults'
import { protocols } from './utils/protocols'

export function handleWithdraw(event: WithdrawEvent): void {
  const beneficiary = event.params.beneficiary
  const amount = event.params.amount

  const vaultAddress = event.address

  const vault = Vault.load(vaultAddress.toHexString())

  if (!vault) return

  const token = Token.load(vault.inputToken)

  if (!token) return

  const tokenPriceUSD = prices.getPricePerToken(
    Address.fromString(vault.inputToken)
  )

  token.lastPriceUSD = tokenPriceUSD
  token.lastPriceBlockNumber = event.block.number

  const id = withdraws.generateId(event.transaction.hash, event.logIndex)

  const withdraw = withdraws.initialize(id)

  withdraw.hash = event.transaction.hash.toHexString()
  withdraw.logIndex = event.logIndex.toI32()
  withdraw.protocol = vault.protocol
  withdraw.to = beneficiary.toHexString()
  withdraw.from = event.transaction.from.toHexString()
  withdraw.blockNumber = event.block.number
  withdraw.timestamp = event.block.timestamp
  withdraw.asset = vault.inputToken
  withdraw.amount = amount
  withdraw.vault = vault.id

  const inputTokenBalance = vaults.extractInputTokenBalance(vaultAddress)

  if (inputTokenBalance) {
    vault.inputTokenBalance = inputTokenBalance
  }

  vault.totalValueLockedUSD = decimals
    .fromBigInt(vault.inputTokenBalance, token.decimals as u8)
    .times(tokenPriceUSD)

  withdraw.amountUSD = decimals
    .fromBigInt(amount, token.decimals as u8)
    .times(tokenPriceUSD)

  token.save()
  withdraw.save()
  vault.save()

  protocols.updateTotalValueLockedUSD(vault.protocol)

  metrics.updateFinancials(event.block)
  metrics.updateUsageMetrics(event.block, event.transaction.from)
  metrics.updateVaultSnapshots(vaultAddress, event.block)
  metrics.updateMetricsAfterWithdraw(event.block)
}

export function handleDeposit(event: DepositEvent): void {
  const amount = event.params.amount
  const beneficiary = event.params.beneficiary
  const vaultAddress = event.address

  const vault = Vault.load(vaultAddress.toHexString())

  if (!vault) return

  const token = Token.load(vault.inputToken)

  if (!token) return

  const tokenPriceUSD = prices.getPricePerToken(
    Address.fromString(vault.inputToken)
  )

  token.lastPriceUSD = tokenPriceUSD
  token.lastPriceBlockNumber = event.block.number

  const id = deposits.generateId(event.transaction.hash, event.logIndex)

  const deposit = deposits.initialize(id)
  deposit.hash = event.transaction.hash.toHexString()
  deposit.logIndex = event.logIndex.toI32()
  deposit.protocol = vault.protocol
  deposit.to = beneficiary.toHexString()
  deposit.from = event.transaction.from.toHexString()
  deposit.blockNumber = event.block.number
  deposit.timestamp = event.block.timestamp
  deposit.asset = vault.inputToken
  deposit.amount = amount
  deposit.vault = vault.id

  const inputTokenBalance = vaults.extractInputTokenBalance(vaultAddress)

  if (inputTokenBalance) {
    vault.inputTokenBalance = inputTokenBalance
  }

  vault.totalValueLockedUSD = decimals
    .fromBigInt(vault.inputTokenBalance, token.decimals as u8)
    .times(tokenPriceUSD)

  deposit.amountUSD = decimals
    .fromBigInt(amount, token.decimals as u8)
    .times(tokenPriceUSD)

  deposit.save()
  token.save()
  vault.save()

  protocols.updateTotalValueLockedUSD(vault.protocol)

  metrics.updateFinancials(event.block)
  metrics.updateUsageMetrics(event.block, event.transaction.from)
  metrics.updateVaultSnapshots(vaultAddress, event.block)
  metrics.updateMetricsAfterDeposit(event.block)
}

function handleMint(event: TransferEvent): void {
  const amount = event.params.value
  const vaultAddress = event.address

  const vault = Vault.load(vaultAddress.toHexString())

  if (!vault) return

  if (!vault.outputTokenSupply) {
    vault.outputTokenSupply = BigInt.fromI32(0)
  }

  vault.outputTokenSupply = vault.outputTokenSupply!.plus(amount)

  if (!vault.outputTokenSupply!.isZero()) {
    const outputToken = Token.load(vault.outputToken!)
    vault.outputTokenPriceUSD = vault.totalValueLockedUSD.div(
      decimals.fromBigInt(vault.outputTokenSupply!, outputToken!.decimals as u8)
    )
  }

  vault.save()

  metrics.updateFinancials(event.block)
  metrics.updateUsageMetrics(event.block, event.transaction.from)
  metrics.updateVaultSnapshots(vaultAddress, event.block)
}

function handleBurn(event: TransferEvent): void {
  const amount = event.params.value
  const vaultAddress = event.address

  const vault = Vault.load(vaultAddress.toHexString())

  if (!vault) return

  if (!vault.outputTokenSupply) {
    vault.outputTokenSupply = BigInt.fromI32(0)
  }

  vault.outputTokenSupply = vault.outputTokenSupply!.minus(amount)

  if (!vault.outputTokenSupply!.isZero()) {
    const outputToken = Token.load(vault.outputToken!)
    vault.outputTokenPriceUSD = vault.totalValueLockedUSD.div(
      decimals.fromBigInt(vault.outputTokenSupply!, outputToken!.decimals as u8)
    )
  }

  vault.save()

  metrics.updateFinancials(event.block)
  metrics.updateUsageMetrics(event.block, event.transaction.from)
  metrics.updateVaultSnapshots(vaultAddress, event.block)
}

export function handleTransfer(event: TransferEvent): void {
  const from = event.params.from
  const to = event.params.to

  if (from == Address.zero()) {
    handleMint(event)
    return
  }

  if (to == Address.zero()) {
    handleBurn(event)
  }
}
