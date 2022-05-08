import { Address, Bytes } from '@graphprotocol/graph-ts'
import { ADDRESS_ZERO } from 'const'

export function bytesToAddress(input: Bytes): Address {
  const inputAsStr = input.toHexString()
  if (inputAsStr.length != 42) {
    return ADDRESS_ZERO
  } else return Address.fromString(inputAsStr)
}
