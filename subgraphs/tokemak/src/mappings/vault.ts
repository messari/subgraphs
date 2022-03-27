import { Address, BigDecimal, ethereum, BigInt } from '@graphprotocol/graph-ts';
import { DepositCall, DepositForCall, WithdrawCall } from '../../generated/Manager/Vault'
import { FinancialsDailySnapshot, UsageMetricsDailySnapshot, Vault as VaultStore, YieldAggregator } from '../../generated/schema'
import { BIGDECIMAL_ZERO, PROTOCOL_ID, SECONDS_PER_DAY } from '../common/constants';
import { getOrCreateToken, normalizedUsdcPrice, usdcPrice } from '../common/utils';

export function handleDeposit(call: DepositCall): void {
    const vaultAddress = call.to
    let vault = VaultStore.load(vaultAddress.toHexString())
    if (vault) {
        deposit(call, vault, call.inputs.amount)
    }

    updateUsageMetrics(call.block.number, call.block.timestamp, call.from)
    updateFinancials(call.block.number, call.block.timestamp, call.from)
}

export function handleDepositFor(call: DepositForCall): void {
    const vaultAddress = call.to
    let vault = VaultStore.load(vaultAddress.toHexString())
    if (vault) {
        deposit(call, vault, call.inputs.amount)
    }

    updateUsageMetrics(call.block.number, call.block.timestamp, call.from)
    updateFinancials(call.block.number, call.block.timestamp, call.from)
}

export function handleWithdraw(call: WithdrawCall): void {
    const vaultAddress = call.to
    let vault = VaultStore.load(vaultAddress.toHexString())
    if (vault) {
        const withdrawAmount = call.inputs.requestedAmount
        const token = getOrCreateToken(Address.fromString(vault.inputTokens[0]))
        const amountUSD = normalizedUsdcPrice(usdcPrice(token, withdrawAmount))
        vault.totalValueLockedUSD = vault.totalValueLockedUSD.minus(amountUSD)
        
        vault.inputTokenBalances = [vault.inputTokenBalances[0].minus(withdrawAmount.toBigDecimal())]
        vault.outputTokenSupply = vault.outputTokenSupply.minus(withdrawAmount.toBigDecimal())
        vault.save()
    }

    updateUsageMetrics(call.block.number, call.block.timestamp, call.from)
    updateFinancials(call.block.number, call.block.timestamp, call.from)
}

function deposit(call: ethereum.Call, vault: VaultStore, depositAmount: BigInt) {
    const token = getOrCreateToken(Address.fromString(vault.inputTokens[0]))
    const amountUSD = normalizedUsdcPrice(usdcPrice(token, depositAmount))
    vault.totalVolumeUSD = vault.totalVolumeUSD.plus(amountUSD)
    vault.totalValueLockedUSD = vault.totalValueLockedUSD.plus(amountUSD)
    
    vault.inputTokenBalances = [vault.inputTokenBalances[0].plus(depositAmount.toBigDecimal())]
    vault.outputTokenSupply = vault.outputTokenSupply.plus(depositAmount.toBigDecimal())
    vault.save()
}

function updateUsageMetrics(blockNumber: BigInt, timestamp: BigInt, from: Address): void {
    let id: i64 = timestamp.toI64() / SECONDS_PER_DAY
    let usageMetrics = UsageMetricsDailySnapshot.load(id.toString())

    if (!usageMetrics) {
        usageMetrics = new UsageMetricsDailySnapshot(id.toString())
        usageMetrics.protocol = PROTOCOL_ID

        usageMetrics.activeUsers = 0
        usageMetrics.totalUniqueUsers = 0
        usageMetrics.dailyTransactionCount = 0
    }

    usageMetrics.blockNumber = blockNumber
    usageMetrics.timestamp = timestamp
    usageMetrics.dailyTransactionCount += 1

    // track unique users

    usageMetrics.save()
}

function updateFinancials(blockNumber: BigInt, timestamp: BigInt, from: Address): void {
      // Number of days since Unix epoch
    let id: i64 = timestamp.toI64() / SECONDS_PER_DAY;
    let financialMetrics = FinancialsDailySnapshot.load(id.toString());

    if (!financialMetrics) {
        financialMetrics = new FinancialsDailySnapshot(id.toString());
        financialMetrics.protocol = PROTOCOL_ID;

        financialMetrics.feesUSD = BIGDECIMAL_ZERO
        financialMetrics.totalVolumeUSD = BIGDECIMAL_ZERO
        financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO
        financialMetrics.supplySideRevenueUSD = BIGDECIMAL_ZERO
        financialMetrics.protocolSideRevenueUSD = BIGDECIMAL_ZERO
    }

    let protocolTvlUsd = BIGDECIMAL_ZERO
    let protocolTotalVolume = BIGDECIMAL_ZERO
    const protocol = YieldAggregator.load(PROTOCOL_ID)
    if (protocol) {
        for (let i = 0; i < protocol.vaults.length; i++) {
            let vaultId = protocol.vaults[i];
            let vault = VaultStore.load(vaultId)
            if (vault) {
                const vaultTvlUsd = vault.totalValueLockedUSD
                const vaultTotalVolume = vault.totalVolumeUSD

                protocolTvlUsd = protocolTvlUsd.plus(vaultTvlUsd)
                protocolTotalVolume = protocolTotalVolume.plus(vaultTotalVolume)
            }
        }
        financialMetrics.totalValueLockedUSD = protocolTvlUsd
        financialMetrics.totalVolumeUSD = protocolTotalVolume
    }

    financialMetrics.blockNumber = blockNumber
    financialMetrics.timestamp = timestamp

    financialMetrics.save()
}
