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
  const supplyFee = getLiquidityPoolFee(pool.fees[INT_ZERO]);
  const protocolFee = getLiquidityPoolFee(pool.fees[INT_ONE]);

  if (amount0.gt(BIGINT_ZERO)) {
    const supplyFeeAmount = amount0
      .times(
        percToDecBI(
          BigInt.fromString(
            supplyFee.feePercentage!.times(PRECISION_DECIMAL).toString()
          )
        )
      )
      .div(PRECISION);
    const protocolFeeAmount = amount0
      .times(
        percToDecBI(
          BigInt.fromString(
            protocolFee.feePercentage!.times(PRECISION_DECIMAL).toString()
          )
        )
      )
      .div(PRECISION);
    const tokenInAmount = amount0.minus(
      supplyFeeAmount.plus(protocolFeeAmount)
    );

    return new RawDeltas(
      [tokenInAmount, amount1],
      BIGINT_ZERO,
      newActiveLiquidity.minus(pool.activeLiquidity),
      [supplyFeeAmount, BIGINT_ZERO],
      [protocolFeeAmount, BIGINT_ZERO]
    );
  }

  const supplyFeeAmount = amount1
    .times(
      percToDecBI(
        BigInt.fromString(
          supplyFee.feePercentage!.times(PRECISION_DECIMAL).toString()
        )
      )
    )
    .div(PRECISION);
  const protocolFeeAmount = amount1
    .times(
      percToDecBI(
        BigInt.fromString(
          protocolFee.feePercentage!.times(PRECISION_DECIMAL).toString()
        )
      )
    )
    .div(PRECISION);
  const tokenInAmount = amount1.minus(supplyFeeAmount.plus(protocolFeeAmount));

  return new RawDeltas(
    [amount0, tokenInAmount],
    BIGINT_ZERO,
    newActiveLiquidity.minus(pool.activeLiquidity),
    [BIGINT_ZERO, supplyFeeAmount],
    [BIGINT_ZERO, protocolFeeAmount]
  );
}
