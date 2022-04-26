import { DSP, BuyShares, SellShares, DODOSwap } from "../generated/DSP/DSP";

import { updateUsageMetrics, updatePoolMetrics } from "./utils/metrics";

import { createDeposit, createWithdraw, createSwap } from "./utils/setters";

export function handleBuyShares(event: BuyShares): void {
  createDeposit(
    event,
    event.params.to,
    event.address,
    event.params.increaseShares
  );
  updateUsageMetrics(event, event.params.to, true, false);
}

export function handleSellShares(event: SellShares): void {
  createWithdraw(
    event,
    event.params.to,
    event.address,
    event.params.decreaseShares
  );
  updateUsageMetrics(event, event.params.payer, false, true);
}

export function handleDODOSwap(event: DODOSwap): void {
  createSwap(
    event,
    event.params.trader,
    event.address,
    event.params.fromToken,
    event.params.toToken,
    event.params.fromAmount,
    event.params.toAmount
  );
  updateUsageMetrics(event, event.params.trader, false, false);
  updatePoolMetrics(
    event,
    event.address,
    [event.params.fromToken, event.params.toToken],
    event.params.trader,
    [event.params.fromAmount, event.params.toAmount]
  );
}
