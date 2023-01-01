import {
  AddLiquidity,
  NewAdminFee,
  NewSwapFee,
  RemoveLiquidity,
  RemoveLiquidityImbalance,
  RemoveLiquidityOne,
  TokenSwap,
  Swap,
  TokenSwapUnderlying,
} from "../../generated/templates/Swap/Swap";
import { BIGINT_ZERO } from "../utils/constants";
import { createSwap, createDeposit, createWithdraw } from "../entities/event";
import { getOrCreatePool } from "../entities/pool";
import { createOrUpdateAllFees } from "../entities/fee";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { getOrCreateTokenFromString } from "../entities/token";
import { LiquidityPool } from "../../generated/schema";

export function handleAddLiquidity(event: AddLiquidity): void {
  createDeposit(
    event,
    event.params.tokenAmounts,
    event.params.lpTokenSupply,
    event.params.provider
  );
}

export function handleNewAdminFee(event: NewAdminFee): void {
  const contract = Swap.bind(event.address);
  createOrUpdateAllFees(
    event.address,
    contract.swapStorage().value4 /* swapFee */,
    event.params.newAdminFee
  );
}

export function handleNewSwapFee(event: NewSwapFee): void {
  const contract = Swap.bind(event.address);
  createOrUpdateAllFees(
    event.address,
    event.params.newSwapFee,
    contract.swapStorage().value5 /* adminFee */
  );
}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  createWithdraw(
    event,
    event.params.tokenAmounts,
    event.params.lpTokenSupply,
    event.params.provider
  );
}

export function handleRemoveLiquidityImbalance(
  event: RemoveLiquidityImbalance
): void {
  createWithdraw(
    event,
    event.params.tokenAmounts,
    event.params.lpTokenSupply,
    event.params.provider
  );
}

export function handleRemoveLiquidityOne(event: RemoveLiquidityOne): void {
  const pool = getOrCreatePool(event.address);
  let inputTokenCount = pool.inputTokens.length;
  if (pool._basePool) {
    const basePool = getOrCreatePool(Address.fromString(pool._basePool!));
    inputTokenCount = inputTokenCount - basePool.inputTokens.length + 1;
  }
  const inputTokenAmounts = new Array<BigInt>(inputTokenCount).map<BigInt>(
    () => BIGINT_ZERO
  );
  inputTokenAmounts[event.params.boughtId.toI32()] = event.params.tokensBought;
  createWithdraw(
    event,
    inputTokenAmounts,
    event.params.lpTokenSupply.minus(event.params.lpTokenAmount),
    event.params.provider
  );
}

export function handleTokenSwap(event: TokenSwap): void {
  const pool = getOrCreatePool(event.address);
  let tokenIn = getOrCreateTokenFromString(
    pool._inputTokensOrdered[event.params.soldId.toI32()]
  );
  let tokenOut = getOrCreateTokenFromString(
    pool._inputTokensOrdered[event.params.boughtId.toI32()]
  );

  if (isLPSwap(event, pool)) {
    const basePool = getOrCreatePool(Address.fromString(pool._basePool!));
    const lpToken = getOrCreateTokenFromString(basePool.outputToken!);
    if (event.params.soldId.gt(event.params.boughtId)) {
      tokenIn = lpToken;
    } else {
      tokenOut = lpToken;
    }
  }

  createSwap(
    pool,
    event,
    tokenIn,
    event.params.tokensSold,
    tokenOut,
    event.params.tokensBought,
    event.params.buyer
  );
}

// isLPSwap will return true if any of the tokens being swapped is an LP token from
// another saddle pool. Since metapools can be used to swap against the LP
// or against its underlying tokens.
function isLPSwap(event: TokenSwap, pool: LiquidityPool): bool {
  if (!pool._basePool) {
    return false;
  }

  const basePool = getOrCreatePool(Address.fromString(pool._basePool!));
  const lpTokenIndex = pool.inputTokens.length - basePool.inputTokens.length;
  return (
    event.params.soldId.toI32() == lpTokenIndex ||
    event.params.boughtId.toI32() == lpTokenIndex
  );
}

export function handleTokenSwapUnderlying(event: TokenSwapUnderlying): void {
  const pool = getOrCreatePool(event.address);
  const basePool = getOrCreatePool(Address.fromString(pool._basePool!));
  const lpTokenIndex = pool.inputTokens.length - basePool.inputTokens.length;
  const soldId = event.params.soldId.toI32();
  const boughtId = event.params.boughtId.toI32();
  if (soldId >= lpTokenIndex && boughtId >= lpTokenIndex) {
    // Swap is already handled in underlying pool
    return;
  }
  const tokenIn = getOrCreateTokenFromString(pool._inputTokensOrdered[soldId]);
  const tokenOut = getOrCreateTokenFromString(pool._inputTokensOrdered[boughtId]);
  createSwap(
    pool,
    event,
    tokenIn,
    event.params.tokensSold,
    tokenOut,
    event.params.tokensBought,
    event.params.buyer
  );
}
