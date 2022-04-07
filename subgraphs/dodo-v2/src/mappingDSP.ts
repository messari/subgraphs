import { BigInt, BigDecimal, Address } from "@graphprotocol/graph-ts";
import {
  DODOLpToken_ADDRESS,
  vDODOToken_ADDRESS,
  ZERO_BI,
  ONE_BI,
  ZERO_BD,
  ADDRESS_ZERO
} from "./utils/constants";

import { DSP, BuyShares, SellShares, DODOSwap } from "../generated/DSP/DSP";

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

export function handleBuyShares(event: BuyShares): void {
  // updateUsageMetrics(event, event.params.to);
  // updateFinancials(event);
  // updatePoolMetrics(event);
}

export function handleSellShares(event: SellShares): void {
  // updateUsageMetrics(event, event.params.payer);
  // updateFinancials(event);
  // updatePoolMetrics(event);
}

export function handleDODOSwap(event: DODOSwap): void {
  // updateUsageMetrics(event, event.params.trader);
  // updateFinancials(event);
  // updatePoolMetrics(event);
}
