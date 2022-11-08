import { createSwapIn, createSwapOut } from "./helpers";

import { LogAnySwapIn, LogAnySwapOut } from "../../generated/RouterV6/Router";
import {
  updateFinancials,
  updatePoolMetrics,
  updateUsageMetrics,
} from "../common/metrics";

export function handleSwapOut(event: LogAnySwapOut): void {
  // {fromChainID}-{token}
  let poolAddress = event.params.fromChainID
    .toString()
    .concat("-")
    .concat(event.params.token.toHexString());

  createSwapOut(poolAddress, event);

  updatePoolMetrics(poolAddress, event);
  updateUsageMetrics(event);
  updateFinancials(event);
}

export function handleSwapIn(event: LogAnySwapIn): void {
  // {toChainID}-{token}
  let poolAddress = event.params.toChainID
    .toString()
    .concat("-")
    .concat(event.params.token.toHexString());

  createSwapIn(poolAddress, event);

  updatePoolMetrics(poolAddress, event);
  // usage double counting?
  updateUsageMetrics(event);
  updateFinancials(event);
}
