import {
  Mint,
  Burn,
  Swap,
  Fees,
  Transfer,
  Sync,
} from "../../generated/templates/Pair/Pair";
import { createDeposit, createWithdraw, createSwap } from "./helpers/entities";
import {
  updateFinancials,
  updateUsageMetrics,
  updatePoolMetrics,
  updateRevenue,
} from "../common/metrics";
// import { getRewardsPerDay, RewardIntervalType } from "../common/rewards";
import {
  BIGINT_THOUSAND,
  BIGINT_ZERO,
  UsageType,
  ZERO_ADDRESS,
} from "../common/constants";
import { getLiquidityPool } from "../common/getters";
import {
  handleTransferBurn,
  handleTransferMint,
  handleTransferToPoolBurn,
} from "../common/handlers";
import { updatePoolPriceFromSwap } from "./helpers/pricing";
import {
  updateAllPoolFees,
  updatePoolValue,
  updatePoolVolume,
  updateTokenBalances,
} from "./helpers/pools";

export function handleMint(event: Mint): void {
  const pool = getLiquidityPool(event.address);
  if (!pool) return;

  createDeposit(pool, event);
  updatePoolValue(event.address, pool, event.block); // TVL, output token price
  updateUsageMetrics(event, event.params.sender, UsageType.DEPOSIT);
  updateFinancials(event);
  updatePoolMetrics(event.address, pool, event.block); // Syncs daily/hourly metrics with pool
}

export function handleBurn(event: Burn): void {
  const pool = getLiquidityPool(event.address);
  if (!pool) return;

  createWithdraw(pool, event);
  updatePoolValue(event.address, pool, event.block); // TVL, output token price
  updateUsageMetrics(event, event.transaction.from, UsageType.WITHDRAW);
  updateFinancials(event);
  updatePoolMetrics(event.address, pool, event.block); // Syncs daily/hourly metrics with pool
}

export function handleSwap(event: Swap): void {
  const pool = getLiquidityPool(event.address);
  if (!pool) return;

  createSwap(pool, event);
  updatePoolPriceFromSwap(pool, event);
  updatePoolValue(event.address, pool, event.block); // TVL, output token price
  updatePoolVolume(
    pool,
    event.params.amount0In.plus(event.params.amount0Out),
    event.params.amount1In.plus(event.params.amount1Out),
    event
  );
  updateUsageMetrics(event, event.params.sender, UsageType.SWAP);
  updateFinancials(event);
  updateAllPoolFees(event.block, false);
  updatePoolMetrics(event.address, pool, event.block); // Syncs daily/hourly metrics with pool
}

export function handleFees(event: Fees): void {
  const pool = getLiquidityPool(event.address);
  if (!pool) return;

  updateRevenue(pool, event);
}

// Sync emitted whenever reserves are updated
export function handleSync(event: Sync): void {
  const pool = getLiquidityPool(event.address);
  if (!pool) return;

  updateTokenBalances(pool, event.params.reserve0, event.params.reserve1);
}

// Handle transfers event.
// The transfers are either occur as a part of the Mint or Burn event process.
// The tokens being transferred in these events are the LP tokens from the liquidity pool that emitted this event.
export function handleTransfer(event: Transfer): void {
  const pool = getLiquidityPool(event.address);
  if (!pool) return;

  // ignore initial transfers for first adds
  if (
    event.params.to.toHexString() == ZERO_ADDRESS &&
    event.params.amount.equals(BIGINT_THOUSAND) &&
    pool.outputTokenSupply! == BIGINT_ZERO
  ) {
    return;
  }
  // mints
  if (event.params.from.toHexString() == ZERO_ADDRESS) {
    handleTransferMint(
      event,
      pool,
      event.params.amount,
      event.params.to.toHexString()
    );
  }
  // Case where direct send first on native token withdrawls.
  // For burns, mint tokens are first transferred to the pool before transferred for burn.
  // This gets the EOA that made the burn loaded into the _Transfer.

  if (event.params.to == event.address) {
    handleTransferToPoolBurn(event, event.params.from.toHexString());
  }
  // burn
  if (
    event.params.to.toHexString() == ZERO_ADDRESS &&
    event.params.from == event.address
  ) {
    handleTransferBurn(
      event,
      pool,
      event.params.amount,
      event.params.from.toHexString()
    );
  }
}
