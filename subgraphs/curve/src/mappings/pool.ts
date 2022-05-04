import { Address, ethereum, BigInt, log, BigDecimal } from "@graphprotocol/graph-ts";
import {
  AddLiquidity,
  RemoveLiquidity,
  RemoveLiquidityImbalance,
  RemoveLiquidityOne,
  TokenExchange,
  TokenExchangeUnderlying,
  NewFee,
} from "../../generated/templates/Pool/StableSwap";
import { ZERO_ADDRESS } from "../common/constants";
import { setTokenPrices } from "../common/setters";
import { getOrCreatePool } from "./registry";

export function handleAddLiquidity(event: AddLiquidity): void {
  let pool = getOrCreatePool(event.address, Address.fromString(ZERO_ADDRESS),event);
  setTokenPrices(pool,event);
}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  let pool = getOrCreatePool(event.address, Address.fromString(ZERO_ADDRESS),event);
  setTokenPrices(pool,event);
}

export function handleRemoveLiquidityImbalance(event: RemoveLiquidityImbalance): void {
  let pool = getOrCreatePool(event.address, Address.fromString(ZERO_ADDRESS),event);
  setTokenPrices(pool,event);
}

export function handleRemoveLiquidityOne(event: RemoveLiquidityOne): void {
  let pool = getOrCreatePool(event.address, Address.fromString(ZERO_ADDRESS),event);
  setTokenPrices(pool,event);
}

export function handleTokenExchange(event: TokenExchange): void {
  let pool = getOrCreatePool(event.address, Address.fromString(ZERO_ADDRESS),event);
  setTokenPrices(pool,event);
}

export function handleTokenExchangeUnderlying(event: TokenExchangeUnderlying): void {
  let pool = getOrCreatePool(event.address, Address.fromString(ZERO_ADDRESS),event);
  setTokenPrices(pool,event);
}

export function handleNewFee(event: NewFee): void {
  let pool = getOrCreatePool(event.address, Address.fromString(ZERO_ADDRESS),event);
  setTokenPrices(pool,event);
}
