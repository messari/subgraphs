import { ERC20 } from "../../generated/Vault/ERC20";
import { LinearPool } from "../../generated/Vault/LinearPool";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { getOrCreateToken } from "./getters";

export function fetchTokenSymbol(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress);
  let symbol = contract.try_symbol();
  if (symbol.reverted) {
    return "";
  }
  return symbol.value;
}

export function fetchTokenName(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress);
  let name = contract.try_name();
  if (name.reverted) {
    return "";
  }
  return name.value;
}

export function fetchTokenDecimals(tokenAddress: Address): i32 {
  let contract = ERC20.bind(tokenAddress);
  let decimals = contract.try_decimals();
  if (decimals.reverted) {
    return 18;
  }
  return decimals.value;
}

export function scaleDown(amount: BigInt, token: Address | null): BigDecimal {
  let decimals = 18;
  if (token) decimals = getOrCreateToken(token).decimals;
  return amount.divDecimal(BigInt.fromI32(10).pow(u8(decimals)).toBigDecimal());
}

export function hasVirtualSupply(poolAddress: Address): bool {
  let pool = LinearPool.bind(poolAddress);
  let virtualSupply = pool.try_getVirtualSupply();
  return !virtualSupply.reverted;
}
