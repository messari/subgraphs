import { assert } from 'matchstick-as'
import { BigInt } from '@graphprotocol/graph-ts'

const ENTITY = 'UsageMetricsDailySnapshot'

function assertBigInt(id: string, field: string, value: BigInt): void {
  assert.fieldEquals(ENTITY, id, field, value.toString())
}

function assertInt(id: string, field: string, value: i32): void {
  assert.fieldEquals(ENTITY, id, field, value.toString())
}

function assertString(id: string, field: string, value: string): void {
  assert.fieldEquals(ENTITY, id, field, value)
}

export function protocol(id: string, value: string): void {
  assertString(id, 'protocol', value)
}

export function activeUsers(id: string, value: i32): void {
  assertInt(id, 'dailyActiveUsers', value)
}

export function cumulativeUniqueUsers(id: string, value: i32): void {
  assertInt(id, 'cumulativeUniqueUsers', value)
}

export function transactionCount(id: string, value: i32): void {
  assertInt(id, 'dailyTransactionCount', value)
}

export function depositCount(id: string, value: i32): void {
  assertInt(id, 'dailyDepositCount', value)
}

export function withdrawCount(id: string, value: i32): void {
  assertInt(id, 'dailyWithdrawCount', value)
}

export function totalPoolCount(id: string, value: i32): void {
  assertInt(id, 'totalPoolCount', value)
}

export function blockNumber(id: string, value: BigInt): void {
  assertBigInt(id, 'blockNumber', value)
}

export function timestamp(id: string, value: BigInt): void {
  assertBigInt(id, 'timestamp', value)
}

class AssertAttributes {
  protocol: string
  activeUsers: i32
  cumulativeUniqueUsers: i32
  transactionCount: i32
  depositCount: i32
  withdrawCount: i32
  totalPoolCount: i32
  blockNumber: BigInt
  timestamp: BigInt
}

export function usageMetricsDailySnapshot(
  id: string,
  attributes: AssertAttributes
): void {
  protocol(id, attributes.protocol)
  activeUsers(id, attributes.activeUsers)
  cumulativeUniqueUsers(id, attributes.cumulativeUniqueUsers)
  transactionCount(id, attributes.transactionCount)
  depositCount(id, attributes.depositCount)
  withdrawCount(id, attributes.withdrawCount)
  totalPoolCount(id, attributes.totalPoolCount)
  blockNumber(id, attributes.blockNumber)
  timestamp(id, attributes.timestamp)
}
