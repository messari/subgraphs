import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export namespace integer {
  export const TEN = BigInt.fromI32(10)
}

export namespace decimals {
  export function fromBigInt(value: BigInt, decimals: u8): BigDecimal {
    const precision = integer.TEN.pow(decimals).toBigDecimal()

    return value.divDecimal(precision)
  }
}
