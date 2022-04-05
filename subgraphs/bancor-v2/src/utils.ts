import { Address, BigDecimal, log } from "@graphprotocol/graph-ts"
import { DSToken } from "../generated/ConverterRegistry/DSToken"
import { LiquidityPool, LiquidityPoolFee, Token } from "../generated/schema"
import { StandardPoolConverter } from "../generated/ConverterRegistry/StandardPoolConverter"
import { BIGDECIMAL_ZERO, BNT_ADDRESS, LiquidityPoolFeeType, USDT_POOL_ADDRESS } from "./constants"
import { getOrCreateToken } from "./getters"

export function getReserveTokens(lpTokenAddress: Address): Array<Token> {
    let lpToken = DSToken.bind(lpTokenAddress)
    let standardPoolConverterAddressResult = lpToken.try_owner()
    if (standardPoolConverterAddressResult.reverted) {
      log.warning("failed to get StandardPoolConverter address for token {}", [lpTokenAddress.toHexString()])
      return []
    }
    let standardPoolConverterAddress = standardPoolConverterAddressResult.value
    let standardPoolConverter = StandardPoolConverter.bind(standardPoolConverterAddress)
    let reserveTokensResult = standardPoolConverter.try_reserveTokens()
    if (reserveTokensResult.reverted) {
      log.warning("failed to get reserve tokens for token {}", [lpTokenAddress.toHexString()])
      return []
    }
    let reserveTokens = reserveTokensResult.value
    let token0 = getOrCreateToken(reserveTokens[0])
    let token1 = getOrCreateToken(reserveTokens[1])
    return [token0, token1]
  }

  // tradingFee goes first, protocolFee goes second
  // In bancor v2, tradingFee is referred to as "conversion fee"
  // and prototolFee is referred to as "network fee"
  export function createPoolFees(pool: string): Array<string> {
    let tradingFee = new LiquidityPoolFee('trading-fee-' + pool)
    tradingFee.feeType = LiquidityPoolFeeType.DYNAMIC_TRADING_FEE
    // Bancor v2 doesn't define a default trading fee
    // therefore we can always tell the trading fee at handleConversionFeeUpdate method

    let protocolFee = new LiquidityPoolFee('protocol-fee-' + pool)
    protocolFee.feeType = LiquidityPoolFeeType.DYNAMIC_PROTOCOL_FEE
    // TODO: call NetworkSettings contract to get its initial value

    return [tradingFee.id, protocolFee.id]
  }

// rate0 = TKN-BNT, rate1 = USD-BNT, rate = TKN-USD = rate0/rate1
export function getTKNPriceUSD(pool0Address: string): BigDecimal {
    let pool0 = LiquidityPool.load(pool0Address)
    if (!pool0) {
      log.warning("[getTKNPriceUSD] pool0 {} not found", [pool0Address])
      return BIGDECIMAL_ZERO
    }
    let pool1 = LiquidityPool.load(USDT_POOL_ADDRESS)
    if (!pool1) {
      log.warning("[getTKNPriceUSD] pool1 {} not found", [USDT_POOL_ADDRESS])
      return BIGDECIMAL_ZERO
    }
    let rate0 = pool0.inputTokenBalances[1].toBigDecimal().div(pool0.inputTokenBalances[0].toBigDecimal())
    let rate1 = pool1.inputTokenBalances[1].toBigDecimal().div(pool1.inputTokenBalances[0].toBigDecimal())
    return rate0.div(rate1)
  }

  // rate = USD-BNT
export function getBNTPriceUSD(): BigDecimal {
  let pool = LiquidityPool.load(USDT_POOL_ADDRESS)
  if (!pool) {
    log.warning("[getBNTPriceUSD] pool {} not found", [USDT_POOL_ADDRESS])
    return BIGDECIMAL_ZERO
  }
  return pool.inputTokenBalances[1].toBigDecimal().div(pool.inputTokenBalances[0].toBigDecimal())
}

export function isBNT(token: Token): boolean {
    return token.id == BNT_ADDRESS
}