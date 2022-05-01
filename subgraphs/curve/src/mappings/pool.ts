import {
  AddLiquidity,
  RemoveLiquidity,
  RemoveLiquidityImbalance,
  RemoveLiquidityOne,
  TokenExchange,
  TokenExchangeUnderlying,
  NewFee,
} from "../../generated/templates/Pool/StableSwap";

export function handleAddLiquidity(event: AddLiquidity): void {}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {}

export function handleRemoveLiquidityImbalance(event: RemoveLiquidityImbalance): void {}

export function handleRemoveLiquidityOne(event: RemoveLiquidityOne): void {}

export function handleTokenExchange(event: TokenExchange): void {}

export function handleTokenExchangeUnderlying(event: TokenExchangeUnderlying): void {}

export function handleNewFee(event: NewFee): void {}
