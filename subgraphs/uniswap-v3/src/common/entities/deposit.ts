// Create a deposit from a Mint event from a particular pool contract.
import { Bytes, BigInt } from "@graphprotocol/graph-ts";
import { LiquidityPool, _HelperStore } from "../../../generated/schema";
import { BIGINT_ZERO, INT_ONE } from "../constants";
import { RawDeltas } from "../dex_event_handler";

// Update store that tracks the deposit count per pool
export function incrementDepositHelper(pool: Bytes): void {
  const poolDeposits = _HelperStore.load(pool)!;
  poolDeposits.valueInt = poolDeposits.valueInt + INT_ONE;
  poolDeposits.save();
}

export function getDepositDeltas(
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
    activeLiquidityDelta = amount;
  }

  return new RawDeltas(
    [amount0, amount1],
    amount,
    activeLiquidityDelta,
    [BIGINT_ZERO, BIGINT_ZERO],
    [BIGINT_ZERO, BIGINT_ZERO]
  );
}
