// import { log } from '@graphprotocol/graph-ts'
import { log } from '@graphprotocol/graph-ts'
import { PairCreated } from './../generated/Factory/Factory'
import { DexAmmProtocol, LiquidityPool, _PricesUSD, _TokenTracker } from './../generated/schema'
import { Pair as PairTemplate } from '../generated/templates'
import { getOrCreateToken } from './common/tokens'
import { WHITELIST } from './common/Price'
import {
  FACTORY_ADDRESS,
  BIGDECIMAL_ZERO,
  ProtocolType,
  Network
} from './common/constants'

export function handleNewPair(event: PairCreated): void {

  log.debug('New Pair Created -', [])

  let protocol = DexAmmProtocol.load(FACTORY_ADDRESS)

  if (protocol === null) {
    protocol = new DexAmmProtocol(FACTORY_ADDRESS)
    protocol.name = "Uniswap v2"
    protocol.slug = "uniswap-v2"
    protocol.network = Network.ETHEREUM
    protocol.type = ProtocolType.EXCHANGE

    // create new ether price storage object
    let ether = new _PricesUSD('ETH')
    ether.valueUSD = BIGDECIMAL_ZERO
    ether.save()

    let tvl = new _PricesUSD('TVL')
    tvl.valueUSD = BIGDECIMAL_ZERO
    tvl.save()
  }  

  // create the tokens
  let token0 = getOrCreateToken(event.params.token0)
  let token1 = getOrCreateToken(event.params.token1)
  let LPtoken = getOrCreateToken(event.params.pair)

  let tokenTracker0 = _TokenTracker.load(event.params.token0.toHex())
  if (tokenTracker0 == null) {
    tokenTracker0 = new _TokenTracker(event.params.token0.toHex())
    tokenTracker0.whitelistPools = []
    tokenTracker0.derivedETH = BIGDECIMAL_ZERO
  }

  let tokenTracker1 = _TokenTracker.load(event.params.token1.toHex())
  if (tokenTracker1 == null) {
    tokenTracker1 = new _TokenTracker(event.params.token1.toHex())
    tokenTracker1.whitelistPools = []
    tokenTracker1.derivedETH = BIGDECIMAL_ZERO
  }

    // update white listed pools
  if (WHITELIST.includes(tokenTracker0.id)) {
    let newPools = tokenTracker1.whitelistPools
    newPools.push(event.params.pair.toHex())
    tokenTracker1.whitelistPools = newPools
  }

  if (WHITELIST.includes(tokenTracker1.id)) {
    let newPools = tokenTracker0.whitelistPools
    newPools.push(event.params.pair.toHex())
    tokenTracker0.whitelistPools = newPools
  }

  let pool = new LiquidityPool(event.params.pair.toHex())

  pool.protocol = protocol.id
  pool.inputTokens =  [token0.id, token1.id]
  pool.outputToken = LPtoken.id
  pool.totalValueLockedUSD = BIGDECIMAL_ZERO
  pool.totalVolumeUSD = BIGDECIMAL_ZERO
  pool.inputTokenBalances = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO]
  pool.outputTokenSupply = BIGDECIMAL_ZERO
  pool.outputTokenPriceUSD = BIGDECIMAL_ZERO
  pool.createdTimestamp = event.block.timestamp
  pool.createdBlockNumber = event.block.number
  pool.name = protocol.name + " " + LPtoken.symbol
  pool.symbol = LPtoken.symbol


  // create the tracked contract based on the template
  PairTemplate.create(event.params.pair)

  // save updated values
  token0.save()
  token1.save()
  LPtoken.id
  pool.save()
  protocol.save()
}
