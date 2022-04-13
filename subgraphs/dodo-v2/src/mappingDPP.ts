import { BigInt, BigDecimal, Address } from "@graphprotocol/graph-ts";
import {
  DODOLpToken_ADDRESS,
  vDODOToken_ADDRESS,
  ZERO_BI,
  ONE_BI,
  ZERO_BD,
  ADDRESS_ZERO
} from "./utils/constants";

import { DPP, DODOSwap, LpFeeRateChange } from "../generated/DPP/DPP";

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

export function handleDODOSwap(event: DODOSwap): void {
  updateUsageMetrics(event, event.params.trader);
  updateFinancials(event);
  updatePoolMetrics(
    event,
    event.address,
    [event.params.fromToken, event.params.toToken],
    event.params.trader,
    [event.params.fromAmount, event.params.toAmount],
    BigInt.fromI32(0)
  );
}

export function handleLpFeeRateChange(event: LpFeeRateChange): void {
  //  updateUsageMetrics(event, event.params.payer);
  // updateFinancials(event);
  // updatePoolMetrics(event);
}
