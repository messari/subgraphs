import { Address } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/templates/BeefyVault/ERC20";

export function fetchTokenDecimals(tokenAddress: Address): number {
  const tokenContract = ERC20.bind(tokenAddress);
  return tokenContract.decimals();
}

export function fetchTokenName(tokenAddress: Address): string {
  const tokenContract = ERC20.bind(tokenAddress);
  return tokenContract.name();
}

export function fetchTokenSymbol(tokenAddress: Address): string {
  const tokenContract = ERC20.bind(tokenAddress);
  return tokenContract.symbol();
}
