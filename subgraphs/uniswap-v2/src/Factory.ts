// import { log } from '@graphprotocol/graph-ts'
import { BigDecimal } from '@graphprotocol/graph-ts'
import { PairCreated, SetFeeToCall } from './../generated/Factory/Factory'
import { PROTOCOL_FEE_TO_OFF, PROTOCOL_FEE_TO_ON, TRADING_FEE_TO_OFF, TRADING_FEE_TO_ON, ZERO_ADDRESS } from './common/constants'
import { getLiquidityPool, getLiquidityPoolFee, getOrCreateDex, getOrCreateLPToken, getOrCreateTokenTracker } from './common/getters'
import { CreateLiquidityPool, UpdateTokenWhitelists } from './common/helpers'
import { findEthPerToken } from './common/Price'
import { getOrCreateToken } from './common/tokens'

export function handleNewPair(event: PairCreated): void {

  let protocol = getOrCreateDex()

  // create the tokens and tokentracker
  let token0 = getOrCreateToken(event.params.token0)
  let token1 = getOrCreateToken(event.params.token1)
  let LPtoken = getOrCreateLPToken(event.params.pair, token0, token1)

  let tokenTracker0 = getOrCreateTokenTracker(event.params.token0)
  let tokenTracker1 = getOrCreateTokenTracker(event.params.token1)

  tokenTracker0.derivedETH = findEthPerToken(tokenTracker0)
  tokenTracker1.derivedETH = findEthPerToken(tokenTracker1)

  UpdateTokenWhitelists(tokenTracker0, tokenTracker1, event.params.pair)

  CreateLiquidityPool(event, protocol, event.params.pair, token0, token1, LPtoken)

  token0.save()
  token1.save()
}

// The call handler is used to update feeTo as on or off for each pool
export function handleFeeTo(call: SetFeeToCall): void {
  let protocol = getOrCreateDex()
  let poolIds = protocol.poolIds
  let tradingFeeUpdate: BigDecimal
  let protocolFeeUpdate: BigDecimal
  if (call.inputs._feeTo.toHexString() != ZERO_ADDRESS)  {
    tradingFeeUpdate = TRADING_FEE_TO_ON
    protocolFeeUpdate = PROTOCOL_FEE_TO_ON
  } else {
    tradingFeeUpdate = TRADING_FEE_TO_OFF
    protocolFeeUpdate = PROTOCOL_FEE_TO_OFF
  }
    for (let i = 0; i < poolIds.length; i++) {
      let pool = getLiquidityPool(poolIds[i].toHexString())
      let tradingFeeId = pool.fees[0]
      let protocolFeeId = pool.fees[1]

      let tradingFee = getLiquidityPoolFee(tradingFeeId)
      tradingFee.feePercentage = tradingFeeUpdate

      let protocolFee = getLiquidityPoolFee(protocolFeeId)
      protocolFee.feePercentage = protocolFeeUpdate

      tradingFee.save()
      protocolFee.save()
  }
}