import { assert } from 'matchstick-as'
import { BigInt, Address, Bytes, BigDecimal } from '@graphprotocol/graph-ts'

class AssertEventAttributes {
  hash: Bytes
  logIndex: BigInt
  protocol: string
  to: Address
  from: Address
  blockNumber: BigInt
  timestamp: BigInt
  asset: Address
  amount: BigInt
  amountUSD: BigDecimal
  vault: Address
}

function assertBytes(id: string, field: string, value: Bytes): void {
  assert.fieldEquals('Deposit', id, field, value.toHexString())
}

function assertBigInt(id: string, field: string, value: BigInt): void {
  assert.fieldEquals('Deposit', id, field, value.toString())
}

function assertBigDecimal(id: string, field: string, value: BigDecimal): void {
  assert.fieldEquals('Deposit', id, field, value.toString())
}

function assertString(id: string, field: string, value: string): void {
  assert.fieldEquals('Deposit', id, field, value)
}

export function hash(id: string, value: Bytes): void {
  assertBytes(id, 'hash', value)
}

export function to(id: string, value: Address): void {
  assertBytes(id, 'to', value)
}

export function from(id: string, value: Address): void {
  assertBytes(id, 'from', value)
}

export function asset(id: string, value: Address): void {
  assertBytes(id, 'asset', value)
}

export function amount(id: string, value: BigInt): void {
  assertBigInt(id, 'amount', value)
}

export function vault(id: string, value: Address): void {
  assertBytes(id, 'vault', value)
}

export function logIndex(id: string, value: BigInt): void {
  assertBigInt(id, 'logIndex', value)
}

export function protocol(id: string, value: string): void {
  assertString(id, 'protocol', value)
}

export function blockNumber(id: string, value: BigInt): void {
  assertBigInt(id, 'blockNumber', value)
}

export function timestamp(id: string, value: BigInt): void {
  assertBigInt(id, 'timestamp', value)
}

export function amountUSD(id: string, value: BigDecimal): void {
  assertBigDecimal(id, 'amountUSD', value)
}

export function deposit(id: string, attributes: AssertEventAttributes): void {
  hash(id, attributes.hash)
  to(id, attributes.to)
  from(id, attributes.from)
  asset(id, attributes.asset)
  amount(id, attributes.amount)
  vault(id, attributes.vault)
  logIndex(id, attributes.logIndex)
  protocol(id, attributes.protocol)
  blockNumber(id, attributes.blockNumber)
  timestamp(id, attributes.timestamp)
  amountUSD(id, attributes.amountUSD)
}
