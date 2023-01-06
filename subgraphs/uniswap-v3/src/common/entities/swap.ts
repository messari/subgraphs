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

class SwapHelperObj {
  activeLiquidityDelta: BigInt;
  balanceChangesNet: BigInt[];
  supplyUncollectedTokenChangesNet: BigInt[];
  protocolUncollectedTokenChangesNet: BigInt[];
  tokenInIdx: i32;
  tokenOutIdx: i32;

  constructor(
    activeLiquidityDelta: BigInt,
    balanceChangesNet: BigInt[],
    supplyUncollectedTokenChangesNet: BigInt[],
    protocolUncollectedTokenChangesNet: BigInt[],
    tokenInIdx: i32,
    tokenOutIdx: i32
  ) {
    this.activeLiquidityDelta = activeLiquidityDelta;
    this.balanceChangesNet = balanceChangesNet;
    this.supplyUncollectedTokenChangesNet = supplyUncollectedTokenChangesNet;
    this.protocolUncollectedTokenChangesNet =
      protocolUncollectedTokenChangesNet;
    this.tokenInIdx = tokenInIdx;
    this.tokenOutIdx = tokenOutIdx;
  }
}

export function getSwapHelperObj(
  pool: LiquidityPool,
  newActiveLiquidity: BigInt,
  amount0: BigInt,
  amount1: BigInt
): SwapHelperObj {
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

    return new SwapHelperObj(
      newActiveLiquidity.minus(pool.activeLiquidity),
      [tokenInAmount, amount1],
      [supplyFeeAmount, BIGINT_ZERO],
      [protocolFeeAmount, BIGINT_ZERO],
      0,
      1
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

  return new SwapHelperObj(
    newActiveLiquidity.minus(pool.activeLiquidity),
    [amount0, tokenInAmount],
    [BIGINT_ZERO, supplyFeeAmount],
    [BIGINT_ZERO, protocolFeeAmount],
    1,
    0
  );
}
