import { Address, log } from '@graphprotocol/graph-ts'
import { BigDecimal } from '@graphprotocol/graph-ts'
import { PairCreated, SetFeeToCall } from '../../generated/Factory/Factory'
import { PROTOCOL_FEE_TO_OFF, PROTOCOL_FEE_TO_ON, LP_FEE_TO_OFF, LP_FEE_TO_ON, ZERO_ADDRESS } from '../common/constants'
import { getLiquidityPool, getLiquidityPoolFee, getOrCreateDex, getOrCreateLPToken, getOrCreateToken, getOrCreateTokenTracker } from '../common/getters'
import { updateTokenWhitelists } from '../common/updateMetrics'
import { createLiquidityPool } from '../common/creators'
import { getPriceUsdc } from '../Prices/routers/UniswapRouter'

export function handleNewPair(event: PairCreated): void {
  let protocol = getOrCreateDex()

  // create the tokens and tokentracker
  let token0 = getOrCreateToken(event.params.token0)
  let token1 = getOrCreateToken(event.params.token1)
  let LPtoken = getOrCreateLPToken(event.params.pair, token0, token1)

  let tokenTracker0 = getOrCreateTokenTracker(event.params.token0)
  let tokenTracker1 = getOrCreateTokenTracker(event.params.token1)

  // Using function getUsdPricePerToken(tokenAddr: Address)
  let fetchPrice0 = getPriceUsdc(Address.fromBytes(token0.id), protocol.network);
  if (!fetchPrice0.reverted) {
    tokenTracker0.derivedUSD = fetchPrice0.usdPrice.div(
      fetchPrice0.decimals.toBigDecimal()
    );
  } else {
    // default value of this variable, if reverted is BigDecimal Zero
    tokenTracker0.derivedUSD = fetchPrice0.usdPrice
  }

  let fetchPrice1 = getPriceUsdc(Address.fromBytes(token0.id), protocol.network);
  if (!fetchPrice1.reverted) {
    tokenTracker1.derivedUSD = fetchPrice1.usdPrice.div(
      fetchPrice1.decimals.toBigDecimal()
    );
  } else {
    // default value of this variable, if reverted is BigDecimal Zero
    tokenTracker1.derivedUSD = fetchPrice1.usdPrice
  }

  updateTokenWhitelists(tokenTracker0, tokenTracker1, event.params.pair)

  createLiquidityPool(event, protocol, event.params.pair, token0, token1, LPtoken)

  token0.save()
  token1.save()
}

// The call handler is used to update feeTo as on or off for each pool
export function handleFeeTo(call: SetFeeToCall): void {

  let protocol = getOrCreateDex()
  let poolIds = protocol._poolIds
  let lpFeeUpdate: BigDecimal
  let protocolFeeUpdate: BigDecimal
  if (call.inputs._feeTo != ZERO_ADDRESS)  {
    lpFeeUpdate = LP_FEE_TO_ON
    protocolFeeUpdate = PROTOCOL_FEE_TO_ON
  } else {
    lpFeeUpdate = LP_FEE_TO_OFF
    protocolFeeUpdate = PROTOCOL_FEE_TO_OFF
  }
    for (let i = 0; i < poolIds.length; i++) {
      let pool = getLiquidityPool(poolIds[i])
      let lpFeeId = pool.fees[0]
      let protocolFeeId = pool.fees[1]

      let lpFee = getLiquidityPoolFee(lpFeeId)
      lpFee.feePercentage = lpFeeUpdate

      let protocolFee = getLiquidityPoolFee(protocolFeeId)
      protocolFee.feePercentage = protocolFeeUpdate

      lpFee.save()
      protocolFee.save()
  }
}
