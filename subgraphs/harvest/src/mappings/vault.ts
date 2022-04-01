import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { DepositCall, WithdrawCall } from '../../generated/Controller/Vault'
import { Token, Vault as VaultStore, YieldAggregator } from '../../generated/schema'
import { BIGDECIMAL_ZERO, PROTOCOL_ID, SECONDS_PER_DAY } from '../common/constants'
import { getOrCreateFinancialSnapshots, getOrCreateToken, getOrCreateUsageMetricSnapshot, getUsdPriceOfToken } from '../common/utils'

export function handleDeposit(call: DepositCall): void {
    const vaultAddress = call.to
    let vault = VaultStore.load(vaultAddress.toHexString())
    if (vault) {
        let depositAmount = call.inputs.amount
        let totalSupply = vault.outputTokenSupply
        let balance = vault.inputTokenBalances[0]

        let sharesMinted = totalSupply.equals(BigDecimal.fromString('0'))
            ? depositAmount.toBigDecimal()
            : depositAmount.toBigDecimal().times(totalSupply).div(balance)

        let inputToken = Token.load(vault.inputTokens[0])
        let inputTokenAddress = Address.fromString(vault.inputTokens[0])
        let inputTokenDecimals = BigInt.fromI32(10).pow(inputToken!.decimals as u8);
        let inputTokenPrice = getUsdPriceOfToken(
            inputTokenAddress
        )

        vault.totalValueLockedUSD = inputTokenPrice
            .times(vault.inputTokenBalances[0])
            .div(inputTokenDecimals.toBigDecimal())

        vault.totalVolumeUSD = vault.totalVolumeUSD.plus(
            inputTokenPrice
                .times(depositAmount.toBigDecimal())
                .div(inputTokenDecimals.toBigDecimal())
        )

        vault.inputTokenBalances = [vault.inputTokenBalances[0].plus(depositAmount.toBigDecimal())]
        vault.outputTokenSupply = vault.outputTokenSupply.plus(sharesMinted)
        vault.save()
    }

    updateUsageMetrics(call.block.number, call.block.timestamp, call.from)
    updateFinancials(call.block.number, call.block.timestamp, call.from)
}

export function handleWithdraw(call: WithdrawCall): void {
    const vaultAddress = call.to
    let vault = VaultStore.load(vaultAddress.toHexString())
    if (vault) {
        let numberOfShares = call.inputs.numberOfShares
        let totalSupply = vault.outputTokenSupply
        let balance = vault.inputTokenBalances[0]
        
        let withdrawAmount = balance.times(numberOfShares.toBigDecimal()).div(totalSupply)
        let inputToken = Token.load(vault.inputTokens[0])
        let inputTokenAddress = Address.fromString(vault.inputTokens[0])
        let inputTokenDecimals = BigInt.fromI32(10).pow(inputToken!.decimals as u8)
        let inputTokenPrice = getUsdPriceOfToken(inputTokenAddress)

        vault.totalValueLockedUSD = inputTokenPrice
            .times(vault.inputTokenBalances[0])
            .div(inputTokenDecimals.toBigDecimal())

        vault.inputTokenBalances = [
            vault.inputTokenBalances[0].minus(withdrawAmount)
        ]
        vault.outputTokenSupply = vault.outputTokenSupply.minus(numberOfShares.toBigDecimal())

        vault.save()
    }
    
    updateUsageMetrics(call.block.number, call.block.timestamp, call.from)
    updateFinancials(call.block.number, call.block.timestamp, call.from)
}

export function updateUsageMetrics(blockNumber: BigInt, blockTimestamp: BigInt, from: Address): void {
    let id: i64 = blockTimestamp.toI64() / SECONDS_PER_DAY;
    let usageMetrics = getOrCreateUsageMetricSnapshot(blockNumber);

    usageMetrics.blockNumber = blockNumber
    usageMetrics.timestamp = blockTimestamp
    usageMetrics.dailyTransactionCount += 1

    // TODO: add user information

    usageMetrics.save()
}

export function updateFinancials(blockNumber: BigInt, blockTimestamp: BigInt, from: Address): void {
    let id: i64 = blockTimestamp.toI64() / SECONDS_PER_DAY;
    const financialMetrics = getOrCreateFinancialSnapshots(id.toString());
  
    const protocol = YieldAggregator.load(PROTOCOL_ID);
    if (protocol) {
      let protocolTvlUsd = BIGDECIMAL_ZERO;
      let protocolTotalVolumeUSD = BIGDECIMAL_ZERO;
  
      for (let i = 0; i < protocol.vaults.length; i++) {
        const vaultId = protocol.vaults[i];
        const vaultStore = VaultStore.load(vaultId);
  
        if (vaultStore) {
          protocolTotalVolumeUSD = protocolTotalVolumeUSD.plus(
            vaultStore.totalVolumeUSD
          );
          protocolTvlUsd = protocolTvlUsd.plus(vaultStore.totalValueLockedUSD);
        }
      }
      financialMetrics.totalVolumeUSD = protocolTotalVolumeUSD;
      financialMetrics.totalValueLockedUSD = protocolTvlUsd;
    }
  
    financialMetrics.blockNumber = blockNumber;
    financialMetrics.timestamp = blockTimestamp;
  
    financialMetrics.save();
}
