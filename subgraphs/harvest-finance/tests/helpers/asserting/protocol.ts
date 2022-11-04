import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { assert } from 'matchstick-as'

const ENTITY = 'YieldAggregator'

function assertBigInt(id: string, field: string, value: BigInt): void {
  assert.fieldEquals(ENTITY, id, field, value.toString())
}

function assertBigDecimal(id: string, field: string, value: BigDecimal): void {
  assert.fieldEquals(ENTITY, id, field, value.toString())
}

function assertString(id: string, field: string, value: string): void {
  assert.fieldEquals(ENTITY, id, field, value)
}

export function name(id: string, value: string): void {
  assertString(id, 'name', value)
}

export function slug(id: string, value: string): void {
  assertString(id, 'slug', value)
}

export function schemaVersion(id: string, value: string): void {
  assertString(id, 'schemaVersion', value)
}

export function subgraphVersion(id: string, value: string): void {
  assertString(id, 'subgraphVersion', value)
}

export function methodologyVersion(id: string, value: string): void {
  assertString(id, 'methodologyVersion', value)
}

export function network(id: string, value: string): void {
  assertString(id, 'network', value)
}

export function type(id: string, value: string): void {
  assertString(id, 'type', value)
}

export function totalValueLockedUSD(id: string, value: BigDecimal): void {
  assertBigDecimal(id, 'totalValueLockedUSD', value)
}

export function protocolControlledValueUSD(
  id: string,
  value: BigDecimal
): void {
  assertBigDecimal(id, 'protocolControlledValueUSD', value)
}

export function cumulativeSupplySideRevenueUSD(
  id: string,
  value: BigDecimal
): void {
  assertBigDecimal(id, 'cumulativeSupplySideRevenueUSD', value)
}

export function cumulativeProtocolSideRevenueUSD(
  id: string,
  value: BigDecimal
): void {
  assertBigDecimal(id, 'cumulativeProtocolSideRevenueUSD', value)
}

export function cumulativeTotalRevenueUSD(id: string, value: BigDecimal): void {
  assertBigDecimal(id, 'cumulativeTotalRevenueUSD', value)
}

export function cumulativeUniqueUsers(id: string, value: BigInt): void {
  assertBigInt(id, 'cumulativeUniqueUsers', value)
}

export function totalPoolCount(id: string, value: BigInt): void {
  assertBigInt(id, 'totalPoolCount', value)
}

class AssertProtocolAttributes {
  name: string
  slug: string
  schemaVersion: string
  subgraphVersion: string
  methodologyVersion: string
  network: string
  type: string
  totalValueLockedUSD: BigDecimal
  protocolControlledValueUSD: BigDecimal
  cumulativeSupplySideRevenueUSD: BigDecimal
  cumulativeProtocolSideRevenueUSD: BigDecimal
  cumulativeTotalRevenueUSD: BigDecimal
  cumulativeUniqueUsers: BigInt
  totalPoolCount: BigInt
}

export function protocol(
  id: string,
  attributes: AssertProtocolAttributes
): void {
  name(id, attributes.name)

  slug(id, attributes.slug)

  schemaVersion(id, attributes.schemaVersion)

  subgraphVersion(id, attributes.subgraphVersion)

  methodologyVersion(id, attributes.methodologyVersion)

  network(id, attributes.network)

  type(id, attributes.type)

  totalValueLockedUSD(id, attributes.totalValueLockedUSD)

  protocolControlledValueUSD(id, attributes.protocolControlledValueUSD)

  cumulativeSupplySideRevenueUSD(id, attributes.cumulativeSupplySideRevenueUSD)

  cumulativeProtocolSideRevenueUSD(
    id,
    attributes.cumulativeProtocolSideRevenueUSD
  )

  cumulativeTotalRevenueUSD(id, attributes.cumulativeTotalRevenueUSD)

  cumulativeUniqueUsers(id, attributes.cumulativeUniqueUsers)

  totalPoolCount(id, attributes.totalPoolCount)
}
