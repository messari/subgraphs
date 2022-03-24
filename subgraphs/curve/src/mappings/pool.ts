import {
  AddLiquidity,
  RemoveLiquidity,
  RemoveLiquidityImbalance,
  RemoveLiquidityOne,
  TokenExchange,
  TokenExchangeUnderlying,
} from "../../generated/Factory/StableSwap";

import { Coin, LiquidityPool } from "../../generated/schema";

import {
  addToPoolBalances,
  getCurrentTokenSupply,
  getOrCreateProtocol,
  getOutTokenPriceUSD,
  getTVLUSD,
  minusFromPoolBalances,
} from "../utils/common";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, ZERO_ADDRESS } from "../utils/constant";
import { updatePool } from "../helpers/pool";
import { createDeposit } from "../helpers/deposit";
import { handleExchange } from "../helpers/exchange";
import { updateFinancials } from "../helpers/financials";
import { createWithdraw } from "../helpers/withdraw";
import { updateUsageMetrics } from "../helpers/usageMetric";
import { createPoolDailySnapshot } from "../helpers/poolDailySnapshot";

export function handleAddLiquidity(event: AddLiquidity): void {
  let fees = event.params.fees;
  let invariant = event.params.invariant;
  let provider = event.params.provider;
  let token_amount = event.params.token_amounts;
  let token_supply = event.params.token_supply;

  let protocol = getOrCreateProtocol();

  // Check if pool exist
  let pool = LiquidityPool.load(event.address.toHexString());

  if (pool != null && pool.id != ZERO_ADDRESS) {

    // Update pool entity balances and totalSupply of LP tokens
    let oldTotalSupply = pool.outputTokenSupply;

    // Get new pool coins balance
    let newPoolBalances = addToPoolBalances(pool, token_amount, fees);

    // Current Token Supply
    let currentTokenSupply = getCurrentTokenSupply(pool, token_supply);

    // Update totalValueLockedUSD
    let totalValueLockedUSD = getTVLUSD(pool);

    // Update totalVolumeUSD
    let totalVolumeUSD = BIGDECIMAL_ZERO;

    // Get output token price per unit
    let outTokenPriceUSD = getOutTokenPriceUSD(pool);

    // Update pool
    pool = updatePool(
      event,
      pool,
      newPoolBalances,
      currentTokenSupply,
      outTokenPriceUSD,
      totalVolumeUSD,
      totalValueLockedUSD
    );

    // Update Deposit
    createDeposit(
      event,
      pool,
      protocol,
      currentTokenSupply.minus(oldTotalSupply),
      token_amount,
      provider
    );

    // Take a PoolDailySnapshot
    createPoolDailySnapshot(event, pool);

    // Take FinancialsDailySnapshot
    updateFinancials(event, pool, protocol);

    // Take UsageMetricsDailySnapshot
    updateUsageMetrics(event, provider, protocol);
  }
}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  let fees = event.params.fees;
  let provider = event.params.provider;
  let token_amount = event.params.token_amounts;
  let token_supply = event.params.token_supply;

  let protocol = getOrCreateProtocol();

  // Check if pool exist
  let pool = LiquidityPool.load(event.address.toHexString());

  // If liquidity pool exist, update the pool
  if (pool != null && pool.id != ZERO_ADDRESS) {
    // Update pool entity balances and totalSupply of LP tokens
    let oldTotalSupply = pool.outputTokenSupply;

    // Get new pool coins balance
    let newPoolBalances = minusFromPoolBalances(pool, token_amount, fees);

    // Current Token Supply
    let currentTokenSupply = getCurrentTokenSupply(pool, token_supply);

    // Update totalValueLockedUSD
    let totalValueLockedUSD = getTVLUSD(pool);

    // Update totalVolumeUSD
    let totalVolumeUSD = BIGDECIMAL_ZERO;

    // Get output token price per unit
    let outTokenPriceUSD = getOutTokenPriceUSD(pool);

    // Update pool
    pool = updatePool(
      event,
      pool,
      newPoolBalances,
      currentTokenSupply,
      outTokenPriceUSD,
      totalVolumeUSD,
      totalValueLockedUSD
    );

    // Update Deposit
    createWithdraw(
      event,
      pool,
      protocol,
      oldTotalSupply.minus(currentTokenSupply),
      token_amount,
      provider
    );

    // Take a PoolDailySnapshot
    createPoolDailySnapshot(event, pool);

    // Take FinancialsDailySnapshot
    updateFinancials(event, pool, protocol);

    // Take UsageMetricsDailySnapshot
    updateUsageMetrics(event, provider, protocol);
  }
}

export function handleRemoveLiquidityImbalance(
  event: RemoveLiquidityImbalance
): void {
  let fees = event.params.fees;
  let provider = event.params.provider;
  let token_amount = event.params.token_amounts;
  let token_supply = event.params.token_supply;

  let protocol = getOrCreateProtocol();

  // Check if pool exist
  let pool = LiquidityPool.load(event.address.toHexString());

  // If liquidity pool exist, update the pool
  if (pool != null && pool.id != ZERO_ADDRESS && token_supply != BIGINT_ZERO) {
    // Update pool entity balances and totalSupply of LP tokens
    let oldTotalSupply = pool.outputTokenSupply;

    // Get new pool coins balance
    let newPoolBalances = minusFromPoolBalances(pool, token_amount, fees);

    // Current Token Supply
    let currentTokenSupply = getCurrentTokenSupply(pool, token_supply);

    // Update totalValueLockedUSD
    let totalValueLockedUSD = getTVLUSD(pool);

    // Update totalVolumeUSD
    let totalVolumeUSD = BIGDECIMAL_ZERO;

    // Get output token price per unit
    let outTokenPriceUSD = getOutTokenPriceUSD(pool);

    // Update pool
    pool = updatePool(
      event,
      pool,
      newPoolBalances,
      currentTokenSupply,
      outTokenPriceUSD,
      totalVolumeUSD,
      totalValueLockedUSD
    );

    // Update Deposit
    createWithdraw(
      event,
      pool,
      protocol,
      oldTotalSupply.minus(currentTokenSupply),
      token_amount,
      provider
    );

    // Take a PoolDailySnapshot
    createPoolDailySnapshot(event, pool);

    // Take FinancialsDailySnapshot
    updateFinancials(event, pool, protocol);

    // Take UsageMetricsDailySnapshot
    updateUsageMetrics(event, provider, protocol);
  }
}

export function handleRemoveLiquidityOne(event: RemoveLiquidityOne): void {
  // // let coin_amount = event.params.coin_amount;
  // // let provider = event.params.provider;
  // // let token_amount = event.params.token_amount;
  // // let coin_amounts: BigInt[] = []
  // // coin_amounts.push(coin_amount)
  // // let protocol = getOrCreateProtocol()
  // //   // Check if pool exist
  // //   let pool = LiquidityPool.load(event.address.toHexString());
  // // if (pool != null && pool.id != ZERO_ADDRESS) {
  // //   // Update pool entity balances and totalSupply of LP tokens
  // //   let oldTotalSupply = pool.outputTokenSupply;
  // //   // Get new pool coins balance
  // //   let newPoolBalances = getInputBalances(pool, token_amount);
  // //   // Current Token Supply
  // //   let currentTokenSupply = getCurrentTokenSupply(pool, token_amount);
  // //   // Update totalValueLockedUSD
  // //   let totalValueLockedUSD = getTVLUSD(pool);
  // //   // Update totalVolumeUSD
  // //   let totalVolumeUSD = BIGDECIMAL_ZERO;
  // //   // Get output token price per unit
  // //   let outTokenPriceUSD = getOutTokenPriceUSD(pool);
  // //   // Update pool
  // //   pool = updatePool(
  // //     event,
  // //     pool,
  // //     newPoolBalances,
  // //     currentTokenSupply,
  // //     outTokenPriceUSD,
  // //     totalVolumeUSD,
  // //     totalValueLockedUSD
  // //   );
  // //   // Update Deposit
  // //   createWithdraw(
  // //     event,
  // //     pool,
  // //     protocol,
  // //     oldTotalSupply.minus(toDecimal(token_amount, DEFAULT_DECIMALS)),
  // //     coin_amounts,
  // //     provider
  // //   );
  // //   // Take a PoolDailySnapshot
  // //   createPoolDailySnapshot(event, pool);
  // //   // Take FinancialsDailySnapshot
  // //   // updateFinancials(event, fees, pool, protocol);
  // //   // Take UsageMetricsDailySnapshot
  // //   updateUsageMetrics(event, provider, protocol);
  // }
}

export function handleTokenExchange(event: TokenExchange): void {
  let bought_id = event.params.bought_id;
  let buyer = event.params.buyer;
  let sold_id = event.params.sold_id;
  let token_bought = event.params.tokens_bought;
  let token_sold = event.params.tokens_sold;

  let protocol = getOrCreateProtocol();

  // Check if pool exist
  let pool = LiquidityPool.load(event.address.toHexString());

  if (pool != null && pool.id != ZERO_ADDRESS) {
    handleExchange(
      event,
      pool,
      protocol,
      sold_id,
      token_sold,
      bought_id,
      token_bought,
      buyer
    );

    // Take a PoolDailySnapshot
    createPoolDailySnapshot(event, pool);

    // Take UsageMetricsDailySnapshot
    updateUsageMetrics(event, buyer, protocol);
  }
}

export function handleTokenExchangeUnderlying(
  event: TokenExchangeUnderlying
): void {
  let bought_id = event.params.bought_id;
  let buyer = event.params.buyer;
  let sold_id = event.params.sold_id;
  let token_bought = event.params.tokens_bought;
  let token_sold = event.params.tokens_sold;

  let protocol = getOrCreateProtocol();

  // Check if pool exist
  let pool = LiquidityPool.load(event.address.toHexString());

  if (pool != null && pool.id != ZERO_ADDRESS) {
    handleExchange(
      event,
      pool,
      protocol,
      sold_id,
      token_sold,
      bought_id,
      token_bought,
      buyer
    );

    // Take a PoolDailySnapshot
    createPoolDailySnapshot(event, pool);

    // Take UsageMetricsDailySnapshot
    updateUsageMetrics(event, buyer, protocol);
  }
}
