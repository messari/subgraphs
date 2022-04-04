/* eslint-disable prefer-const */
import { ERC20 } from '../../generated/Factory/ERC20'
import { Address } from '@graphprotocol/graph-ts'
import { DEFAULT_DECIMALS } from '../common/constants'
import { Token } from '../../generated/schema'

export function getOrCreateToken(address: Address): Token {
  let id = address.toHexString();
  let token = Token.load(id);
  if (!token) {
    token = new Token(id);
    let erc20Contract = ERC20.bind(address);
    let decimals = erc20Contract.try_decimals();
    // Using try_cause some values might be missing
    let name = erc20Contract.try_name();
    let symbol = erc20Contract.try_symbol();
    // TODO: add overrides for name and symbol
    token.decimals = decimals.reverted ? DEFAULT_DECIMALS : decimals.value;
    token.name = name.reverted ? '' : name.value;
    token.symbol = symbol.reverted ? '' : symbol.value;
    token.save();
  }
  return token as Token;
}

export function getOrCreateLPToken(tokenAddress: Address, token0: Token, token1: Token): Token {
  let id = tokenAddress.toHexString();
  let token = Token.load(id)
  // fetch info if null
  if (token === null) {
      token = new Token(tokenAddress.toHexString())
      token.symbol = token0.name + '/' + token1.name
      token.name = token0.name + '/' + token1.name + " LP"
      token.decimals = DEFAULT_DECIMALS
      token.save()
  }
  return token
}

// export function fetchTokenSymbol(tokenAddress: Address): string {
//   let contract = ERC20.bind(tokenAddress)
//   let contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress)

//   // try types string and bytes32 for symbol
//   let symbolValue = 'unknown'
//   let symbolResult = contract.try_symbol()
//   if (symbolResult.reverted) {
//     let symbolResultBytes = contractSymbolBytes.try_symbol()
//     if (!symbolResultBytes.reverted) {
//       // for broken pairs that have no symbol function exposed
//       if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
//         symbolValue = symbolResultBytes.value.toString()
//       } else {
//         // try with the static definition
//         let staticTokenDefinition = StaticTokenDefinition.fromAddress(tokenAddress)
//         if(staticTokenDefinition != null) {
//           symbolValue = staticTokenDefinition.symbol
//         }
//       }
//     }
//   } else {
//     symbolValue = symbolResult.value
//   }

//   return symbolValue
// }

// export function fetchTokenName(tokenAddress: Address): string {
//   let contract = ERC20.bind(tokenAddress)
//   let contractNameBytes = ERC20NameBytes.bind(tokenAddress)

//   // try types string and bytes32 for name
//   let nameValue = 'unknown'
//   let nameResult = contract.try_name()
//   if (nameResult.reverted) {
//     let nameResultBytes = contractNameBytes.try_name()
//     if (!nameResultBytes.reverted) {
//       // for broken exchanges that have no name function exposed
//       if (!isNullEthValue(nameResultBytes.value.toHexString())) {
//         nameValue = nameResultBytes.value.toString()
//       } else {
//         // try with the static definition
//         let staticTokenDefinition = StaticTokenDefinition.fromAddress(tokenAddress)
//         if(staticTokenDefinition != null) {
//           nameValue = staticTokenDefinition.name
//         }
//       }
//     }
//   } else {
//     nameValue = nameResult.value
//   }

//   return nameValue
// }

// export function fetchTokenDecimals(tokenAddress: Address): i32 {
//   log.warning("3.1", [])
//   // static definitions overrides
//   let staticDefinition = StaticTokenDefinition.fromAddress(tokenAddress)
//   log.warning("3.2", [])

//   if(staticDefinition != null) {
//     return (staticDefinition as StaticTokenDefinition).decimals
//   }

//   let contract = ERC20.bind(tokenAddress)
//   // try types uint8 for decimals
//   let decimalValue = DECIMAL_ERROR_VALUE
//   let decimalResult = contract.try_decimals()
//   if (!decimalResult.reverted) {
//     decimalValue = decimalResult.value
//   }

//   log.warning("DECIMAL: " + decimalValue.toString(), [])
//   return decimalValue as i32
// }

// export function isNullEthValue(value: string): boolean {
//   return value == '0x0000000000000000000000000000000000000000000000000000000000000001'
// }
