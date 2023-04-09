import { BigInt } from "@graphprotocol/graph-ts";
import {
  Initialize,
  Mint as MintEvent,
  Burn as BurnEvent,
  Swap as SwapEvent,
  Collect as CollectEvent,
} from "../../generated/templates/Pool/Pool";
import {
  getDepositDeltas,
  incrementDepositHelper,
} from "../common/entities/deposit";
import { DexEventHandler } from "../common/dexEventHandler";
import { updateTokenPrices } from "../common/entities/token";
import { getLiquidityPool } from "../common/entities/pool";
import { getOrCreateTick } from "../common/entities/tick";
import { getSwapDeltas } from "../common/entities/swap";
import { getWithdrawDeltas } from "../common/entities/withdraw";
import { BIGINT_ZERO } from "../common/constants";

// Emitted when a given liquidity pool is first created.
export function handleInitialize(event: Initialize): void {
  const pool = getLiquidityPool(event.address)!;
  pool.tick = BigInt.fromI32(event.params.tick);
  pool.save();
}

// Handle mint event emmitted from a pool contract.
export function handleMint(event: MintEvent): void {
  const pool = getLiquidityPool(event.address)!;
  const deltas = getDepositDeltas(
    pool,
    event.params.amount,
    event.params.amount0,
    event.params.amount1,
    BigInt.fromI32(event.params.tickLower),
    BigInt.fromI32(event.params.tickUpper)
  );
  const dexEventHandler = new DexEventHandler(event, pool, false, deltas);
  dexEventHandler.createDeposit(
    event.transaction.from,
    getOrCreateTick(event, pool, BigInt.fromI32(event.params.tickLower)),
    getOrCreateTick(event, pool, BigInt.fromI32(event.params.tickUpper)),
    null
  );
  dexEventHandler.processLPBalanceChanges();
  incrementDepositHelper(dexEventHandler.pool.id);
}

// Handle burn event emmitted from a pool contract.
export function handleBurn(event: BurnEvent): void {
  const pool = getLiquidityPool(event.address)!;
  const deltas = getWithdrawDeltas(
    pool,
    event.params.amount,
    BIGINT_ZERO,
    BIGINT_ZERO,
    BigInt.fromI32(event.params.tickLower),
    BigInt.fromI32(event.params.tickUpper)
  );

  const dexEventHandler = new DexEventHandler(event, pool, false, deltas);
  dexEventHandler.tickLower = getOrCreateTick(
    event,
    pool,
    BigInt.fromI32(event.params.tickLower)
  );
  dexEventHandler.tickUpper = getOrCreateTick(
    event,
    pool,
    BigInt.fromI32(event.params.tickUpper)
  );
  dexEventHandler.processLPBalanceChanges();
}

// Handle a swap event emitted from a pool contract.
export function handleSwap(event: SwapEvent): void {
  updateTokenPrices(event, event.params.sqrtPriceX96);
  const pool = getLiquidityPool(event.address)!;
  const deltas = getSwapDeltas(
    pool,
    event.params.liquidity,
    event.params.amount0,
    event.params.amount1
  );

  const dexEventHandler = new DexEventHandler(event, pool, true, deltas);

  // 0 if amount0 is positive, 1 if amount1 is positive
  const tokenInIdx = event.params.amount0.gt(BIGINT_ZERO) ? 0 : 1;
  const tokenOutIdx = tokenInIdx === 0 ? 1 : 0;
  dexEventHandler.createSwap(
    tokenInIdx,
    tokenOutIdx,
    event.transaction.from,
    BigInt.fromI32(event.params.tick)
  );
  dexEventHandler.processLPBalanceChanges();
}

// Handle a collect event emitted from a pool contract.
// Collects uncollectedTokens
export function handleCollectPool(event: CollectEvent): void {
  const pool = getLiquidityPool(event.address)!;
  const deltas = getWithdrawDeltas(
    pool,
    BIGINT_ZERO,
    event.params.amount0,
    event.params.amount1,
    BigInt.fromI32(event.params.tickLower),
    BigInt.fromI32(event.params.tickUpper)
  );

  const dexEventHandler = new DexEventHandler(event, pool, false, deltas);
  dexEventHandler.createWithdraw(event.transaction.from, null, null, null);
  dexEventHandler.processLPBalanceChanges();
}
