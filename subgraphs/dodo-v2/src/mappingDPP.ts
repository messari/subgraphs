import { DPP, DODOSwap } from "../generated/DPP/DPP";

import { updateUsageMetrics, updatePoolMetrics } from "./utils/metrics";

import { createSwap } from "./utils/setters";

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
