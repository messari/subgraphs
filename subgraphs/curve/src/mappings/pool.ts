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
import { getOrCreatePool } from "./registry";

export function handleAddLiquidity(event: AddLiquidity): void {
  let pool = getOrCreatePool(event.address, Address.fromString(ZERO_ADDRESS),event);
  
}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {}

export function handleRemoveLiquidityImbalance(event: RemoveLiquidityImbalance): void {}

export function handleRemoveLiquidityOne(event: RemoveLiquidityOne): void {}

export function handleTokenExchange(event: TokenExchange): void {}

export function handleTokenExchangeUnderlying(event: TokenExchangeUnderlying): void {}

export function handleNewFee(event: NewFee): void {}
