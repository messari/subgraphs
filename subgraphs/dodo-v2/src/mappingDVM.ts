import { BigInt, BigDecimal, Address } from "@graphprotocol/graph-ts";
import {
  DODOLpToken_ADDRESS,
  vDODOToken_ADDRESS,
  ZERO_BI,
  ONE_BI,
  ZERO_BD,
  ADDRESS_ZERO
} from "./utils/constants";

import { DVM, BuyShares, SellShares, DODOSwap } from "../generated/DVM/DVM";

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

// event BuyShares(address to, uint256 increaseShares, uint256 totalShares);
//
// event SellShares(address payer, address to, uint256 decreaseShares, uint256 totalShares);
// event DODOSwap(
//     address fromToken,
//     address toToken,
//     uint256 fromAmount,
//     uint256 toAmount,
//     address trader,
//     address receiver
// );

export function handleBuyShares(event: BuyShares): void {
  updateUsageMetrics(event, event.params.to);
  updateFinancials(event);
  // updatePoolMetrics(event);
}

export function handleSellShares(event: SellShares): void {
  updateUsageMetrics(event, event.params.payer);
  updateFinancials(event);
  // updatePoolMetrics(event);
}

export function handleDODOSwap(event: DODOSwap): void {
  updateUsageMetrics(event, event.params.trader);
  updateFinancials(event);
  updatePoolMetrics(
    event,
    event.address,
    [event.params.fromToken, event.params.toToken],
    event.params.trader,
    [event.params.fromAmount, event.params.toAmount]
  );
}
