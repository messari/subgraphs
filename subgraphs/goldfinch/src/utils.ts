import {ethereum, BigInt, BigDecimal, Address} from "@graphprotocol/graph-ts"
import {GoldfinchConfig} from "../generated/GoldfinchConfig/GoldfinchConfig"
import {CONFIG_KEYS_ADDRESSES, V2_2_MIGRATION_TIME} from "./constants"

export const VERSION_BEFORE_V2_2 = "BEFORE_V2_2"
export const VERSION_V2_2 = "V2_2"

export function buildId(event: ethereum.Event): string {
  return event.transaction.hash.toHexString() + event.logIndex.toString()
}

export function isAfterV2_2(timestamp: BigInt): boolean {
  return timestamp.ge(BigInt.fromString(V2_2_MIGRATION_TIME))
}

export function bigIntMin(a: BigInt, b: BigInt): BigInt {
  if (a < b) {
    return a
  }
  return b
}

export function bigIntMax(a: BigInt, b: BigInt): BigInt {
  if (a > b) {
    return a
  }
  return b
}

export function bigDecimalMin(a: BigDecimal, b: BigDecimal): BigDecimal {
  if (a < b) {
    return a
  }
  return b
}

export function bigDecimalMax(a: BigDecimal, b: BigDecimal): BigDecimal {
  if (a > b) {
    return a
  }
  return b
}

export function bigDecimalToBigInt(n: BigDecimal): BigInt {
  return BigInt.fromString(n.toString().split(".")[0])
}

// Very silly and roundabout way to round up a BigDecimal into a BigInt. But hey, it works. This will be obsolete when/if The Graph ever implements a BigDecimal.round()
export function ceil(n: BigDecimal): BigInt {
  const float = parseFloat(n.toString())
  const cieling = Math.ceil(float)
  return BigInt.fromString(cieling.toString().split(".")[0])
}

class ConfigBearer extends ethereum.SmartContract {
  config: () => Address
}

export function getAddressFromConfig<T extends ConfigBearer>(contract: T, target: CONFIG_KEYS_ADDRESSES): Address {
  const goldfinchConfigContract = GoldfinchConfig.bind(contract.config())
  return goldfinchConfigContract.getAddress(BigInt.fromI32(target))
}

/**
 * Takes an array and an item to be removed from the array. Returns a copy of the array with the desired item removed. If the desired item is not present in the original array, then this returns a copy of that array.
 * @param list
 * @param itemToRemove
 */
export function removeFromList<T>(list: T[], itemToRemove: T): T[] {
  const listCopy = list.slice(0)
  const index = list.indexOf(itemToRemove)
  if (index >= 0) {
    listCopy.splice(index, 1)
  }
  return listCopy
}
