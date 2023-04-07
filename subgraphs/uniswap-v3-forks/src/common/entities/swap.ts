import { BigInt } from "@graphprotocol/graph-ts";
import { LiquidityPool } from "../../../generated/schema";
import { BIGINT_ZERO } from "../constants";
import { RawDeltas } from "../dexEventHandler";

export function getSwapDeltas(
  pool: LiquidityPool,
  newActiveLiquidity: BigInt,
  amount0: BigInt,
  amount1: BigInt
): RawDeltas {
  if (amount0.gt(BIGINT_ZERO)) {
    return new RawDeltas(
      [amount0, amount1],
      BIGINT_ZERO,
      newActiveLiquidity.minus(pool.activeLiquidity),
      [BIGINT_ZERO, BIGINT_ZERO],
      [BIGINT_ZERO, BIGINT_ZERO]
    );
  }

  return new RawDeltas(
    [amount0, amount1],
    BIGINT_ZERO,
    newActiveLiquidity.minus(pool.activeLiquidity),
    [BIGINT_ZERO, BIGINT_ZERO],
    [BIGINT_ZERO, BIGINT_ZERO]
  );
}
