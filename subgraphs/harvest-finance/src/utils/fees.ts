import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { constants } from './constants'
import { VaultFee } from '../../generated/schema'

export namespace fees {
  export function getOrCreateVaultFee(
    vaultId: string,
    feeType: string,
    feePercentage: BigInt = constants.BIG_INT_ZERO
  ): VaultFee {
    let vaultFeeId = feeType.concat('-').concat(vaultId)
    let vaultFee = VaultFee.load(vaultFeeId)

    if (!vaultFee) {
      vaultFee = new VaultFee(vaultFeeId)

      vaultFee.feeType = feeType
      vaultFee.feePercentage = feePercentage
        .toBigDecimal()
        .div(BigDecimal.fromString('100'))

      vaultFee.save()
    }

    return vaultFee
  }
}
