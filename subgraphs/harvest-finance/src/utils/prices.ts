import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { ChainLinkContract } from '../../generated/Controller/ChainLinkContract'
import { YearnLensContract } from '../../generated/Controller/YearnLensContract'
import { UniswapRouterContract } from '../../generated/Controller/UniswapRouterContract'
import { tokens } from './tokens'
import { constants } from './constants'

export namespace prices {
  export function getPricePerToken(tokenAddress: Address): BigDecimal {
    const chainLinkPricePerToken = getChainLinkPricePerToken(tokenAddress)

    if (chainLinkPricePerToken) return chainLinkPricePerToken

    const yearnLensPricePerToken = getYearnLensPricePerToken(tokenAddress)

    if (yearnLensPricePerToken) return yearnLensPricePerToken

    const uniswapPricePerToken = getUniswapPricePerToken(tokenAddress)

    if (uniswapPricePerToken) return uniswapPricePerToken

    return BigDecimal.fromString('0')
  }

  export function getUniswapPricePerToken(
    tokenAddress: Address
  ): BigDecimal | null {
    const contract = UniswapRouterContract.bind(
      constants.UNISWAP_ROUTER_CONTRACT_ADDRESS
    )

    const path = [tokenAddress, constants.WETH_ADDRESS, constants.USDC_ADDRESS]

    const tokenData = tokens.getData(tokenAddress)

    if (tokenData == null) return null

    const tokenDecimals = tokenData.decimals

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

  export function getYearnLensPricePerToken(
    tokenAddress: Address
  ): BigDecimal | null {
    const contract = YearnLensContract.bind(
      constants.YEARN_LENS_CONTRACT_ADDRESS
    )

    const callResult = contract.try_getPriceUsdcRecommended(tokenAddress)

    if (callResult.reverted) {
      log.warning('YearnLens getPriceUsdcRecommendedCall Reverted token: {}', [
        tokenAddress.toHexString(),
      ])
      return null
    }

    const usdcBase10 = BigInt.fromI32(10).pow(6)

    return callResult.value.toBigDecimal().div(usdcBase10.toBigDecimal())
  }

  export function getChainLinkPricePerToken(
    tokenAddress: Address
  ): BigDecimal | null {
    const contract = ChainLinkContract.bind(
      constants.CHAIN_LINK_CONTRACT_ADDRESS
    )

    const latestRoundDataCall = contract.try_latestRoundData(
      tokenAddress,
      constants.CHAIN_LINK_USD_ADDRESS
    )

    if (latestRoundDataCall.reverted) {
      log.warning('ChainLink latestRoundDataCall Reverted base: {}', [
        tokenAddress.toHexString(),
      ])
      return null
    }

    const decimalsCall = contract.try_decimals(
      tokenAddress,
      constants.CHAIN_LINK_USD_ADDRESS
    )

    if (decimalsCall.reverted) {
      log.warning('ChainLink decimalsCall Reverted base: {}', [
        tokenAddress.toHexString(),
      ])
      return null
    }

    const decimals = decimalsCall.value

    const decimalsBase10 = BigInt.fromI32(10).pow(decimals as u8)

    return latestRoundDataCall.value.value1
      .toBigDecimal()
      .div(decimalsBase10.toBigDecimal())
  }

  export function getPrice(
    tokenAddress: Address,
    amount: BigDecimal
  ): BigDecimal {
    return getPricePerToken(tokenAddress).times(amount)
  }
}
