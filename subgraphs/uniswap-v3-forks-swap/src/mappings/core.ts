import { BigInt } from "@graphprotocol/graph-ts";

import { DexEventHandler, RawDeltas } from "../common/dexEventHandler";
import { getLiquidityPool } from "../common/entities/pool";
import { BIGINT_ZERO } from "../common/constants";

import {
  Initialize,
  Swap as SwapEvent,
} from "../../generated/templates/Pool/Pool";

// Handle mint event emmitted from a pool contract.
export function handleInitialize(event: Initialize): void {
  const pool = getLiquidityPool(event.address)!;
  pool.tick = BigInt.fromI32(event.params.tick);
  pool.save();
}

// Handle a swap event emitted from a pool contract.
export function handleSwap(event: SwapEvent): void {
  const pool = getLiquidityPool(event.address)!;

  const deltas = new RawDeltas([event.params.amount0, event.params.amount1]);
  const dexEventHandler = new DexEventHandler(event, pool, deltas);

  // 0 if amount0 is positive, 1 if amount1 is positive
  const tokenInIdx = event.params.amount0.gt(BIGINT_ZERO) ? 0 : 1;
  const tokenOutIdx = tokenInIdx === 0 ? 1 : 0;
  dexEventHandler.createSwap(
    tokenInIdx,
    tokenOutIdx,
    event.transaction.from,
    BigInt.fromI32(event.params.tick)
  );
  dexEventHandler.updateAndSaveLiquidityPoolEntity();
  dexEventHandler.updateAndSaveAccountEntity();
}
