import { ERC20 } from "../../types/templates/CToken/ERC20";
import { ERC20SymbolBytes } from "../../types/Comptroller/ERC20SymbolBytes";
import { ERC20NameBytes } from "../../types/Comptroller/ERC20NameBytes";
import { Address, log } from "@graphprotocol/graph-ts";

// Functions designed to try...catch erc20 name/symbol/decimals to prevent errors
export function getAssetName(address: Address): string {
  let contract = ERC20.bind(address);
  let nameCall = contract.try_name();
  if (!nameCall.reverted) {
    return nameCall.value;
  }

  let bytesContract = ERC20NameBytes.bind(address);
  let nameBytesCall = bytesContract.try_name();
  if (!nameBytesCall.reverted) {
    return nameBytesCall.value.toString();
  }

  log.error("name() call (string or bytes) reverted for {}", [address.toHex()]);
  return "UNKNOWN";
}

export function getAssetSymbol(address: Address): string {
  let contract = ERC20.bind(address);
  let symbolCall = contract.try_symbol();
  if (!symbolCall.reverted) {
    return symbolCall.value;
  }

  let bytesContract = ERC20SymbolBytes.bind(address);
  let symbolBytesCall = bytesContract.try_symbol();
  if (!symbolBytesCall.reverted) {
    return symbolBytesCall.value.toString();
  }

  log.error("symbol() call (string or bytes) reverted for {}", [address.toHex()]);
  return "UNKNOWN";
}

export function getAssetDecimals(address: Address): i32 {
  let contract = ERC20.bind(address);
  let decimalsCall = contract.try_decimals();
  if (!decimalsCall.reverted) {
    return decimalsCall.value;
  }

  log.error("decimals() call reverted for {}", [address.toHex()]);
  return -1;
}
