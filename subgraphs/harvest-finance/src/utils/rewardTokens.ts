import { Address } from '@graphprotocol/graph-ts'
import { constants } from './constants'
import { tokens } from './tokens'
import { RewardToken } from '../../generated/schema'
import { NoMintRewardPool } from '../../generated/NotifyHelper/NoMintRewardPool'
import { log } from '@graphprotocol/graph-ts'
import { Vault } from '../../generated/schema'

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

  // This works until block 13805038
  export function updateRewardTokenInfo(addresses: Array<Address>): void {
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i]
      const pool_contract = NoMintRewardPool.bind(address)

      const rewardTokenAddress = pool_contract.try_rewardToken()
      if (rewardTokenAddress.reverted) {
        log.debug(
          'Contract call to NoMintRewardPool with address {} failed to obtain rewardToken',
          [address.toHexString()]
        )
        continue
      }

      const rewardToken = getOrCreateRewardToken(rewardTokenAddress.value)

      const vaultAddress = pool_contract.try_sourceVault()
      if (vaultAddress.reverted) {
        log.debug(
          'Contract call to NoMintRewardPool with address {} failed to obtain vaultAddress',
          [address.toHexString()]
        )
        continue
      }

      let vault = Vault.load(vaultAddress.value.toHexString())

      if (!vault) {
        log.debug('No vault found with address {}', [
          vaultAddress.value.toHexString(),
        ])
        continue
      }

      if (!vault!.rewardTokens!.includes(rewardToken.id)) {
        let newRewardTokens = vault.rewardTokens
        newRewardTokens!.push(rewardToken.id)
        vault.rewardTokens = newRewardTokens
      }

      // TODO We should also update the rewardRate on the rewardToken

      vault.save()
    }
  }
}
