import { Address, BigInt } from "@graphprotocol/graph-ts";
import { StableSwap3EPS } from "../../generated/3EPS/StableSwap3EPS";
import { ERC20 } from "../../generated/3EPS/ERC20";
import {
  AddLiquidity,
  RemoveLiquidity,
  RemoveLiquidityImbalance,
  RemoveLiquidityOne,
  TokenExchange
} from "../../generated/Factory/StableSwap";
import { LiquidityPool, Token } from "../../generated/schema";
import { getOrCreateFinancials } from "../helpers/financials";
import { addLiquidity } from "../helpers/pool/AddLiquidity";
import { getOrCreatePool } from "../helpers/pool/createPool";
import { removeLiquidity } from "../helpers/pool/RemoveLiquidity";
import { tokenExchange } from "../helpers/pool/TokenExchange";
import { createPoolDailySnapshot } from "../helpers/poolDailySnapshot";
import { updateUsageMetrics } from "../helpers/updateUsageMetrics";
import { getOrCreateWithdraw } from "../helpers/withdraw";
import { getCoins, getLpToken, getOrCreateProtocol, getPoolBalances } from "../utils/common";
import { BIGINT_ZERO, INT_ZERO } from "../utils/constant";

export function handleAddLiquidity(event: AddLiquidity): void {
  let fees = event.params.fees;
  let provider = event.params.provider;
  let token_amounts = event.params.token_amounts;
  let token_supply = event.params.token_supply;

  addLiquidity(event, event.address, token_supply, token_amounts, provider, fees);
}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  let fees = event.params.fees;
  let provider = event.params.provider;
  let token_amounts = event.params.token_amounts;
  let token_supply = event.params.token_supply;

  removeLiquidity(event, event.address, token_supply, token_amounts, provider, fees);
}

export function handleRemoveLiquidityImbalance(event: RemoveLiquidityImbalance): void {
  let fees = event.params.fees;
  let provider = event.params.provider;
  let token_amounts = event.params.token_amounts;
  let token_supply = event.params.token_supply;

  removeLiquidity(event, event.address, token_supply, token_amounts, provider, fees);
}

export function handleRemoveLiquidityOne(event: RemoveLiquidityOne): void {
  let provider = event.params.provider;
  let token_supply = event.params.token_supply;
  let poolAddress = event.address;
  let protocol = getOrCreateProtocol();
  // Check if pool exist
  let pool = LiquidityPool.load(event.address.toHexString());
  if (pool == null) {
    let lpToken: Address = getLpToken(poolAddress);
    let coins: Address[] = getCoins(poolAddress);
    pool = getOrCreatePool(event, coins, lpToken, poolAddress);
  }
  // Get and update the current pool input balances
  let oldInputTokenBalances = pool.inputTokenBalances;
  let inputTokenBalances: BigInt[] = [];
  let inputBalances: BigInt[] = getPoolBalances(poolAddress);
  for (let i = INT_ZERO; i < pool.inputTokens.length; i++) {
    inputTokenBalances.push(inputBalances[i]);
  }
  pool.inputTokenBalances = inputTokenBalances.map<BigInt>(tb => tb);

  // Get and update the current output token supply
  let oldOutputTokenSupply = pool.outputTokenSupply;
  if (token_supply == BIGINT_ZERO) {
    let tokenContract = ERC20.bind(event.address);
    let getSupply = tokenContract.try_totalSupply();
    let supply = getSupply.reverted ? BIGINT_ZERO : getSupply.value;
    pool.outputTokenSupply = supply;
  }

  let outputTokenAmount = oldOutputTokenSupply.minus(pool.outputTokenSupply);
  pool.save();

  // Update Withdraw
  let withdraw = getOrCreateWithdraw(event, pool);
  withdraw.from = event.address.toHexString();
  withdraw.to = provider.toHexString();
  withdraw.outputTokenAmount = outputTokenAmount;
  let inputTokenAmounts: BigInt[] = [];
  for (let i = INT_ZERO; i < pool.inputTokens.length; i++) {
    inputTokenAmounts.push(oldInputTokenBalances[i].minus(pool.inputTokenBalances[i]));
  }
  withdraw.inputTokenAmounts = inputTokenBalances.map<BigInt>(tb => tb);
  // @TODO: Update withdraw.amountUSD
  withdraw.save();

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
  updateUsageMetrics(provider, protocol, event.block.timestamp, event.block.number);
}

export function handleTokenExchange(event: TokenExchange): void {
  let soldId = event.params.sold_id;
  let boughtId = event.params.bought_id;
  let pool = LiquidityPool.load(event.address.toHexString());
  if (pool != null) {
    let coins = getCoins(event.address);
    let tokenSold = Token.load(coins[soldId.toI32()].toHexString())!;
    let amountSold = event.params.tokens_sold;
    let tokenBought = Token.load(coins[boughtId.toI32()].toHexString())!;
    let amountBought = event.params.tokens_bought;
    let buyer = event.params.buyer;

    tokenExchange(event, event.address, tokenSold, amountSold, tokenBought, amountBought, buyer);
  }
}

