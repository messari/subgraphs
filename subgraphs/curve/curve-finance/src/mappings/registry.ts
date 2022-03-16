import { Address, BigDecimal, store, DataSourceContext, ethereum } from '@graphprotocol/graph-ts'

import { PoolAdded, PoolRemoved, Registry } from '../../generated/MainRegistry/Registry'
import { StableSwap } from '../../generated/MainRegistry/StableSwap'
import { ERC20 } from '../../generated/MainRegistry/ERC20'
import { Pool as PoolDataSource } from '../../generated/templates'

import { LiquidityPool } from '../../generated/schema'

import { getOrCreateToken } from '../utils/tokens'

import { BIGDECIMAL_ZERO, REGISTRY_ADDRESS, getOrNull } from '../utils/constant'

export function handlePoolAdded(event: PoolAdded): void {
    // Create a new pool
    getOrCreatePool(event.params.pool, event)
}

export function handlePoolRemoved(event: PoolRemoved): void {
    // Remove existing pool
    removePool(event.params.pool, event)
}

// Create new pool
function getOrCreatePool(
    address: Address, 
    event: ethereum.Event
): LiquidityPool {
    // Check if pool exist
    let pool = LiquidityPool.load(address.toHexString())

    // If pool doesn't exist, create a new pool
    if (pool == null) {
        let registryContract = Registry.bind(Address.fromString(REGISTRY_ADDRESS))
        let poolContract = StableSwap.bind(address)
        pool = new LiquidityPool(address.toHexString())
        // @TODO Add the liquidity pool Protocol
        // Input tokens
        let coins: Address[] | null = getOrNull<Address[]>(registryContract.try_get_coins(poolContract._address))
        pool.inputTokens = coins ? coins.map<string>(coin => getOrCreateToken(coin, event).id) : []
        // Get Output tokens
        let lpToken = registryContract.try_get_lp_token(address)
        if (!lpToken.reverted) {
            let token = getOrCreateToken(lpToken.value, event)
            pool.outputToken = token.id
            // Get Output token total supply
            let erc20 = ERC20.bind(Address.fromString(pool.outputToken))
            let totalSupply = erc20.try_totalSupply()
            pool.outputTokenSupply = totalSupply.reverted ? BIGDECIMAL_ZERO : new BigDecimal(totalSupply.value)
        }
        // Reward token
        pool.rewardTokens = []
        pool.totalValueLockedUSD = BIGDECIMAL_ZERO
        pool.inputTokenBalances = []
        pool.outputTokenPriceUSD = BIGDECIMAL_ZERO
        pool.createdTimestamp = event.block.timestamp
        pool.createdBlockNumber = event.block.number
        pool.name = registryContract.get_pool_name(address)
        pool.symbol = null

        pool.save()

        let context = new DataSourceContext()
        context.setBytes('registry', registryContract._address)

        PoolDataSource.createWithContext(address, context)
    }

    // Return pool if it already exist
    return pool!
}

function removePool(address: Address, event: ethereum.Event): void {
    let id = address.toHexString()
    let pool = LiquidityPool.load(id)

    if (pool != null) {
        store.remove(pool.id, id)
    }

}