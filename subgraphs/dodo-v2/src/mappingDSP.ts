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

import { createDeposit, createWithdraw, createSwap } from "./utils/getters";

// event BuyShares(address to, uint256 increaseShares, uint256 totalShares);

export function handleBuyShares(event: BuyShares): void {
  createDeposit(
    event,
    event.params.to,
    event.address,
    event.params.increaseShares
  );
  updateUsageMetrics(event, event.params.to);
  updateFinancials(event);
}

// event SellShares(address payer, address to, uint256 decreaseShares, uint256 totalShares);
export function handleSellShares(event: SellShares): void {
  createWithdraw(
    event,
    event.params.to,
    event.address,
    event.params.decreaseShares
  );
  updateUsageMetrics(event, event.params.payer);
  updateFinancials(event);
  // updatePoolMetrics(event);
}

//
// event DODOSwap(
//     address fromToken,
//     address toToken,
//     uint256 fromAmount,
//     uint256 toAmount,
//     address trader,
//     address receiver
// );

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
