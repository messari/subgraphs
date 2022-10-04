import { Bytes, BigInt } from '@graphprotocol/graph-ts'
import { Deposit } from '../../generated/schema'
import { constants } from './constants'

export namespace deposits {
  export function generateId(hash: Bytes, logIndex: BigInt): string {
    return hash.toHexString().concat(logIndex.toString())
  }

  export function findOrInitialize(id: string): Deposit {
    let deposit = Deposit.load(id)

    if (deposit) return deposit

    return initialize(id)
  }

  export function initialize(id: string): Deposit {
    const deposit = new Deposit(id)

    deposit.hash = ''
    deposit.logIndex = 0
    deposit.protocol = ''
    deposit.to = ''
    deposit.from = ''
    deposit.blockNumber = constants.BIG_INT_ZERO
    deposit.timestamp = constants.BIG_INT_ZERO
    deposit.asset = ''
    deposit.amount = constants.BIG_INT_ZERO
    deposit.amountUSD = constants.BIG_DECIMAL_ZERO
    deposit.vault = ''

    return deposit
  }
}
