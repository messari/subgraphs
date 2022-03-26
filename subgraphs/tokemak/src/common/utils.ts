import {
  BigInt,
  BigDecimal,
  ethereum,
} from '@graphprotocol/graph-ts';

export function getTimeInMillis(time: BigInt): BigInt {
  return time.times(BigInt.fromI32(1000));
}

export function getTimestampInMillis(block: ethereum.Block): BigInt {
  return block.timestamp.times(BigInt.fromI32(1000));
}

export function bigIntToPercentage(n: BigInt): BigDecimal {
  return n.toBigDecimal().div(BigDecimal.fromString("100"))
}
