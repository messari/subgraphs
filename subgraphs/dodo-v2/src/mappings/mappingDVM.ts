import { BuyShares, SellShares, DODOSwap } from "../../generated/DVM/DVM";

import { updateUsageMetrics, updatePoolMetrics } from "../utils/metrics";

import { createDeposit, createWithdraw, createSwap } from "../utils/setters";

export function handleBuyShares(event: BuyShares): void {
  updateUsageMetrics(event, event.params.to, true, false);
  createDeposit(
    event,
    event.params.to,
    event.address,
    event.params.increaseShares
  );
}

export function handleSellShares(event: SellShares): void {
  updateUsageMetrics(event, event.params.payer, false, true);
  createWithdraw(
    event,
    event.params.to,
    event.address,
    event.params.decreaseShares
  );
}

export function handleDODOSwapDVM(event: DODOSwap): void {
  updateUsageMetrics(event, event.params.trader, false, false);
  createSwap(
    event,
    event.params.trader,
    event.address,
    event.params.fromToken,
    event.params.toToken,
    event.params.fromAmount,
    event.params.toAmount
  );
  updatePoolMetrics(
    event,
    event.address,
    [event.params.fromToken, event.params.toToken],
    event.params.trader,
    [event.params.fromAmount, event.params.toAmount]
  );
}
