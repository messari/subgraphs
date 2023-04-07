import { BigInt } from "@graphprotocol/graph-ts";
import { RawDeltas } from "../dexEventHandler";
import { LiquidityPool } from "../../../generated/schema";
import { BIGINT_NEG_ONE, BIGINT_ZERO } from "../constants";

export function getWithdrawDeltas(
  pool: LiquidityPool,
  amount: BigInt,
  amount0: BigInt,
  amount1: BigInt,
  tickLower: BigInt,
  tickUpper: BigInt
): RawDeltas {
  let activeLiquidityDelta = BIGINT_ZERO;
  // Make sure the liquidity is within the current tick range to update active liquidity.
  if (
    pool.tick !== null &&
    tickLower.le(pool.tick as BigInt) &&
    tickUpper.gt(pool.tick as BigInt)
  ) {
    activeLiquidityDelta = amount.times(BIGINT_NEG_ONE);
  }

  return new RawDeltas(
    [amount0.times(BIGINT_NEG_ONE), amount1.times(BIGINT_NEG_ONE)],
    amount.times(BIGINT_NEG_ONE),
    activeLiquidityDelta,
    [BIGINT_ZERO, BIGINT_ZERO],
    [BIGINT_ZERO, BIGINT_ZERO]
  );
}
