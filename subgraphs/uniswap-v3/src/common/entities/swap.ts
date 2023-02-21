import { BigInt } from "@graphprotocol/graph-ts";
import { LiquidityPool } from "../../../generated/schema";
import {
  INT_ZERO,
  INT_ONE,
  BIGINT_ZERO,
  PRECISION_DECIMAL,
  PRECISION,
} from "../constants";
import { percToDecBI } from "../utils/utils";
import { getLiquidityPoolFee } from "./pool";
import { RawDeltas } from "../dex_event_handler";

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
