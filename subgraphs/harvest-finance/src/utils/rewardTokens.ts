import { Address } from '@graphprotocol/graph-ts'
import { constants } from './constants'
import { tokens } from './tokens'
import { RewardToken } from '../../generated/schema'

export namespace rewardTokens {
  export function getOrCreateRewardToken(address: Address): RewardToken {
    let rewardToken = RewardToken.load(address.toHexString())

    if (!rewardToken) {
      rewardToken = new RewardToken(address.toHexString())
      const token = tokens.findOrInitialize(address)
      const erc20Values = tokens.getData(address)

      if (!erc20Values) {
        return rewardToken
        //TODO Handle this error
      }

      token.name = erc20Values.name
      token.symbol = erc20Values.symbol
      token.decimals = erc20Values.decimals
      token.save()

      rewardToken.token = token.id
      rewardToken.type = constants.REWARD_TOKEN_TYPE_DEPOSIT

      rewardToken.save()
    }

    return rewardToken
  }
}
