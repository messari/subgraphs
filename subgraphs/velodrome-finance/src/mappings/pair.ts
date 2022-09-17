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
import { _PoolPricingHelper } from "../../generated/schema";
import { updatePoolPriceFromSwap } from "./helpers/pricing";
import {
  updateAllPoolFees,
  updatePoolValue,
  updatePoolVolume,
  updateTokenBalances,
} from "./helpers/pools";

export function handleMint(event: Mint): void {
  createDeposit(event);
  updatePoolValue(event.address, event.block); // TVL, output token price
  updateUsageMetrics(event, event.params.sender, UsageType.DEPOSIT);
  updateFinancials(event);
  updatePoolMetrics(event.address, event.block); // Syncs daily/hourly metrics with pool
}

export function handleBurn(event: Burn): void {
  createWithdraw(event);
  updatePoolValue(event.address, event.block); // TVL, output token price
  updateUsageMetrics(event, event.transaction.from, UsageType.WITHDRAW);
  updateFinancials(event);
  updatePoolMetrics(event.address, event.block); // Syncs daily/hourly metrics with pool
}

export function handleSwap(event: Swap): void {
  createSwap(event);
  updatePoolPriceFromSwap(event);
  updatePoolValue(event.address, event.block); // TVL, output token price
  updatePoolVolume(
    event.address,
    event.params.amount0In.plus(event.params.amount0Out),
    event.params.amount1In.plus(event.params.amount1Out),
    event
  );
  updateUsageMetrics(event, event.params.sender, UsageType.SWAP);
  updateFinancials(event);
  updateAllPoolFees(event.block, false)
  updatePoolMetrics(event.address, event.block); // Syncs daily/hourly metrics with pool
}

export function handleFees(event: Fees): void {
  updateRevenue(event);
}

// Sync emitted whenever reserves are updated
export function handleSync(event: Sync): void {
  updateTokenBalances(
    event.address,
    event.params.reserve0,
    event.params.reserve1
  );
}

// Handle transfers event.
// The transfers are either occur as a part of the Mint or Burn event process.
// The tokens being transferred in these events are the LP tokens from the liquidity pool that emitted this event.
export function handleTransfer(event: Transfer): void {
  let pool = getLiquidityPool(event.address);

  // ignore initial transfers for first adds
  if (
    event.params.to.toHexString() == ZERO_ADDRESS &&
    event.params.amount.equals(BIGINT_THOUSAND) &&
    pool.outputTokenSupply == BIGINT_ZERO
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
