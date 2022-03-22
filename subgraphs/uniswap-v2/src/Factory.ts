// import { log } from '@graphprotocol/graph-ts'
import { log } from '@graphprotocol/graph-ts'
import { PairCreated } from './../generated/Factory/Factory'
import { DexAmmProtocol, LiquidityPool, Token, _Bundle, _TokenTracker } from './../generated/schema'
import { Pair as PairTemplate } from '../generated/templates'
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from './common/tokens'
import { WHITELIST } from './common/Price'
import {
  FACTORY_ADDRESS,
  BIGDECIMAL_ZERO,
  ProtocolType,
  Network,
  BIGDECIMAL_ONE,
  INT_ZERO
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
    let ether = new _Bundle('ETH')
    ether.valueDecimal = BIGDECIMAL_ZERO
    ether.save()

    // Tracks the total value locked accross all pools 
    let tvl = new _Bundle('TVL')
    tvl.valueDecimal = BIGDECIMAL_ZERO
    tvl.save()

    // Tracks the total number of unique users of the protocol 
    let uniqueUsersTotal = new _Bundle('USERS')
    uniqueUsersTotal.valueInt = INT_ZERO
    uniqueUsersTotal.save()
  }  

  // create the tokens
  let token0 = Token.load(event.params.token0.toHexString())
  let token1 = Token.load(event.params.token1.toHexString())
  let LPtoken = Token.load(event.params.pair.toHexString())

  // fetch info if null
  if (token0 === null) {
    token0 = new Token(event.params.token0.toHexString())
    token0.symbol = fetchTokenSymbol(event.params.token0)
    token0.name = fetchTokenName(event.params.token0)
    let decimals = fetchTokenDecimals(event.params.token0)

    // bail if we couldn't figure out the decimals
    if (decimals == 9999) {
      log.debug('mybug the decimal on token 0 was null', [])
      return
    }

    token0.decimals = decimals
  }

  if (token1 === null) {
    token1 = new Token(event.params.token1.toHexString())
    token1.symbol = fetchTokenSymbol(event.params.token1)
    token1.name = fetchTokenName(event.params.token1)
    let decimals = fetchTokenDecimals(event.params.token1)
    
    // bail if we couldn't figure out the decimals
    if (decimals == 9999) {
      log.debug('mybug the decimal on token 0 was null', [])
      return
    }
    token1.decimals = decimals
  }

  if (LPtoken === null) {
    LPtoken = new Token(event.params.pair.toHexString())
    LPtoken.symbol = token0.symbol + '/' + token1.symbol
    LPtoken.name = "UNI-v3 " + token0.symbol + '/' + token1.symbol
    let decimals = fetchTokenDecimals(event.params.pair)
    
    // bail if we couldn't figure out the decimals
    if (decimals == 9999) {
      log.debug('mybug the decimal on token 0 was null', [])
      return
    }
    LPtoken.decimals = decimals
  }

  let tokenTracker0 = _TokenTracker.load(event.params.token0.toHexString())
  if (tokenTracker0 == null) {
    tokenTracker0 = new _TokenTracker(event.params.token0.toHexString())
    tokenTracker0.whitelistPools = []
    tokenTracker0.derivedETH = BIGDECIMAL_ZERO
  }
  
  let tokenTracker1 = _TokenTracker.load(event.params.token1.toHexString())
  if (tokenTracker1 == null) {
    tokenTracker1 = new _TokenTracker(event.params.token1.toHexString())
    tokenTracker1.whitelistPools = []
    tokenTracker1.derivedETH = BIGDECIMAL_ZERO
  }


    // update white listed pools
  if (WHITELIST.includes(tokenTracker0.id)) {
    let newPools = tokenTracker1.whitelistPools
    newPools.push(event.params.pair.toHexString())
    tokenTracker1.whitelistPools = newPools
  }

  if (WHITELIST.includes(tokenTracker1.id)) {
    let newPools = tokenTracker0.whitelistPools
    newPools.push(event.params.pair.toHexString())
    tokenTracker0.whitelistPools = newPools
  }

  let poolDeposits = new _Bundle(event.params.pair.toHexString())
  poolDeposits.valueInt = INT_ZERO

  let pool = new LiquidityPool(event.params.pair.toHexString())

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
  tokenTracker0.save()
  tokenTracker1.save()
  LPtoken.save()
  pool.save()
  poolDeposits.save()
  protocol.save()
}
