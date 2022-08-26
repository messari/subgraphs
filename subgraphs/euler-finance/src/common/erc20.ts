import { Address, BigInt } from '@graphprotocol/graph-ts';
import { ERC20 } from '../../generated/euler/ERC20';
import { ERC20SymbolBytes } from '../../generated/euler/ERC20SymbolBytes';
import { ERC20NameBytes } from '../../generated/euler/ERC20NameBytes';
import { isNullEthValue } from './conversions';
import { StaticTokenDefinition } from './staticTokenDefinition';

export function fetchTokenSymbol(tokenAddress: Address): string {
  const contract = ERC20.bind(tokenAddress);
  const contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress);

  // try types string and bytes32 for symbol
  let symbolValue = 'unknown';
  const symbolResult = contract.try_symbol();

  if (symbolResult.reverted) {
    const symbolResultBytes = contractSymbolBytes.try_symbol();

    if (!symbolResultBytes.reverted) {
      // for broken pairs that have no symbol function exposed
      if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
        symbolValue = symbolResultBytes.value.toString();
      } else {
        // try with the static definition
        const staticTokenDefinition = StaticTokenDefinition.fromAddress(tokenAddress);

        if(staticTokenDefinition != null) {
          symbolValue = staticTokenDefinition.symbol;
        }
      }
    }
  } else {
    symbolValue = symbolResult.value;
  }

  return symbolValue;
}

export function fetchTokenName(tokenAddress: Address): string {
  const contract = ERC20.bind(tokenAddress);
  const contractNameBytes = ERC20NameBytes.bind(tokenAddress);

  // try types string and bytes32 for name
  let nameValue = 'unknown';
  const nameResult = contract.try_name();

  if (nameResult.reverted) {
    const nameResultBytes = contractNameBytes.try_name();

    if (!nameResultBytes.reverted) {
      // for broken exchanges that have no name function exposed
      if (!isNullEthValue(nameResultBytes.value.toHexString())) {
        nameValue = nameResultBytes.value.toString();
      } else {
        // try with the static definition
        const staticTokenDefinition = StaticTokenDefinition.fromAddress(tokenAddress);
        if(staticTokenDefinition != null) {
          nameValue = staticTokenDefinition.name;
        }
      }
    }
  } else {
    nameValue = nameResult.value;
  }

  return nameValue;
}

export function fetchTokenTotalSupply(tokenAddress: Address): BigInt {
  const contract = ERC20.bind(tokenAddress);
  let totalSupplyValue = BigInt.fromI32(0);
  const totalSupplyResult = contract.try_totalSupply();

  if (!totalSupplyResult.reverted) {
    totalSupplyValue = totalSupplyResult.value;
  }

  return totalSupplyValue;
}

export function fetchTokenDecimals(tokenAddress: Address): BigInt {
  const contract = ERC20.bind(tokenAddress);
  // try types uint8 for decimals
  let decimalValue = i32(0);
  const decimalResult = contract.try_decimals();

  if (!decimalResult.reverted) {
    decimalValue = decimalResult.value;
  } else {
    // try with the static definition
    const staticTokenDefinition = StaticTokenDefinition.fromAddress(tokenAddress);

    if(staticTokenDefinition != null) {
      return staticTokenDefinition.decimals;
    }
  }

  return BigInt.fromI32(decimalValue);
}
