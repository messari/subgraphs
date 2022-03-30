import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../../generated/Factory/ERC20";
import { Coin } from "../../../generated/schema";
import { StableSwapLending2 as Pool } from "../../../generated/templates";
import { getOrCreateProtocol } from "../../utils/common";
import { BIGDECIMAL_ZERO, DEFAULT_DECIMALS, toDecimal } from "../../utils/constant";
import { updateFinancials } from "../financials";
import { createPoolDailySnapshot } from "../poolDailySnapshot";
import { updateUsageMetrics } from "../usageMetric";
import { createWithdraw } from "../withdraw";
import { getOrCreatePoolFromTemplate } from "./createPool";
import { getPoolBalances } from "./getPoolBalances";
import { updatePool } from "./updatePool";

export function removeLiquidity(
    event: ethereum.Event,
    address: Address,
    token_supply: BigInt,
    token_amounts: BigInt[],
    provider: Address,
    fees: BigInt[]
  ): void {
    // create pool
    let protocol = getOrCreateProtocol();
    let pool = getOrCreatePoolFromTemplate(event, address);
  
    // create LPToken entity from template when pool is createed
    if (pool.outputTokenSupply == BIGDECIMAL_ZERO) {
        Pool.create(Address.fromBytes(pool._lpTokenAddress));
    }
  
    // Update pool entity balances and totalSupply of LP tokens
    let oldTotalSupply = pool.outputTokenSupply;
    let newPoolBalances = getPoolBalances(pool);
  
    // If token supply in event is 0, then check directly from contract
    let currentTokenSupply = toDecimal(token_supply, DEFAULT_DECIMALS);
    if (currentTokenSupply == BIGDECIMAL_ZERO) {
      let contract = ERC20.bind(Address.fromBytes(pool._lpTokenAddress));
      let supply = contract.try_totalSupply();
      if (!supply.reverted) {
        currentTokenSupply = toDecimal(token_supply, DEFAULT_DECIMALS);
      }
    }
  
    let inputTokenBalances: BigInt[] = [];
  
    let lpTokenAmount = oldTotalSupply.minus(currentTokenSupply);
    for (let i = 0; i < pool._coinCount.toI32(); ++i) {
      let coin = Coin.load(pool.id.concat("-").concat(i.toString()));
      if (coin !== null) {
        if (
          pool._coinCount.toI32() == token_amounts.length &&
          pool._coinCount.toI32() == fees.length
        ) {
          coin.balance = coin.balance.minus(token_amounts[i]);
          coin.feeBalance = coin.feeBalance.plus(fees[i]);
          // @TODO: change this!!!!
          // coin.feeBalanceUSD = toDecimal(coin.feeBalance, DEFAULT_DECIMALS);
          coin.save();
          inputTokenBalances.push(coin.balance);
        }
      }
    }
    pool.inputTokenBalances = inputTokenBalances.map<BigInt>((tb) => tb);
    pool = updatePool(event, pool, newPoolBalances, currentTokenSupply);
  
    // Update Withdraw
    createWithdraw(event, pool, protocol, lpTokenAmount, token_amounts, provider);
  
    // Take a PoolDailySnapshot
    createPoolDailySnapshot(event, pool);
  
    // Take FinancialsDailySnapshot
    updateFinancials(event, pool, protocol);
  
    // Take UsageMetricsDailySnapshot
    updateUsageMetrics(event, provider, protocol);
  }
  