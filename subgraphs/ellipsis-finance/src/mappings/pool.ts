import {
  updateFinancials,
  updatePoolSnapshots,
  updateUsageMetrics,
} from "../modules/Metrics";
import {
  AddLiquidity,
  TokenExchange,
  RemoveLiquidity,
  RemoveLiquidityOne,
  TokenExchangeUnderlying,
  RemoveLiquidityImbalance,
} from "../../generated/templates/PoolTemplate/Pool";
import { Swap } from "../modules/Swap";
import { Deposit } from "../modules/Deposit";
import { Withdraw } from "../modules/Withdraw";
import * as constants from "../common/constants";

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
export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  const provider = event.params.provider;
  const liquidityPoolAddress = event.address;
  const withdrawnCoinAmounts = event.params.token_amounts;
  const tokenSupplyAfterWithdrawal = event.params.token_supply;

  Withdraw(
    liquidityPoolAddress,
    withdrawnCoinAmounts,
    constants.BIGINT_NEGATIVE_ONE,
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
    constants.BIGINT_NEGATIVE_ONE,
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
  const withdrawnCoinAmounts = event.params.coin_amount;
  const outputTokenBurntAmount = event.params.token_amount;

  Withdraw(
    liquidityPoolAddress,
    [withdrawnCoinAmounts],
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
