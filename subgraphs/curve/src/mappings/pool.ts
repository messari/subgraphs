import {
  AddLiquidity,
  RemoveLiquidity,
  RemoveLiquidityOne,
  Remove_liquidity_one_coinCall,
  RemoveLiquidityImbalance,
  TokenExchange,
} from "../../generated/templates/PoolLPToken/StableSwapLending3";
import {
  AddLiquidity as AddLiquidityTriCrypto,
  RemoveLiquidity as RemoveLiquidityTriCrypto,
  Remove_liquidity_one_coinCall as Remove_liquidity_one_coin_tricrypto_Call,
  TokenExchange as TokenExchangeTriCrypto,
} from "../../generated/TRICRYPTOPool/StableSwapTriCrypto";
import { ERC20, Transfer } from "../../generated/templates/PoolLPToken/ERC20";
import { PoolLPToken } from "../../generated/templates";

import {
  Coin,
  LiquidityPool,
  RemoveLiqudityOneEvent,
  Token,
} from "../../generated/schema";

import {
  getCurrentTokenSupply,
  getOrCreateProtocol,
  getTVLUSD,
} from "../utils/common";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  DEFAULT_DECIMALS,
  toDecimal,
  ZERO_ADDRESS,
} from "../utils/constant";
import {
  getLpTokenOfPool,
  getOrCreatePoolFromTemplate,
  getPoolBalances,
  updatePool,
} from "../helpers/pool";
import { createDeposit } from "../helpers/deposit";
import { handleExchange } from "../helpers/exchange";
import { updateFinancials } from "../helpers/financials";
import { createWithdraw } from "../helpers/withdraw";
import { updateUsageMetrics } from "../helpers/usageMetric";
import { createPoolDailySnapshot } from "../helpers/poolDailySnapshot";
import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { Registry } from "../../generated/Factory/Registry";
import { createSwap } from "../helpers/swap";

export function handleAddLiquidity(event: AddLiquidity): void {
  let fees = event.params.fees;
  let invariant = event.params.invariant;
  let provider = event.params.provider;
  let token_amounts = event.params.token_amounts;
  let token_supply = event.params.token_supply;

  handleAddLiquidityCommon(
    event,
    event.address,
    token_supply,
    token_amounts,
    provider,
    fees
  );
}

export function handleAddLiquidityTriCrypto(
  event: AddLiquidityTriCrypto
): void {
  let fee = event.params.fee;
  let provider = event.params.provider;
  let token_amounts = event.params.token_amounts;
  let token_supply = event.params.token_supply;

  handleAddLiquidityCommon(
    event,
    event.address,
    token_supply,
    token_amounts,
    provider,
    [fee]
  );
}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  let fees = event.params.fees;
  let provider = event.params.provider;
  let token_amounts = event.params.token_amounts;
  let token_supply = event.params.token_supply;

  handleRemoveLiquidityCommon(
    event,
    event.address,
    token_supply,
    token_amounts,
    provider,
    fees
  );
}

export function handleRemoveLiquidityImbalance(
  event: RemoveLiquidityImbalance
): void {
  let fees = event.params.fees;
  let provider = event.params.provider;
  let token_amounts = event.params.token_amounts;
  let token_supply = event.params.token_supply;

  handleRemoveLiquidityCommon(
    event,
    event.address,
    token_supply,
    token_amounts,
    provider,
    fees
  );
}

export function handleRemoveLiquidityOne(event: RemoveLiquidityOne): void {
  let coin_amount = event.params.coin_amount;
  let provider = event.params.provider;
  let token_amount = event.params.token_amount;

  // Check if pool exist
  let pool = LiquidityPool.load(event.address.toHexString());
  if (pool != null && pool.id != ZERO_ADDRESS) {
    // create RemoveLiquidityOne entity
    let id = event.transaction.hash
      .toHexString()
      .concat("-")
      .concat(pool.id);

    let entity = new RemoveLiqudityOneEvent(id);
    entity.eventApplied = true;
    entity.provider = provider;
    entity.tokenAmount = token_amount;
    entity.dy = coin_amount;
    entity.logIndex = event.logIndex;
    entity.save();

    handleRLOEEntityUpdate(event, entity, pool);
  }
}

export function handleTokenExchange(event: TokenExchange): void {
  let pool = LiquidityPool.load(event.address.toHexString());

  if (pool != null) {
    let coinSold = Coin.load(pool.id + "-" + event.params.sold_id.toString())!;
    let tokenSold = Token.load(coinSold.token)!;
    let amountSold = toDecimal(event.params.tokens_sold, tokenSold.decimals);

    let coinBought = Coin.load(
      pool.id + "-" + event.params.bought_id.toString()
    )!;
    let tokenBought = Token.load(coinBought.token)!;
    let amountBought = toDecimal(
      event.params.tokens_bought,
      tokenBought.decimals
    );

    let buyer = event.params.buyer;
    handleTokenExchangeCommon(
      event,
      event.address,
      tokenSold,
      amountSold,
      tokenBought,
      amountBought,
      buyer
    );
  }
}

export function handleTokenExchangeTriCrypto(
  event: TokenExchangeTriCrypto
): void {
  let pool = LiquidityPool.load(event.address.toHexString());

  if (pool != null) {
    let coinSold = Coin.load(pool.id + "-" + event.params.sold_id.toString())!;
    let tokenSold = Token.load(coinSold.token)!;
    let amountSold = toDecimal(event.params.tokens_sold, tokenSold.decimals);

    let coinBought = Coin.load(
      pool.id + "-" + event.params.bought_id.toString()
    )!;
    let tokenBought = Token.load(coinBought.token)!;
    let amountBought = toDecimal(
      event.params.tokens_bought,
      tokenBought.decimals
    );

    let buyer = event.params.buyer;
    handleTokenExchangeCommon(
      event,
      event.address,
      tokenSold,
      amountSold,
      tokenBought,
      amountBought,
      buyer
    );
  }
}

function handleRLOEEntityUpdate(
  event: ethereum.Event,
  entity: RemoveLiqudityOneEvent,
  pool: LiquidityPool
): void {
  // handle liquidity removal only after both event and call are handled
  if (!entity.eventApplied || !entity.callApplied) {
    return;
  }

  let protocol = getOrCreateProtocol();

  // collect data from RemoveLiqudityOneEvent entity
  let tokenAmount = entity.tokenAmount as BigInt;
  let i = entity.i as i32;
  let dy = entity.dy as BigInt;
  let provider = entity.provider;

  let tokenAmounts: BigInt[] = [];
  for (let j = 0; j < pool._coinCount.toI32(); ++j) {
    if (j == i) {
      tokenAmounts[j] = dy;
    } else {
      tokenAmounts[j] = BigInt.fromI32(0);
    }
  }

  handleRemoveLiquidityCommon(
    event,
    event.address,
    tokenAmount,
    tokenAmounts,
    provider,
    []
  );
}

function handleAddLiquidityCommon(
  event: ethereum.Event,
  address: Address,
  token_supply: BigInt,
  token_amounts: BigInt[],
  provider: Address,
  fees: BigInt[]
): void {
  // create pool
  let pool = getOrCreatePoolFromTemplate(event, address);
  let protocol = getOrCreateProtocol();

  if (pool !== null) {
    // create LPToken entity from template when pool is createed
    if (pool.outputTokenSupply == BIGDECIMAL_ZERO) {
      PoolLPToken.create(Address.fromBytes(pool._lpTokenAddress));
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

    let lpTokenAmount = currentTokenSupply.minus(oldTotalSupply);
    for (let i = 0; i < pool._coinCount.toI32(); ++i) {
      let coin = Coin.load(pool.id.concat("-").concat(i.toString()));
      if (coin !== null) {
        if (
          pool._coinCount.toI32() == token_amounts.length &&
          pool._coinCount.toI32() == fees.length
        ) {
          coin.balance = coin.balance.plus(token_amounts[i]);
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

    // Update Deposit
    createDeposit(
      event,
      pool,
      protocol,
      lpTokenAmount,
      token_amounts,
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

function handleRemoveLiquidityCommon(
  event: ethereum.Event,
  address: Address,
  token_supply: BigInt,
  token_amounts: BigInt[],
  provider: Address,
  fees: BigInt[]
): void {
  // create pool
  let pool = getOrCreatePoolFromTemplate(event, address);
  let protocol = getOrCreateProtocol();

  if (pool !== null) {
    // create LPToken entity from template when pool is createed
    if (pool.outputTokenSupply == BIGDECIMAL_ZERO) {
      PoolLPToken.create(Address.fromBytes(pool._lpTokenAddress));
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
    createWithdraw(
      event,
      pool,
      protocol,
      lpTokenAmount,
      token_amounts,
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

function handleTokenExchangeCommon(
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
