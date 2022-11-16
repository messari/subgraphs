import { Address, BigInt, BigDecimal, Bytes } from '@graphprotocol/graph-ts'
import { assert } from 'matchstick-as'
import { toStringArray } from '../helpers'

function assertBytes(id: string, field: string, value: Bytes): void {
  assert.fieldEquals('Vault', id, field, value.toHexString())
}

function assertBigInt(id: string, field: string, value: BigInt): void {
  assert.fieldEquals('Vault', id, field, value.toString())
}

function assertBigDecimal(id: string, field: string, value: BigDecimal): void {
  assert.fieldEquals('Vault', id, field, value.toString())
}

function assertString(id: string, field: string, value: string): void {
  assert.fieldEquals('Vault', id, field, value)
}

export function inputToken(id: string, value: Bytes): void {
  assertBytes(id, 'inputToken', value)
}

export function outputToken(id: string, value: Bytes): void {
  assertBytes(id, 'outputToken', value)
}

export function depositLimit(id: string, value: BigInt): void {
  assertBigInt(id, 'depositLimit', value)
}

export function createdTimestamp(id: string, value: BigInt): void {
  assertBigInt(id, 'createdTimestamp', value)
}

export function createdBlockNumber(id: string, value: BigInt): void {
  assertBigInt(id, 'createdBlockNumber', value)
}

export function totalValueLockedUSD(id: string, value: BigDecimal): void {
  assertBigDecimal(id, 'totalValueLockedUSD', value)
}

export function inputTokenBalance(id: string, value: BigInt): void {
  assertBigInt(id, 'inputTokenBalance', value)
}

export function outputTokenSupply(id: string, value: BigInt): void {
  assertBigInt(id, 'outputTokenSupply', value)
}

export function protocol(id: string, value: string): void {
  assertString(id, 'protocol', value)
}

export function fees(id: string, value: string[]): void {
  // let feesArray: string[] = []
  // feesArray.push(value)

  assertString(id, 'fees', toStringArray(value))
}

export function name(id: string, value: string): void {
  assertString(id, 'name', value)
}

export function symbol(id: string, value: string): void {
  assertString(id, 'symbol', value)
}

export function outputTokenPriceUSD(id: string, value: BigDecimal): void {
  assertBigDecimal(id, 'outputTokenPriceUSD', value)
}

class AssertVaultAttributes {
  name: string
  symbol: string
  inputToken: Address
  outputToken: Address
  depositLimit: BigInt
  createdTimestamp: BigInt
  createdBlockNumber: BigInt
  totalValueLockedUSD: BigDecimal
  inputTokenBalance: BigInt
  outputTokenSupply: BigInt
  protocol: string
  fees: string[]
}

export function vault(id: string, attributes: AssertVaultAttributes): void {
  name(id, attributes.name)
  symbol(id, attributes.symbol)
  inputToken(id, attributes.inputToken)
  outputToken(id, attributes.outputToken)
  depositLimit(id, attributes.depositLimit)
  createdTimestamp(id, attributes.createdTimestamp)
  createdBlockNumber(id, attributes.createdBlockNumber)
  totalValueLockedUSD(id, attributes.totalValueLockedUSD)
  inputTokenBalance(id, attributes.inputTokenBalance)
  outputTokenSupply(id, attributes.outputTokenSupply)
  protocol(id, attributes.protocol)
  fees(id, attributes.fees)
}
