import { Address, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { Token } from "../../../generated/schema";
import { getOrCreateProtocol } from "../../utils/common";
import { updateFinancials } from "../financials";
import { createPoolDailySnapshot } from "../poolDailySnapshot";
import { createSwap } from "../swap";
import { updateUsageMetrics } from "../usageMetric";
import { getOrCreatePoolFromTemplate } from "./createPool";
import { getPoolBalances } from "./getPoolBalances";
import { updatePool } from "./updatePool";

export function tokenExchange(
    event: ethereum.Event,
    address: Address,
    tokenIn: Token,
    amountIn: BigDecimal,
    tokenOut: Token,
    amountOut: BigDecimal,
    buyer: Address
  ): void {
    // create pool
    let pool = getOrCreatePoolFromTemplate(event, address);
    let protocol = getOrCreateProtocol();
  
    // update pool entity with new token balances
    let newPoolBalances = getPoolBalances(pool);
    updatePool(event, pool, newPoolBalances, pool.outputTokenSupply);
  
    createSwap(
      event,
      pool,
      protocol,
      tokenIn,
      amountIn,
      // amountInUSD: BigDecimal,
      tokenOut,
      amountOut,
      // amountOutUSD: BigDecimal,
      buyer
    );
  
    // Take a PoolDailySnapshot
    createPoolDailySnapshot(event, pool);
  
    // Take FinancialsDailySnapshot
    updateFinancials(event, pool, protocol);
  
    // Take UsageMetricsDailySnapshot
    updateUsageMetrics(event, buyer, protocol);
  }