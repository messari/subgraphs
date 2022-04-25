// import { log } from '@graphprotocol/graph-ts'
import { PoolCreated } from '../../generated//Factory/Factory'
import { Address } from '@graphprotocol/graph-ts'
import { findEthPerToken } from '../common/pricing'
import { getOrCreateDex, getOrCreateTokenTracker } from '../common/getters'
import { CreateLiquidityPool, UpdateTokenWhitelists } from '../common/helpers'
import { getOrCreateLPToken, getOrCreateToken } from '../common/tokens'

export function handlePoolCreated(event: PoolCreated): void {
  // temp fix
  if (event.params.pool == Address.fromHexString('0x8fe8d9bb8eeba3ed688069c3d6b556c9ca258248')) {
    return
  }

  let protocol = getOrCreateDex()
  
  // create the tokens and tokentracker
  let token0 = getOrCreateToken(event.params.token0)
  let token1 = getOrCreateToken(event.params.token1)
  let LPtoken = getOrCreateLPToken(event.params.pool, token0, token1)

  let tokenTracker0 = getOrCreateTokenTracker(event.params.token0)
  let tokenTracker1 = getOrCreateTokenTracker(event.params.token1)

  tokenTracker0.derivedETH = findEthPerToken(tokenTracker0)
  tokenTracker1.derivedETH = findEthPerToken(tokenTracker1)

  UpdateTokenWhitelists(tokenTracker0, tokenTracker1, event.params.pool)

  CreateLiquidityPool(event, protocol, event.params.pool, event.params.fee, token0, token1, LPtoken)
}

