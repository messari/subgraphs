import { Address } from '@graphprotocol/graph-ts'
import { _Strategy } from '../../generated/schema'
import { Strategy as StrategyTemplate } from '../../generated/templates'

export namespace strategies {
  export function getOrCreateStrategy(strategyAddress: Address): _Strategy {
    const id: string = strategyAddress.toHexString()

    let strategy = _Strategy.load(id)

    if (!strategy) {
      strategy = new _Strategy(id)
      strategy.save()
      StrategyTemplate.create(strategyAddress)
    }

    return strategy
  }
}
