import { LiquidityPool } from "../../generated/schema";
import { PairCreated } from "../../generated/BiswapFactory/BiswapFactory";
import { Mint, Burn, Swap } from "../../generated/BiswapFactory/BiswapPair";
import { BiswapPair } from "../../generated/templates";
import { UsageType } from "../common/constants";
import {
  createDeposit,
  createLiquidityPool,
  createSwapHandleVolumeAndFees,
  createWithdraw,
} from "../common/creators";
import {
  updateFinancials,
  updatePoolMetrics,
  updateUsageMetrics,
} from "../common/updateMetrics";

// Liquidity pool is created from the Factory contract.
// Create a pool entity and start monitoring events from the newly deployed pool contract specified in the subgraph.yaml.
export function handlePairCreated(event: PairCreated): void {
  BiswapPair.create(event.params.pair);

  let liquidityPool = LiquidityPool.load(event.params.pair.toHexString());
  if (!liquidityPool) {
    createLiquidityPool(
      event,
      event.params.pair.toHexString(),
      event.params.token0.toHexString(),
      event.params.token1.toHexString()
    );
  }
}

// Handle a mint event emitted from a pool contract. Considered a deposit into the given liquidity pool.
export function handleMint(event: Mint): void {
  createDeposit(
    event,
    event.params.sender,
    event.params.amount0,
    event.params.amount1
  );
  updateUsageMetrics(event, event.params.sender, UsageType.DEPOSIT);
  updateFinancials(event);
  updatePoolMetrics(event);
}

// Handle a burn event emitted from a pool contract. Considered a withdraw into the given liquidity pool.
export function handleBurn(event: Burn): void {
  createWithdraw(
    event,
    event.params.sender,
    event.params.amount0,
    event.params.amount1
  );
  updateUsageMetrics(event, event.params.sender, UsageType.WITHDRAW);
  updateFinancials(event);
  updatePoolMetrics(event);
}

// Handle a swap event emitted from a pool contract.
export function handleSwap(event: Swap): void {
  createSwapHandleVolumeAndFees(
    event,
    event.params.amount0In,
    event.params.amount0Out,
    event.params.amount1In,
    event.params.amount1Out,
    event.params.to,
    event.params.sender
  );
  updateFinancials(event);
  updatePoolMetrics(event);
  updateUsageMetrics(event, event.transaction.from, UsageType.SWAP);
}
