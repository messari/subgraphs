import { Address, JSONValue, Value, log, ipfs, BigInt, BigDecimal } from '@graphprotocol/graph-ts'

import { Token } from '../../generated/schema'
import { ERC20 } from '../../generated/TokenRegistry/ERC20'
import { Unknown as UnknownEvent } from "../../generated/TokenRegistry/TokenRegistry"

import { BurnableToken, MintableToken, StandardToken } from '../../generated/templates'

import { REGISTRY_HASH, DEFAULT_DECIMALS, DETAILED_TOKEN, BURN_EVENT, MINT_EVENT, BURN_TRANSFER, MINT_TRANSFER, 
  PAUSABLE_TOKEN, BIGINT_ZERO, BIGDECIMAL_ZERO } from '../common/constants'

export function decodeFlags(value: u64): string[] {
  let flags: string[] = []

  if (isDetailed(value)) {
    flags.push('detailed')
  }

  if (isBurnable(value)) {
    flags.push('burnable')

    if (hasBurnEvent(value)) {
      flags.push('burnable-event')
    }

    if (hasBurnTransfer(value)) {
      flags.push('burnable-transfer')
    }
  }

  if (isMintable(value)) {
    flags.push('mintable')

    if (hasMintEvent(value)) {
      flags.push('mintable-event')
    }

    if (hasMintTransfer(value)) {
      flags.push('mintable-transfer')
    }
  }

  if(isPausable(value)) {
    flags.push('pausable')
  }

  return flags
}

// If token contract implements optional ERC20 fields
export function isDetailed(flags: u64): boolean {
  return (flags & DETAILED_TOKEN) != 0
}

// If tokens can be irreversibly destroyed
export function isBurnable(flags: u64): boolean {
  return hasBurnEvent(flags) || hasBurnTransfer(flags)
}

// If token contract emits Burn event when destroy/burn tokens
export function hasBurnEvent(flags: u64): boolean {
  return (flags & BURN_EVENT) != 0
}

// If token contract emits Transfer event to genesis address when destroy/burn tokens
export function hasBurnTransfer(flags: u64): boolean {
  return (flags & BURN_TRANSFER) != 0
}

// If tokens can be created or minted
export function isMintable(flags: u64): boolean {
  return hasMintEvent(flags) || hasMintTransfer(flags)
}

// If token contract emits Mint event when create/mint tokens
export function hasMintEvent(flags: u64): boolean {
  return (flags & MINT_EVENT) != 0
}

// If token contract emits Transfer event from genesis address when create/mint tokens
export function hasMintTransfer(flags: u64): boolean {
  return (flags & MINT_TRANSFER) != 0
}

// If tokens supports pausable transfers
export function isPausable(flags: u64): boolean {
  return (flags & PAUSABLE_TOKEN) != 0
}

export function toDecimal(value: BigInt, decimals: u32): BigDecimal {
  let precision = BigInt.fromI32(10)
    .pow(<u8>decimals)
    .toBigDecimal()

  return value.divDecimal(precision)
}

export function initTokenList(event: UnknownEvent): void {
  log.debug('Initializing token registry, block={}', [event.block.number.toString()])

  ipfs.mapJSON(REGISTRY_HASH, 'createToken', Value.fromString(''))
}

export function createToken(value: JSONValue, userData: Value): void {

  
  let rawData = value.toArray() 
    
  let address = rawData[0].isNull() ? "" : rawData[0].toString()
  let name = rawData[1].isNull() ? "" : rawData[1].toString()
  let symbol = rawData[2].isNull() ? "" : rawData[2].toString()
  let decimals: u32 = rawData[3].isNull() ? DEFAULT_DECIMALS : rawData[3].toBigInt().toI32()
  let totalSupply = rawData[4].isNull() ? BIGDECIMAL_ZERO : new BigDecimal(rawData[4].toBigInt())
  let flags: u16 = rawData[5].isNull() ? 0 : (rawData[5].toU64() as u16)
  
  
  if (address != null) {
    let contractAddress = Address.fromString(address)

    // Persist token data if it didn't exist
    let token = Token.load(contractAddress.toHex())

    if (token == null) {
      token = new Token(contractAddress.toHex())
      token.name = name
      token.symbol = symbol
      token.decimals = decimals
      token.flags = decodeFlags(flags)

      token.holderCount = BIGINT_ZERO
      token.transferCount = BIGINT_ZERO
      token.mintCount = BIGINT_ZERO
      token.burnCount = BIGINT_ZERO

      token.totalSupply = totalSupply
      token.totalBurned = BIGDECIMAL_ZERO
      token.totalMinted = BIGDECIMAL_ZERO

      log.debug('Adding token to registry, name: {}, symbol: {}, address: {}, decimals: {}, flags: {}', [
        token.name,
        token.symbol,
        token.id,
        decimals.toString(), 
        token.flags.length ? token.flags.join('|') : 'none',
      ])

      token.save()

      // Start indexing token events
      StandardToken.create(contractAddress)

      if (hasBurnEvent(flags)) {
        BurnableToken.create(contractAddress)
      }

      if (hasMintEvent(flags)) {
        MintableToken.create(contractAddress)
      }

    } else {
      log.warning('Token {} already in registry', [contractAddress.toHex()])
    }
  }
}
