import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { createMockedFunction } from 'matchstick-as'

export namespace helpers {
  export namespace mock {
    export function vault_underlyingBalanceWithInvestment(
      address: Address,
      value: BigInt
    ): void {
      createMockedFunction(
        address,
        'underlyingBalanceWithInvestment',
        'underlyingBalanceWithInvestment():(uint256)'
      ).returns([ethereum.Value.fromUnsignedBigInt(value)])
    }
  }
}
