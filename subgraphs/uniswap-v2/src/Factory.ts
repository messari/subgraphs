import { log } from '@graphprotocol/graph-ts'
import { PairCreated } from '../generated/Factory/Factory'
import { DexAmmProtocol, LiquidityPool } from '../generated/schema'
import { Pair as PairTemplate } from '../generated/templates'
import { getOrCreateToken, getOrCreateRewardToken } from './common/tokens'
import {
  FACTORY_ADDRESS,
  BIGDECIMAL_ZERO
} from './common/constants'

export function handleNewPair(event: PairCreated): void {

  let protocol = DexAmmProtocol.load(FACTORY_ADDRESS)

  if (protocol === null) {
    protocol = new DexAmmProtocol(FACTORY_ADDRESS)
    protocol.name = "Uniswap v3"
    protocol.slug = "uniswap-v3"
    protocol.network = "ETHEREUM"
    protocol.type = "EXCHANGE"
  }  

  // create the tokens
  let token0 = getOrCreateToken(event.params.token0)
  let token1 = getOrCreateToken(event.params.token1)
  let rewardToken0 = getOrCreateRewardToken(event.params.token0, "DEPOSIT")
  let rewardToken1 = getOrCreateRewardToken(event.params.token0, "DEPOSIT")

  let pool = new LiquidityPool(event.params.pair.toHexString())

  pool.protocol = "ETHEREUM"
  pool.inputTokens =  [token0.id, token1.id]
  pool.outputToken = token0.symbol + "/" + token1.symbol + "Uniswap v2 LP"
  pool.rewardTokens = [rewardToken0.id, rewardToken1.id]
  pool.totalValueLockedUSD = BIGDECIMAL_ZERO
  pool.totalVolumeUSD = BIGDECIMAL_ZERO
  pool.inputTokenBalances = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO]
  pool.outputTokenSupply = BIGDECIMAL_ZERO
  pool.outputTokenPriceUSD = BIGDECIMAL_ZERO
  pool.createdTimestamp = event.block.timestamp
  pool.createdBlockNumber = event.block.number
  pool.name = protocol.name + " " + token0.symbol + "/" + token1.symbol
  pool.symbol = token0.symbol + "/" + token1.symbol


  // create the tracked contract based on the template
  PairTemplate.create(event.params.pair)

  // save updated values
  token0.save()
  token1.save()
  rewardToken0.save()
  rewardToken1.save()
  pool.save()
  protocol.save()
}
