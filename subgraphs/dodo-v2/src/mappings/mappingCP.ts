import { CP, Bid, Cancel, Settle } from "../../generated/CP/CP";

import {
  updateUsageMetrics
} from "../utils/metrics";

import { createDeposit, createWithdraw } from "../utils/setters";
// import { updateCPpoolMetrics } from "../utils/metrics";


// event Bid(address to, uint256 amount, uint256 fee);

export function handleBid(event: Bid): void {
  updateUsageMetrics(event, event.params.to, true, false);
  createDeposit(event, event.params.to, event.address, event.params.amount);
}

export function handleCancel(event: Cancel): void {
  updateUsageMetrics(event, event.params.to, false, true);
  createWithdraw(event, event.params.to, event.address, event.params.amount);
}

export function handleSettle(event: Settle): void {
  // updateCPpoolMetrics(event, event.address);
}
