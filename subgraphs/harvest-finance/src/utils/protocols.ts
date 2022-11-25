import { Address, BigDecimal, log } from '@graphprotocol/graph-ts'
import { Vault, YieldAggregator } from '../../generated/schema'
import { constants } from './constants'

export namespace protocols {
  export function calculateTotalValueLockedUSD(id: string): BigDecimal | null {
    const protocol = YieldAggregator.load(id)

    if (!protocol) return null

    if (!protocol._vaults) return constants.BIG_DECIMAL_ZERO

    return protocol
      ._vaults!.map<BigDecimal>(function (vaultId: string) {
        return Vault.load(vaultId)!.totalValueLockedUSD
      })
      .reduce(function (m: BigDecimal, v: BigDecimal) {
        return m.plus(v)
      }, constants.BIG_DECIMAL_ZERO)
  }

  export function updateTotalValueLockedUSD(id: string): void {
    const protocol = YieldAggregator.load(id)

    if (!protocol) return

    const totalValueLockedUSD = calculateTotalValueLockedUSD(id)

    if (!totalValueLockedUSD) return

    protocol.totalValueLockedUSD = totalValueLockedUSD
    protocol.save()
  }

  export function findOrInitialize(address: Address): YieldAggregator {
    const id = address.toHexString()

    let protocol = YieldAggregator.load(id)

    if (protocol) return protocol

    return initialize(id)
  }

  export function initialize(id: string): YieldAggregator {
    const protocol = new YieldAggregator(id)

    protocol.name = 'Harvest Finance'
    protocol.slug = 'harvest-finance'
    protocol.schemaVersion = '1.3.0'
    protocol.subgraphVersion = '0.1.0'
    protocol.methodologyVersion = '1.0.0'
    protocol.network = 'MAINNET'
    protocol.type = 'YIELD'
    protocol.totalValueLockedUSD = constants.BIG_DECIMAL_ZERO
    protocol.protocolControlledValueUSD = constants.BIG_DECIMAL_ZERO
    protocol.cumulativeSupplySideRevenueUSD = constants.BIG_DECIMAL_ZERO
    protocol.cumulativeProtocolSideRevenueUSD = constants.BIG_DECIMAL_ZERO
    protocol.cumulativeTotalRevenueUSD = constants.BIG_DECIMAL_ZERO
    protocol.cumulativeUniqueUsers = 0
    protocol.totalPoolCount = 0

    return protocol
  }

  export function updateRevenue(
    protocolId: string,
    profitAmountUSD: BigDecimal,
    feeAmountUSD: BigDecimal
  ): void {
    const protocol = YieldAggregator.load(protocolId)

    if (!protocol) {
      log.debug('Yield aggregator not found with ID: {}', [protocolId])
      return
    }

    protocol.cumulativeTotalRevenueUSD =
      protocol.cumulativeTotalRevenueUSD.plus(profitAmountUSD)

    protocol.cumulativeProtocolSideRevenueUSD =
      protocol.cumulativeProtocolSideRevenueUSD.plus(feeAmountUSD)

    protocol.cumulativeSupplySideRevenueUSD =
      protocol.cumulativeSupplySideRevenueUSD.plus(
        profitAmountUSD.minus(feeAmountUSD)
      )

    protocol.save()
  }
}
