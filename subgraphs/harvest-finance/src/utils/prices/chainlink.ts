import { Address, BigDecimal, log, BigInt } from '@graphprotocol/graph-ts'
import { ChainLinkContract } from '../../../generated/Controller/ChainLinkContract'
import { constants } from '../constants'

export namespace chainlink {
  export function getPrice(tokenAddress: Address): BigDecimal | null {
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
}
