import { BigInt, BigDecimal, Address } from "@graphprotocol/graph-ts";
import {
  DODOLpToken_ADDRESS,
  vDODOToken_ADDRESS,
  ZERO_BI,
  ONE_BI,
  ZERO_BD,
  ADDRESS_ZERO
} from "./utils/constants";

import { CP, Bid, Cancel, Settle } from "../generated/CP/CP";

import {
  DexAmmProtocol,
  LiquidityPool,
  Token,
  RewardToken,
  PoolDailySnapshot,
  LiquidityPoolFee,
  Deposit,
  Withdraw,
  Swap
} from "../generated/schema";

import {
  updateFinancials,
  updateUsageMetrics,
  updatePoolMetrics
} from "./utils/metrics";

export function handleBid(event: Bid): void {
  //updateUsageMetrics(event, event.params.to);
  // updateFinancials(event);
  // updatePoolMetrics(event);
}

export function handleCancel(event: Cancel): void {
  //  updateUsageMetrics(event, event.params.payer);
  // updateFinancials(event);
  // updatePoolMetrics(event);
}

export function handleSettle(event: Settle): void {
  //  updateUsageMetrics(event, event.params.trader);
  // updateFinancials(event);
  // updatePoolMetrics(event);
}
