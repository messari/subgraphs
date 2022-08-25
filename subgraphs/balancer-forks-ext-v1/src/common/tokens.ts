import { ERC20 } from "../../generated/Vault/ERC20";
import { Address, BigDecimal, BigInt  } from "@graphprotocol/graph-ts";
import { getOrCreateToken } from "./getters";
import { BASE_ASSETS, BIGINT_ZERO, USD_STABLE_ASSETS } from "./constants";
import { Token } from "../../generated/schema";

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
  if (token) {
    decimals = getOrCreateToken(token.toHexString(), BIGINT_ZERO).decimals;
  }
  return amount.divDecimal(BigInt.fromI32(10).pow(u8(decimals)).toBigDecimal());
}

export function isUSDStable(asset: Address): boolean {
  if (USD_STABLE_ASSETS.indexOf(asset) > -1) {
    return true;
  }
  return false;
}

export function isBaseAsset(asset: Address): boolean {
  if (BASE_ASSETS.indexOf(asset) > -1) {
    return true;
  }
  return false;
}

export function tokenAmountToUSDAmount(token: Token, amount: BigInt): BigDecimal {
  return token.lastPriceUSD!.times(
    amount.divDecimal(
      BigInt.fromI32(10)
        .pow(token.decimals as u8)
        .toBigDecimal(),
    ),
  );
}
