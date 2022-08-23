import { Address } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/aave-aave-eol/ERC20";

export function fetchTokenDecimals(tokenAddress: Address): number {
  const tokenContract = ERC20.bind(tokenAddress);
  const call = tokenContract.try_decimals();
  if (call.reverted) {
    return 0;
  } else {
    return call.value;
  }
}

export function fetchTokenName(tokenAddress: Address): string {
  const tokenContract = ERC20.bind(tokenAddress);
  const call = tokenContract.try_name();
  if (call.reverted) {
    return tokenAddress.toHexString();
  } else {
    return call.value;
  }
}

export function fetchTokenSymbol(tokenAddress: Address): string {
  const tokenContract = ERC20.bind(tokenAddress);
  const call = tokenContract.try_symbol();
  if (call.reverted) {
    return " ";
  } else {
    return call.value;
  }
}
