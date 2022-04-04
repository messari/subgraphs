import { log } from '@graphprotocol/graph-ts'
import { ERC20 } from '../../generated/Factory/ERC20'
import { ERC20SymbolBytes } from '../../generated/Factory/ERC20SymbolBytes'
import { ERC20NameBytes } from '../../generated/Factory/ERC20NameBytes'
import { StaticTokenDefinition } from './staticTokenDefinition'
import { Address } from '@graphprotocol/graph-ts'
import { INT_ZERO } from './constants'

export function fetchTokenSymbol(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress)
  let contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress)

  // try types string and bytes32 for symbol
  let symbolValue = 'unknown'
  let symbolResult = contract.try_symbol()
  if (symbolResult.reverted) {
    let symbolResultBytes = contractSymbolBytes.try_symbol()
    if (!symbolResultBytes.reverted) {
      // for broken pairs that have no symbol function exposed
      if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
        symbolValue = symbolResultBytes.value.toString()
      } else {
        // try with the static definition
        let staticTokenDefinition = StaticTokenDefinition.fromAddress(tokenAddress)
        if(staticTokenDefinition != null) {
          symbolValue = staticTokenDefinition.symbol
        }
      }
    }
  } else {
    symbolValue = symbolResult.value
  }

  return symbolValue
}

export function fetchTokenName(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress)
  let contractNameBytes = ERC20NameBytes.bind(tokenAddress)

  // try types string and bytes32 for name
  let nameValue = 'unknown'
  let nameResult = contract.try_name()
  if (nameResult.reverted) {
    let nameResultBytes = contractNameBytes.try_name()
    if (!nameResultBytes.reverted) {
      // for broken exchanges that have no name function exposed
      if (!isNullEthValue(nameResultBytes.value.toHexString())) {
        nameValue = nameResultBytes.value.toString()
      } else {
        // try with the static definition
        let staticTokenDefinition = StaticTokenDefinition.fromAddress(tokenAddress)
        if(staticTokenDefinition != null) {
          nameValue = staticTokenDefinition.name
        }
      }
    }
  } else {
    nameValue = nameResult.value
  }

  return nameValue
}


export function fetchTokenDecimals(tokenAddress: Address): i32 {
  let contract = ERC20.bind(tokenAddress)
  // try types uint8 for decimals
  let decimalValue = INT_ZERO
  let decimalResult = contract.try_decimals()
  if (!decimalResult.reverted) {
    decimalValue = decimalResult.value
  } else {
    // try with the static definition
    let staticTokenDefinition = StaticTokenDefinition.fromAddress(tokenAddress)
    if(staticTokenDefinition != null) {
      return staticTokenDefinition.decimals
    } else {
        log.warning("Could not find decimal for " + tokenAddress.toHexString(), [])
    }
  }
  return decimalValue
}

export function isNullEthValue(value: string): boolean {
  return value == '0x0000000000000000000000000000000000000000000000000000000000000001'
}