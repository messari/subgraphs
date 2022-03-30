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
  DODOFlashLoan,
  Transfer,
  Approval,
  Mint,
  Burn
} from "../generated/DVM/DVM";

import { ERC20 } from "../generated/ERC20/ERC20";

import {
  DexAmmProtocol,
  LiquidityPool,
  Token,
  RewardToken,
  PoolDailySnapshot
} from "../generated/schema";

//In the case of a DVM the pools shares are the base token

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
  let pool = LiquidityPool.load(event.address.toHex());
  pool.totalValueLockedUSD = ZERO_BD;
  pool.totalVolumeUSD = ZERO_BD;
  pool.inputTokenBalances = [ZERO_BI];
  pool.outputTokenSupply = ZERO_BI;
  pool.outputTokenPriceUSD = ZERO_BD;
}

export function handleSellShares(event: SellShares): void {}

export function handleDODOSwap(event: DODOSwap): void {}
