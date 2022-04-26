import { CP, Bid, Cancel, Settle } from "../generated/CP/CP";

import {
  updateFinancials,
  updateUsageMetrics,
  updatePoolMetrics
} from "./utils/metrics";

import { createDeposit, createWithdraw } from "./utils/setters";

export function handleBid(event: Bid): void {
  createDeposit(event, event.params.to, event.address, event.params.amount);
  updateUsageMetrics(event, event.params.to, true, false);
}

export function handleCancel(event: Cancel): void {
  createWithdraw(event, event.params.to, event.address, event.params.amount);
  updateUsageMetrics(event, event.params.to, false, true);
}

export function handleSettle(event: Settle): void {
  //the settle event doesnt supply any params however
  //the settle function call in CPFunding creates a DVM and handles its
  // logic by transfering all tokens and logic over to the created DVM
  // This means we shouldnt need to actually track anything with this event as
  // it will already be tracked through DVM graph logic
}
