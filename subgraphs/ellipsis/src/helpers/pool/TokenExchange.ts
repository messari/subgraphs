import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Factory } from "../../../generated/Factory/Factory";
import { Token } from "../../../generated/schema";
import { getCoinCount, getCoins, getOrCreateProtocol } from "../../utils/common";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, FACTORY_ADDRESS, ZERO_ADDRESS } from "../../utils/constant";
import { getOrCreateFinancials } from "../financials";
import { createPoolDailySnapshot } from "../poolDailySnapshot";
import { createSwap } from "../swap";
import { updateUsageMetrics } from "../updateUsageMetrics";
import { getOrCreatePoolFromFactory } from "./createPool";

export function tokenExchange(
    event: ethereum.Event,
    poolAddress: Address,
    tokenIn: Token,
    amountIn: BigInt,
    tokenOut: Token,
    amountOut: BigInt,
    buyer: Address
  ): void {
    let protocol = getOrCreateProtocol();
    // create pool
    let factory = Factory.bind(Address.fromString(FACTORY_ADDRESS))
    // Get coins
    let coins: Address[] = getCoins(poolAddress)
    // Get lp_token
    let getLpToken = factory.try_get_lp_token(poolAddress)
    let lpToken: Address = getLpToken.reverted ? Address.fromString(ZERO_ADDRESS) : getLpToken.value
    let pool = getOrCreatePoolFromFactory(event, coins, BIGINT_ZERO, lpToken, poolAddress)
  
    // update pool entity with new token balances
    let getInputTokenBalances = factory.try_get_balances(poolAddress)
    let inputBalances: BigInt[] = getInputTokenBalances.reverted ? [] : getInputTokenBalances.value
    let coinCount = getCoinCount(poolAddress)
    for(let i = 0; i < coinCount.toI32(); ++i) {
        pool.inputTokenBalances[i] = inputBalances[i]
    }
    pool.save()
  
    createSwap(
      event,
      pool,
      protocol,
      tokenIn,
      amountIn,
      BIGDECIMAL_ZERO,
      tokenOut,
      amountOut,
      BIGDECIMAL_ZERO,
      buyer
    );
  
    // Take a PoolDailySnapshot
    createPoolDailySnapshot(event, pool);
  
    // Take FinancialsDailySnapshot
    getOrCreateFinancials(event, protocol);
  
    // Take UsageMetricsDailySnapshot
    updateUsageMetrics(event, buyer, protocol);
  }