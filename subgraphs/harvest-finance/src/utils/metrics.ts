import { Address, ethereum } from '@graphprotocol/graph-ts'
import {
  Account,
  ActiveAccount,
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  Vault,
  VaultDailySnapshot,
  VaultHourlySnapshot,
} from '../../generated/schema'

import { constants } from './constants'
import { YieldAggregator } from '../../generated/schema'

export namespace metrics {
  function getOrCreateVaultsDailySnapshots(
    vaultId: string,
    block: ethereum.Block
  ): VaultDailySnapshot {
    let id: string = vaultId
      .concat('-')
      .concat((block.timestamp.toI64() / constants.SECONDS_PER_DAY).toString())
    let vaultSnapshots = VaultDailySnapshot.load(id)

    if (!vaultSnapshots) {
      vaultSnapshots = new VaultDailySnapshot(id)
      vaultSnapshots.protocol = constants.PROTOCOL_ID.toHexString()
      vaultSnapshots.vault = vaultId

      vaultSnapshots.totalValueLockedUSD = constants.BIG_DECIMAL_ZERO
      vaultSnapshots.inputTokenBalance = constants.BIG_INT_ZERO
      vaultSnapshots.outputTokenSupply = constants.BIG_INT_ZERO
      vaultSnapshots.outputTokenPriceUSD = constants.BIG_DECIMAL_ZERO
      vaultSnapshots.pricePerShare = constants.BIG_DECIMAL_ZERO
      vaultSnapshots.stakedOutputTokenAmount = constants.BIG_INT_ZERO
      vaultSnapshots.dailySupplySideRevenueUSD = constants.BIG_DECIMAL_ZERO
      vaultSnapshots.cumulativeSupplySideRevenueUSD = constants.BIG_DECIMAL_ZERO
      vaultSnapshots.dailyProtocolSideRevenueUSD = constants.BIG_DECIMAL_ZERO
      vaultSnapshots.cumulativeProtocolSideRevenueUSD =
        constants.BIG_DECIMAL_ZERO

      vaultSnapshots.dailyTotalRevenueUSD = constants.BIG_DECIMAL_ZERO
      vaultSnapshots.cumulativeTotalRevenueUSD = constants.BIG_DECIMAL_ZERO

      vaultSnapshots.blockNumber = block.number
      vaultSnapshots.timestamp = block.timestamp

      vaultSnapshots.save()
    }

    return vaultSnapshots
  }

  function getOrCreateVaultsHourlySnapshots(
    vaultId: string,
    block: ethereum.Block
  ): VaultHourlySnapshot {
    let id: string = vaultId
      .concat('-')
      .concat((block.timestamp.toI64() / constants.SECONDS_PER_HOUR).toString())
    let vaultSnapshots = VaultHourlySnapshot.load(id)

    if (!vaultSnapshots) {
      vaultSnapshots = new VaultHourlySnapshot(id)
      vaultSnapshots.protocol = constants.PROTOCOL_ID.toHexString()
      vaultSnapshots.vault = vaultId

      vaultSnapshots.totalValueLockedUSD = constants.BIG_DECIMAL_ZERO
      vaultSnapshots.inputTokenBalance = constants.BIG_INT_ZERO
      vaultSnapshots.outputTokenSupply = constants.BIG_INT_ZERO
      vaultSnapshots.outputTokenPriceUSD = constants.BIG_DECIMAL_ZERO
      vaultSnapshots.pricePerShare = constants.BIG_DECIMAL_ZERO

      vaultSnapshots.hourlySupplySideRevenueUSD = constants.BIG_DECIMAL_ZERO
      vaultSnapshots.cumulativeSupplySideRevenueUSD = constants.BIG_DECIMAL_ZERO

      vaultSnapshots.hourlyProtocolSideRevenueUSD = constants.BIG_DECIMAL_ZERO
      vaultSnapshots.cumulativeProtocolSideRevenueUSD =
        constants.BIG_DECIMAL_ZERO

      vaultSnapshots.hourlyTotalRevenueUSD = constants.BIG_DECIMAL_ZERO
      vaultSnapshots.cumulativeTotalRevenueUSD = constants.BIG_DECIMAL_ZERO

      vaultSnapshots.blockNumber = block.number
      vaultSnapshots.timestamp = block.timestamp

      vaultSnapshots.save()
    }

    return vaultSnapshots
  }

  function getOrCreateAccount(id: string): Account {
    let account = Account.load(id)

    if (!account) {
      account = new Account(id)
      account.save()

      //Review
      const protocol = YieldAggregator.load(constants.PROTOCOL_ID.toHexString())
      if (protocol) {
        protocol.cumulativeUniqueUsers += 1
        protocol.save()
      }
    }

    return account
  }

  function getOrCreateFinancialDailySnapshots(
    block: ethereum.Block
  ): FinancialsDailySnapshot {
    let id = block.timestamp.toI64() / constants.SECONDS_PER_DAY
    let financialMetrics = FinancialsDailySnapshot.load(id.toString())

    if (!financialMetrics) {
      financialMetrics = new FinancialsDailySnapshot(id.toString())
      financialMetrics.protocol = constants.PROTOCOL_ID.toHexString()

      financialMetrics.totalValueLockedUSD = constants.BIG_DECIMAL_ZERO
      financialMetrics.dailySupplySideRevenueUSD = constants.BIG_DECIMAL_ZERO
      financialMetrics.cumulativeSupplySideRevenueUSD =
        constants.BIG_DECIMAL_ZERO
      financialMetrics.dailyProtocolSideRevenueUSD = constants.BIG_DECIMAL_ZERO
      financialMetrics.cumulativeProtocolSideRevenueUSD =
        constants.BIG_DECIMAL_ZERO

      financialMetrics.dailyTotalRevenueUSD = constants.BIG_DECIMAL_ZERO
      financialMetrics.cumulativeTotalRevenueUSD = constants.BIG_DECIMAL_ZERO

      financialMetrics.blockNumber = block.number
      financialMetrics.timestamp = block.timestamp

      financialMetrics.save()
    }

    return financialMetrics
  }

  function getOrCreateUsageMetricsDailySnapshot(
    block: ethereum.Block
  ): UsageMetricsDailySnapshot {
    let id: string = (
      block.timestamp.toI64() / constants.SECONDS_PER_DAY
    ).toString()
    let usageMetrics = UsageMetricsDailySnapshot.load(id)

    if (!usageMetrics) {
      usageMetrics = new UsageMetricsDailySnapshot(id)
      usageMetrics.protocol = constants.PROTOCOL_ID.toHexString()

      usageMetrics.dailyActiveUsers = 0
      usageMetrics.cumulativeUniqueUsers = 0
      usageMetrics.dailyTransactionCount = 0
      usageMetrics.dailyDepositCount = 0
      usageMetrics.dailyWithdrawCount = 0

      usageMetrics.blockNumber = block.number
      usageMetrics.timestamp = block.timestamp

      usageMetrics.save()
    }

    return usageMetrics
  }

  function getOrCreateUsageMetricsHourlySnapshot(
    block: ethereum.Block
  ): UsageMetricsHourlySnapshot {
    let metricsID: string = (
      block.timestamp.toI64() / constants.SECONDS_PER_HOUR
    ).toString()
    let usageMetrics = UsageMetricsHourlySnapshot.load(metricsID)

    if (!usageMetrics) {
      usageMetrics = new UsageMetricsHourlySnapshot(metricsID)
      usageMetrics.protocol = constants.PROTOCOL_ID.toHexString()

      usageMetrics.hourlyActiveUsers = 0
      usageMetrics.cumulativeUniqueUsers = 0
      usageMetrics.hourlyTransactionCount = 0
      usageMetrics.hourlyDepositCount = 0
      usageMetrics.hourlyWithdrawCount = 0

      usageMetrics.blockNumber = block.number
      usageMetrics.timestamp = block.timestamp

      usageMetrics.save()
    }

    return usageMetrics
  }

  export function updateUsageMetrics(
    block: ethereum.Block,
    from: Address
  ): void {
    getOrCreateAccount(from.toHexString())

    const protocol = YieldAggregator.load(constants.PROTOCOL_ID.toHexString())

    if (!protocol) return

    const usageMetricsDaily = getOrCreateUsageMetricsDailySnapshot(block)
    const usageMetricsHourly = getOrCreateUsageMetricsHourlySnapshot(block)

    usageMetricsDaily.blockNumber = block.number
    usageMetricsHourly.blockNumber = block.number

    usageMetricsDaily.timestamp = block.timestamp
    usageMetricsHourly.timestamp = block.timestamp

    usageMetricsDaily.dailyTransactionCount += 1
    usageMetricsHourly.hourlyTransactionCount += 1

    usageMetricsDaily.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers
    usageMetricsHourly.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers

    let dailyActiveAccountId = (
      block.timestamp.toI64() / constants.SECONDS_PER_DAY
    )
      .toString()
      .concat('-')
      .concat(from.toHexString())

    let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId)

    if (!dailyActiveAccount) {
      dailyActiveAccount = new ActiveAccount(dailyActiveAccountId)
      dailyActiveAccount.save()

      usageMetricsDaily.dailyActiveUsers += 1
      usageMetricsHourly.hourlyActiveUsers += 1
    }

    usageMetricsDaily.save()
    usageMetricsHourly.save()
  }

  export function updateFinancials(block: ethereum.Block): void {
    const protocol = YieldAggregator.load(constants.PROTOCOL_ID.toHexString())

    if (!protocol) return

    const financialMetrics = getOrCreateFinancialDailySnapshots(block)

    financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD
    financialMetrics.cumulativeSupplySideRevenueUSD =
      protocol.cumulativeSupplySideRevenueUSD
    financialMetrics.cumulativeProtocolSideRevenueUSD =
      protocol.cumulativeProtocolSideRevenueUSD
    financialMetrics.cumulativeTotalRevenueUSD =
      protocol.cumulativeTotalRevenueUSD

    financialMetrics.blockNumber = block.number
    financialMetrics.timestamp = block.timestamp

    financialMetrics.save()
  }

  export function updateVaultSnapshots(
    vaultAddress: Address,
    block: ethereum.Block
  ): void {
    let vault = Vault.load(vaultAddress.toHexString())
    if (!vault) return

    const vaultDailySnapshots = getOrCreateVaultsDailySnapshots(
      vaultAddress.toHexString(),
      block
    )
    const vaultHourlySnapshots = getOrCreateVaultsHourlySnapshots(
      vaultAddress.toHexString(),
      block
    )

    vaultDailySnapshots.totalValueLockedUSD = vault.totalValueLockedUSD
    vaultHourlySnapshots.totalValueLockedUSD = vault.totalValueLockedUSD

    vaultDailySnapshots.inputTokenBalance = vault.inputTokenBalance
    vaultHourlySnapshots.inputTokenBalance = vault.inputTokenBalance

    vaultDailySnapshots.outputTokenSupply = vault.outputTokenSupply!
    vaultHourlySnapshots.outputTokenSupply = vault.outputTokenSupply!

    vaultDailySnapshots.outputTokenPriceUSD = vault.outputTokenPriceUSD
    vaultHourlySnapshots.outputTokenPriceUSD = vault.outputTokenPriceUSD

    vaultDailySnapshots.pricePerShare = vault.pricePerShare
    vaultHourlySnapshots.pricePerShare = vault.pricePerShare

    vaultDailySnapshots.rewardTokenEmissionsAmount =
      vault.rewardTokenEmissionsAmount
    vaultHourlySnapshots.rewardTokenEmissionsAmount =
      vault.rewardTokenEmissionsAmount

    vaultDailySnapshots.rewardTokenEmissionsUSD = vault.rewardTokenEmissionsUSD
    vaultHourlySnapshots.rewardTokenEmissionsUSD = vault.rewardTokenEmissionsUSD

    vaultDailySnapshots.cumulativeProtocolSideRevenueUSD =
      vault.cumulativeProtocolSideRevenueUSD
    vaultHourlySnapshots.cumulativeProtocolSideRevenueUSD =
      vault.cumulativeProtocolSideRevenueUSD

    vaultDailySnapshots.cumulativeSupplySideRevenueUSD =
      vault.cumulativeSupplySideRevenueUSD
    vaultHourlySnapshots.cumulativeSupplySideRevenueUSD =
      vault.cumulativeSupplySideRevenueUSD

    vaultDailySnapshots.cumulativeTotalRevenueUSD =
      vault.cumulativeTotalRevenueUSD
    vaultHourlySnapshots.cumulativeTotalRevenueUSD =
      vault.cumulativeTotalRevenueUSD

    vaultDailySnapshots.blockNumber = block.number
    vaultHourlySnapshots.blockNumber = block.number

    vaultDailySnapshots.timestamp = block.timestamp
    vaultHourlySnapshots.timestamp = block.timestamp

    vaultDailySnapshots.save()
    vaultHourlySnapshots.save()
  }
}
