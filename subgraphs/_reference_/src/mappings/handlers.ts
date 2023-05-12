import { Mint, Burn, Swap } from "../../generated/templates/Pair/Pair";
import { PairCreated } from "../../generated/templates/Pair/Factory";
import {
  createDeposit,
  createWithdraw,
  createSwapHandleVolumeAndFees,
  createLiquidityPool,
} from "./helpers";
import {
  updateFinancials,
  updateUsageMetrics,
  updatePoolMetrics,
} from "../common/metrics";
import { getRewardsPerDay, RewardIntervalType } from "../common/rewards";
import { BIGDECIMAL_ONE, UsageType } from "../common/constants";

// To improve readability and consistency, it is recommended that you put all
// handlers in this file, and create helper functions to handle specific events

export function handleNewPair(event: PairCreated): void {
  createLiquidityPool(
    event,
    event.params.pair,
    event.params.token0,
    event.params.token1
  );
}

export function handleMint(event: Mint): void {
  createDeposit(
    event,
    event.params.amount0,
    event.params.amount1,
    event.params.sender
  );
  updateUsageMetrics(event, event.params.sender, UsageType.DEPOSIT);
  updateFinancials(event);
  updatePoolMetrics(event);
}

export function handleBurn(event: Burn): void {
  createWithdraw(
    event,
    event.params.amount0,
    event.params.amount1,
    event.params.sender,
    event.params.to
  );
  updateUsageMetrics(event, event.transaction.from, UsageType.WITHDRAW);
  updateFinancials(event);
  updatePoolMetrics(event);

  // INT_ONE and BLOCK for reward amount and interval type are arbitrary since uniswap does not have reward emissions
  getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    BIGDECIMAL_ONE,
    RewardIntervalType.BLOCK
  );
}

export function handleSwap(event: Swap): void {
  createSwapHandleVolumeAndFees(
    event,
    event.params.to,
    event.params.sender,
    event.params.amount0In,
    event.params.amount1In,
    event.params.amount0Out,
    event.params.amount1Out
  );
  updateFinancials(event);
  updatePoolMetrics(event);
  updateUsageMetrics(event, event.params.sender, UsageType.SWAP);
}
