import { BigInt, BigDecimal, Address } from "@graphprotocol/graph-ts";
import {
  DODOLpToken_ADDRESS,
  vDODOToken_ADDRESS,
  ZERO_BI,
  ONE_BI,
  ZERO_BD,
  ADDRESS_ZERO
} from "./utils/constants";

import {
  DVM,
  BuyShares,
  SellShares,
  DODOSwap,
  DODOFlashLoan
} from "../generated/DVM/DVM";

import { ERC20 } from "../generated/ERC20/ERC20";

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
  getOrCreateToken,
  getOrCreateRewardToken,
  getOrCreateDexAmm,
  getOrCreateUsageMetricSnapshot,
  getOrCreateFinancials,
  getOrCreatePoolDailySnapshot
} from "./utils/getters";

import {
  updateFinancials,
  updateUsageMetrics,
  updatePoolMetrics
} from "./utils/metrics";

//In the case of a DVM the pools shares are the lp token ?

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
  updatePoolMetrics(event);
}

export function handleSellShares(event: SellShares): void {
  updateUsageMetrics(event, event.params.payer);
  updateFinancials(event);
  updatePoolMetrics(event);
}

export function handleDODOSwap(event: DODOSwap): void {
  updateUsageMetrics(event, event.params.trader);
  updateFinancials(event);
  updatePoolMetrics(event);
}
