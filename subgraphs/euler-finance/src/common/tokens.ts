import { ERC20 } from "../../generated/euler/ERC20";
import { ERC20SymbolBytes } from "../../generated/euler/ERC20SymbolBytes";
import { ERC20NameBytes } from "../../generated/euler/ERC20NameBytes";
import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { BIGINT_ZERO } from "./constants";

// Functions designed to try...catch erc20 name/symbol/decimals to prevent errors
export function getAssetName(address: Address): string {
  const contract = ERC20.bind(address);
  const nameCall = contract.try_name();
  if (!nameCall.reverted) {
    return nameCall.value;
  }

  const bytesContract = ERC20NameBytes.bind(address);
  const nameBytesCall = bytesContract.try_name();
  if (!nameBytesCall.reverted) {
    return nameBytesCall.value.toString();
  }

  log.error("name() call (string or bytes) reverted for {}", [address.toHex()]);
  return "UNKNOWN";
}

export function getAssetSymbol(address: Address): string {
  const contract = ERC20.bind(address);
  const symbolCall = contract.try_symbol();
  if (!symbolCall.reverted) {
    return symbolCall.value;
  }

  const bytesContract = ERC20SymbolBytes.bind(address);
  const symbolBytesCall = bytesContract.try_symbol();
  if (!symbolBytesCall.reverted) {
    return symbolBytesCall.value.toString();
  }

  log.error("symbol() call (string or bytes) reverted for {}", [address.toHex()]);
  return "UNKNOWN";
}

export function getAssetDecimals(address: Address): i32 {
  const contract = ERC20.bind(address);
  const decimalsCall = contract.try_decimals();
  if (!decimalsCall.reverted) {
    return decimalsCall.value;
  }

  log.error("decimals() call reverted for {}", [address.toHex()]);
  return -1;
}

export function getAssetTotalSupply(address: Address): BigInt {
  const contract = ERC20.bind(address);
  const supplyCall = contract.try_totalSupply();
  if (!supplyCall.reverted) {
    return supplyCall.value;
  }

  log.error("try_totalSupply() call (bigint) reverted for {}", [address.toHex()]);
  return BIGINT_ZERO;
}
