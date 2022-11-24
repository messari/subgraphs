import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { assert } from 'matchstick-as'

const ENTITY = 'Token'

function assertBigDecimal(id: string, field: string, value: BigDecimal): void {
  assert.fieldEquals(ENTITY, id, field, value.toString())
}

function assertBigInt(id: string, field: string, value: BigInt): void {
  assert.fieldEquals(ENTITY, id, field, value.toString())
}

function assertString(id: string, field: string, value: string): void {
  assert.fieldEquals(ENTITY, id, field, value)
}

export function name(id: string, value: string): void {
  assertString(id, 'name', value)
}

export function symbol(id: string, value: string): void {
  assertString(id, 'symbol', value)
}

export function decimals(id: string, value: BigInt): void {
  assertBigInt(id, 'decimals', value)
}

export function lastPriceUSD(id: string, value: BigDecimal): void {
  assertBigDecimal(id, 'lastPriceUSD', value)
}

export function lastPriceBlockNumber(id: string, value: BigInt): void {
  assertBigInt(id, 'lastPriceBlockNumber', value)
}

class AssertTokenAttributes {
  name: string
  symbol: string
  decimals: BigInt
}

export function token(id: string, attributes: AssertTokenAttributes): void {
  name(id, attributes.name)
  symbol(id, attributes.symbol)
  decimals(id, attributes.decimals)
}
