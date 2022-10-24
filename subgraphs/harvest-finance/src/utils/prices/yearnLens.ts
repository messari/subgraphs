import { Address, BigDecimal, log, BigInt } from '@graphprotocol/graph-ts'
import { YearnLensContract } from '../../../generated/Controller/YearnLensContract'
import { constants } from '../constants'

export namespace yearnLens {
  export function getPrice(tokenAddress: Address): BigDecimal | null {
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
}
