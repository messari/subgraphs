import { assert } from 'matchstick-as'
import { BigInt, Address, BigDecimal, Bytes } from '@graphprotocol/graph-ts'

const ENTITY = 'VaultDailySnapshot'

function assertBytes(id: string, field: string, value: Bytes): void {
  assert.fieldEquals(ENTITY, id, field, value.toHexString())
}

function assertBigInt(id: string, field: string, value: BigInt): void {
  assert.fieldEquals(ENTITY, id, field, value.toString())
}

function assertBigDecimal(id: string, field: string, value: BigDecimal): void {
  assert.fieldEquals(ENTITY, id, field, value.toString())
}

function assertString(id: string, field: string, value: string): void {
  assert.fieldEquals(ENTITY, id, field, value)
}

export function protocol(id: string, value: string): void {
  assertString(id, 'protocol', value)
}

export function vault(id: string, value: Address): void {
  assertBytes(id, 'vault', value)
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
export function outputTokenPriceUSD(id: string, value: BigDecimal): void {
  assertBigDecimal(id, 'outputTokenPriceUSD', value)
}
export function pricePerShare(id: string, value: BigDecimal): void {
  assertBigDecimal(id, 'pricePerShare', value)
}
export function stakedOutputTokenAmount(id: string, value: BigInt): void {
  assertBigInt(id, 'stakedOutputTokenAmount', value)
}

export function rewardTokenEmissionsAmount(id: string, value: BigInt): void {
  assertBigInt(id, 'rewardTokenEmissionsAmount', value)
}
export function rewardTokenEmissionsUSD(id: string, value: BigInt): void {
  assertBigInt(id, 'rewardTokenEmissionsUSD', value)
}

export function blockNumber(id: string, value: BigInt): void {
  assertBigInt(id, 'blockNumber', value)
}

export function timestamp(id: string, value: BigInt): void {
  assertBigInt(id, 'timestamp', value)
}

class AssertAttributes {
  protocol: string
  vault: Address
  totalValueLockedUSD: BigDecimal
  inputTokenBalance: BigInt
  outputTokenSupply: BigInt
  outputTokenPriceUSD: BigDecimal
  pricePerShare: BigDecimal
  stakedOutputTokenAmount: BigInt
  rewardTokenEmissionsAmount: BigInt[] | null
  rewardTokenEmissionsUSD: BigDecimal[] | null
  blockNumber: BigInt
  timestamp: BigInt
}

export function vaultDailySnapshot(
  id: string,
  attributes: AssertAttributes
): void {
  protocol(id, attributes.protocol)
  vault(id, attributes.vault)
  totalValueLockedUSD(id, attributes.totalValueLockedUSD)
  inputTokenBalance(id, attributes.inputTokenBalance)
  outputTokenSupply(id, attributes.outputTokenSupply)
  outputTokenPriceUSD(id, attributes.outputTokenPriceUSD)
  pricePerShare(id, attributes.pricePerShare)
  stakedOutputTokenAmount(id, attributes.stakedOutputTokenAmount)

  /*
  assert.fieldEquals(
    "VaultDailySnapshot",
    id,
    "rewardTokenEmissionsAmount",
    attributes.rewardTokenEmissionsAmount.toString()
  );

  assert.fieldEquals(
    "VaultDailySnapshot",
    id,
    "rewardTokenEmissionsUSD",
    attributes.rewardTokenEmissionsUSD.toString()
  );
  */

  blockNumber(id, attributes.blockNumber)
  timestamp(id, attributes.timestamp)
}
