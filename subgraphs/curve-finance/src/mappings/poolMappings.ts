import {
  updateFinancials,
  updateUsageMetrics,
  updatePoolSnapshots,
} from "../modules/Metrics";
import {
  AddLiquidity,
  TokenExchange,
  RemoveLiquidity,
  RemoveLiquidityOne,
  TokenExchangeUnderlying,
  RemoveLiquidityImbalance,
  AddLiquidity2 as AddLiquidityWithFees,
  AddLiquidity5 as AddLiquidityWithPriceScale,
  RemoveLiquidity2 as RemoveLiquidityWithFees,
  TokenExchange1 as TokenExchangeWithPriceScale,
  RemoveLiquidityOne1 as RemoveLiquidityOneWithSupply,
  RemoveLiquidityOne2 as RemoveLiquidityOneWithPriceScale,
} from "../../generated/templates/PoolTemplate/Pool";
import { Swap } from "../modules/Swap";
import { Deposit } from "../modules/Deposit";
import { Withdraw } from "../modules/Withdraw";
import { BigInt } from "@graphprotocol/graph-ts";
import * as constants from "../common/constants";
import { getOrCreateLiquidityPool } from "../common/initializers";

export function handleTokenExchange(event: TokenExchange): void {
  const buyer = event.params.buyer;
  const liquidityPoolAddress = event.address;

  const soldId = event.params.sold_id;
  const amountIn = event.params.tokens_sold;

  const boughtId = event.params.bought_id;
  const amountOut = event.params.tokens_bought;

  Swap(
    liquidityPoolAddress,
    soldId,
    amountIn,
    boughtId,
    amountOut,
    buyer,
    event.transaction,
    event.block
  );

  updateUsageMetrics(event.block, buyer);
  updatePoolSnapshots(liquidityPoolAddress, event.block);
  updateFinancials(event.block);
}

export function handleTokenExchangeWithPriceScale(
  event: TokenExchangeWithPriceScale
): void {
  const buyer = event.params.buyer;
  const liquidityPoolAddress = event.address;

  const soldId = event.params.sold_id;
  const amountIn = event.params.tokens_sold;

  const boughtId = event.params.bought_id;
  const amountOut = event.params.tokens_bought;

  Swap(
    liquidityPoolAddress,
    soldId,
    amountIn,
    boughtId,
    amountOut,
    buyer,
    event.transaction,
    event.block
  );

  updateUsageMetrics(event.block, buyer);
  updatePoolSnapshots(liquidityPoolAddress, event.block);
  updateFinancials(event.block);
}

export function handleTokenExchangeUnderlying(
  event: TokenExchangeUnderlying
): void {
  const buyer = event.params.buyer;
  const liquidityPoolAddress = event.address;
  const soldId = event.params.sold_id;
  const amountIn = event.params.tokens_sold;
  const boughtId = event.params.bought_id;
  const amountOut = event.params.tokens_bought;

  Swap(
    liquidityPoolAddress,
    soldId,
    amountIn,
    boughtId,
    amountOut,
    buyer,
    event.transaction,
    event.block,
    true
  );

  updateUsageMetrics(event.block, buyer);
  updatePoolSnapshots(liquidityPoolAddress, event.block);
  updateFinancials(event.block);
}

export function handleAddLiquidity(event: AddLiquidity): void {
  const liquidityPoolAddress = event.address;

  const provider = event.params.provider;
  const tokenAmounts = event.params.token_amounts;
  const totalSupply = event.params.token_supply;

  Deposit(
    liquidityPoolAddress,
    tokenAmounts,
    totalSupply,
    provider,
    event.transaction,
    event.block
  );

  updateUsageMetrics(event.block, provider);
  updatePoolSnapshots(liquidityPoolAddress, event.block);
  updateFinancials(event.block);
}

export function handleAddLiquidityWithPriceScale(
  event: AddLiquidityWithPriceScale
): void {
  const liquidityPoolAddress = event.address;

  const provider = event.params.provider;
  const tokenAmounts = event.params.token_amounts;
  const totalSupply = event.params.token_supply;

  Deposit(
    liquidityPoolAddress,
    tokenAmounts,
    totalSupply,
    provider,
    event.transaction,
    event.block
  );

  updateUsageMetrics(event.block, provider);
  updatePoolSnapshots(liquidityPoolAddress, event.block);
  updateFinancials(event.block);
}

export function handleAddLiquidityWithFees(event: AddLiquidityWithFees): void {
  const liquidityPoolAddress = event.address;

  const provider = event.params.provider;
  const tokenAmounts = event.params.token_amounts;
  const totalSupply = event.params.token_supply;

  Deposit(
    liquidityPoolAddress,
    tokenAmounts,
    totalSupply,
    provider,
    event.transaction,
    event.block
  );

  updateUsageMetrics(event.block, provider);
  updatePoolSnapshots(liquidityPoolAddress, event.block);
  updateFinancials(event.block);
}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  const provider = event.params.provider;
  const liquidityPoolAddress = event.address;
  const withdrawnCoinAmounts = event.params.token_amounts;
  const tokenSupplyAfterWithdrawal = event.params.token_supply;

  Withdraw(
    liquidityPoolAddress,
    withdrawnCoinAmounts,
    null,
    tokenSupplyAfterWithdrawal,
    provider,
    event.transaction,
    event.block,
    event
  );

  updateUsageMetrics(event.block, provider);
  updatePoolSnapshots(liquidityPoolAddress, event.block);
  updateFinancials(event.block);
}

export function handleRemoveLiquidityWithFees(
  event: RemoveLiquidityWithFees
): void {
  const provider = event.params.provider;
  const liquidityPoolAddress = event.address;
  const withdrawnCoinAmounts = event.params.token_amounts;
  const tokenSupplyAfterWithdrawal = event.params.token_supply;

  Withdraw(
    liquidityPoolAddress,
    withdrawnCoinAmounts,
    null,
    tokenSupplyAfterWithdrawal,
    provider,
    event.transaction,
    event.block,
    event
  );

  updateUsageMetrics(event.block, provider);
  updatePoolSnapshots(liquidityPoolAddress, event.block);
  updateFinancials(event.block);
}

export function handleRemoveLiquidityOne(event: RemoveLiquidityOne): void {
  const provider = event.params.provider;
  const liquidityPoolAddress = event.address;
  const outputTokenBurntAmount = event.params.token_amount;

  Withdraw(
    liquidityPoolAddress,
    [],
    outputTokenBurntAmount,
    null,
    provider,
    event.transaction,
    event.block,
    event
  );

  updateUsageMetrics(event.block, provider);
  updatePoolSnapshots(liquidityPoolAddress, event.block);
  updateFinancials(event.block);
}

export function handleRemoveLiquidityOneWithSupply(
  event: RemoveLiquidityOneWithSupply
): void {
  const provider = event.params.provider;
  const liquidityPoolAddress = event.address;
  const outputTokenBurntAmount = event.params.token_amount;

  Withdraw(
    liquidityPoolAddress,
    [],
    outputTokenBurntAmount,
    null,
    provider,
    event.transaction,
    event.block,
    event
  );

  updateUsageMetrics(event.block, provider);
  updatePoolSnapshots(liquidityPoolAddress, event.block);
  updateFinancials(event.block);
}

export function handleRemoveLiquidityOneWithPriceScale(
  event: RemoveLiquidityOneWithPriceScale
): void {
  const provider = event.params.provider;
  const liquidityPoolAddress = event.address;
  const outputTokenBurntAmount = event.params.token_amount;
  const withdrawCoinAmount = event.params.coin_amount;
  const withdrawCoinIndex = event.params.coin_index;
  const pool = getOrCreateLiquidityPool(liquidityPoolAddress, event.block);
  const inputTokens = pool._inputTokensOrdered;
  const withdrawnTokenAmounts: BigInt[] = [];

  for (let idx = 0; idx < inputTokens.length; idx++) {
    if ((idx = withdrawCoinIndex.toI32())) {
      withdrawnTokenAmounts.push(withdrawCoinAmount);
      continue;
    }

    withdrawnTokenAmounts.push(constants.BIGINT_ZERO);
  }

  Withdraw(
    liquidityPoolAddress,
    withdrawnTokenAmounts,
    outputTokenBurntAmount,
    null,
    provider,
    event.transaction,
    event.block,
    event
  );

  updateUsageMetrics(event.block, provider);
  updatePoolSnapshots(liquidityPoolAddress, event.block);
  updateFinancials(event.block);
}

export function handleRemoveLiquidityImbalance(
  event: RemoveLiquidityImbalance
): void {
  const provider = event.params.provider;
  const liquidityPoolAddress = event.address;
  const withdrawnTokenAmounts = event.params.token_amounts;
  const tokenSupplyAfterWithdrawal = event.params.token_supply;

  Withdraw(
    liquidityPoolAddress,
    withdrawnTokenAmounts,
    null,
    tokenSupplyAfterWithdrawal,
    provider,
    event.transaction,
    event.block,
    event
  );

  updateUsageMetrics(event.block, provider);
  updatePoolSnapshots(liquidityPoolAddress, event.block);
  updateFinancials(event.block);
}
