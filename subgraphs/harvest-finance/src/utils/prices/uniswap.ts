import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { UniswapPairContract } from '../../../generated/Controller/UniswapPairContract'
import { UniswapRouterContract } from '../../../generated/Controller/UniswapRouterContract'
import { constants } from '../constants'
import { tokens } from '../tokens'

export namespace uniswap {
  export function isLpToken(tokenAddress: Address): bool {
    const contract = UniswapRouterContract.bind(tokenAddress)

    const factoryCall = contract.try_factory()

    if (factoryCall.reverted) return false

    return true
  }

  export function getPrice(tokenAddress: Address): BigDecimal | null {
    if (isLpToken(tokenAddress)) return getPricePerLpToken(tokenAddress)
    return getPricePerToken(tokenAddress)
  }

  function getLpTokenTotalLiquidityUsdc(
    tokenAddress: Address
  ): BigDecimal | null {
    const contract = UniswapPairContract.bind(tokenAddress)

    const token0Call = contract.try_token0()

    if (token0Call.reverted) return null

    const token1Call = contract.try_token1()

    if (token1Call.reverted) return null

    const token0DecimalsResult = tokens.extractDecimals(token0Call.value)

    if (token0DecimalsResult === null) return null

    const token0Decimals = token0DecimalsResult.value

    const token1DecimalsResult = tokens.extractDecimals(token1Call.value)

    if (token1DecimalsResult === null) return null

    const token1Decimals = token1DecimalsResult.value

    const reservesCall = contract.try_getReserves()

    if (reservesCall.reverted) return null

    const token0Price = getPricePerToken(token0Call.value)

    if (token0Price === null) return null

    const token1Price = getPricePerToken(token1Call.value)

    if (token1Price === null) return null

    const reserve0 = reservesCall.value.value0
    const reserve1 = reservesCall.value.value1

    if (reserve0.isZero() && reserve1.isZero()) return null

    const liquidity0UsdPrice = reserve0
      .div(constants.BIG_INT_TEN.pow(token0Decimals as u8))
      .toBigDecimal()
      .times(token0Price)

    const liquidity1UsdPrice = reserve1
      .div(constants.BIG_INT_TEN.pow(token1Decimals as u8))
      .toBigDecimal()
      .times(token1Price)

    return liquidity0UsdPrice.plus(liquidity1UsdPrice)
  }

  export function getPricePerLpToken(tokenAddress: Address): BigDecimal | null {
    const contract = UniswapPairContract.bind(tokenAddress)

    const totalLiquidityUsdPrice = getLpTokenTotalLiquidityUsdc(tokenAddress)

    if (totalLiquidityUsdPrice === null) return null

    const totalSupplyCall = contract.try_totalSupply()

    if (totalSupplyCall.reverted) return null

    const totalSupply = totalSupplyCall.value

    const decimalsCall = contract.try_decimals()

    if (decimalsCall.reverted) return null

    const decimals = decimalsCall.value

    const price = totalLiquidityUsdPrice
      .times(constants.BIG_INT_TEN.pow(decimals as u8).toBigDecimal())
      .div(totalSupply.toBigDecimal())

    return price
  }

  export function getPricePerToken(tokenAddress: Address): BigDecimal | null {
    const contract = UniswapRouterContract.bind(
      constants.UNISWAP_ROUTER_CONTRACT_ADDRESS
    )

    let path: Address[] = []

    if (tokenAddress == constants.WETH_ADDRESS) {
      path = [tokenAddress, constants.USDC_ADDRESS]
    } else {
      path = [tokenAddress, constants.WETH_ADDRESS, constants.USDC_ADDRESS]
    }

    const tokenDecimalsResult = tokens.extractDecimals(tokenAddress)

    if (tokenDecimalsResult == null) return null

    const tokenDecimals = tokenDecimalsResult.value

    const usdcData = tokens.getData(constants.USDC_ADDRESS)

    if (usdcData == null) return null

    const usdcDecimals = usdcData.decimals

    const usdcBase10 = BigInt.fromI32(10).pow(usdcDecimals as u8)

    const amountIn = BigInt.fromI32(10).pow(tokenDecimals as u8)

    const callResult = contract.try_getAmountsOut(amountIn, path)

    if (callResult.reverted) {
      log.warning('UniswapRouter getAmountsOutCall Reverted token: {}', [
        tokenAddress.toHexString(),
      ])
      return null
    }

    return callResult.value.pop().toBigDecimal().div(usdcBase10.toBigDecimal())
  }
}
