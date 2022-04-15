import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { LiquidityPool, Token } from "../../../generated/schema";
import { getCoins, getLpToken, getOrCreateProtocol, getPoolBalances } from "../../utils/common";
import { getOrCreateFinancials } from "../financials";
import { createPoolDailySnapshot } from "../poolDailySnapshot";
import { createSwap } from "../swap";
import { updateUsageMetrics } from "../updateUsageMetrics";
import { getOrCreatePool } from "./createPool";

export function tokenExchange(
  event: ethereum.Event,
  poolAddress: Address,
  tokenIn: Token,
  amountIn: BigInt,
  tokenOut: Token,
  amountOut: BigInt,
  buyer: Address,
): void {
  let protocol = getOrCreateProtocol();
  let pool = LiquidityPool.load(poolAddress.toHexString());
  if (pool == null) {
    // Get coins
    let coins: Address[] = getCoins(poolAddress);
    // Get lp_token
    let lpToken = getLpToken(poolAddress);
    pool = getOrCreatePool(event, coins, lpToken, poolAddress);
  }

  // update pool entity with new token balances
  let inputBalances: BigInt[] = getPoolBalances(poolAddress);

  // let coinCount = getCoinCount(poolAddress);
  let inputTokenBalances: BigInt[] = [];
  for (let i = 0; i < pool.inputTokens.length; i++) {
    inputTokenBalances.push(inputBalances[i]);
  }
  pool.inputTokenBalances = inputTokenBalances.map<BigInt>(tb => tb);
  pool.save();

  let swap = createSwap(event, pool);
  swap.from = buyer.toHexString();
  swap.to = buyer.toHexString();
  swap.tokenIn = tokenIn.id;
  swap.tokenOut = tokenOut.id;
  swap.amountIn = amountIn;
  swap.amountOut = amountOut;
  // @TODO: Update swap.amountInUSD
  // @TODO: Update swap.amountOutUSD
  swap.save();

  // Take a PoolDailySnapshot
  createPoolDailySnapshot(event.address, event.block.number, event.block.timestamp, pool);

  // Take FinancialsDailySnapshot
  let financials = getOrCreateFinancials(protocol, event.block.timestamp, event.block.number);
  financials.totalValueLockedUSD = pool.totalValueLockedUSD;
  financials.totalVolumeUSD = pool.totalVolumeUSD;
  // @TODO Update FeeUSD
  // @TODO Update supplySideRevenueUSD
  // @TODO Update protocolSideRevenueUSD

  financials.save();

  // Take UsageMetricsDailySnapshot
  updateUsageMetrics(buyer, protocol, event.block.timestamp, event.block.number);
}
