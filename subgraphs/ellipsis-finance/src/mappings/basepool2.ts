import {
  AddLiquidity,
  NewFee,
  RemoveLiquidity,
  RemoveLiquidityImbalance,
  TokenExchangeUnderlying, 
  TokenExchange, 
  RemoveLiquidityOne
} from "../../generated/templates/BasePool2/BasePool2";
import { BIGDECIMAL_ONE_HUNDRED, FEE_DENOMINATOR_DECIMALS, LiquidityPoolFeeType } from "../common/constants";
import { getOrCreatePool, getPoolFee } from "../common/getters";
import {
  handleLiquidityFees,
  updateFinancials,
  updatePool,
  updatePoolMetrics,
  updateUsageMetrics,
} from "../common/metrics";
import { bigIntToBigDecimal } from "../common/utils/numbers";
import { handleExchange } from "../services/swaps";

export function handleAddLiquidity2(event: AddLiquidity): void {
  let pool = getOrCreatePool(event.address, event);

  handleLiquidityFees(pool, event.params.fees, event); // liquidity fees only take on remove liquidity imbalance and add liquidity
  updatePool(pool, event); // also updates protocol tvl
  updatePoolMetrics(pool.id, event);
  updateFinancials(event); // call after protocol tvl is updated
  updateUsageMetrics(event, "deposit");
}

export function handleRemoveLiquidity2(event: RemoveLiquidity): void {
  let pool = getOrCreatePool(event.address, event);

  updatePool(pool, event); // also updates protocol tvl
  updatePoolMetrics(pool.id, event);
  updateFinancials(event); // call after protocol tvl is updated
  updateUsageMetrics(event, "withdraw");
}

export function handleRemoveLiquidityImbalance2(event: RemoveLiquidityImbalance): void {
  let pool = getOrCreatePool(event.address, event);

  handleLiquidityFees(pool, event.params.fees, event); // liquidity fees only take on remove liquidity imbalance and add liquidity
  updatePool(pool, event); // also updates protocol tvl
  updatePoolMetrics(pool.id, event);
  updateFinancials(event); // call after protocol tvl is updated
  updateUsageMetrics(event, "withdraw");
}

export function handleRemoveLiquidityOne(event: RemoveLiquidityOne): void {
  let pool = getOrCreatePool(event.address, event);

  updatePool(pool, event); // also updates protocol tvl
  updatePoolMetrics(pool.id, event);
  updateFinancials(event); // call after protocol tvl is updated
  updateUsageMetrics(event, "withdraw");
}

export function handleTokenExchange(event: TokenExchange): void {

  handleExchange(
    event.params.buyer,
    event.params.sold_id,
    event.params.bought_id,
    event.params.tokens_sold,
    event.params.tokens_bought,
    event.block.timestamp,
    event.block.number,
    event.address,
    event,
    false,
  );
}

export function handleTokenExchangeUnderlying(event: TokenExchangeUnderlying): void {

  handleExchange(
    event.params.buyer,
    event.params.sold_id,
    event.params.bought_id,
    event.params.tokens_sold,
    event.params.tokens_bought,
    event.block.timestamp,
    event.block.number,
    event.address,
    event,
    true,
  );
}

export function handleNewFee2(event: NewFee): void {
  let pool = getOrCreatePool(event.address, event);
  let tradingFee = getPoolFee(pool.id, LiquidityPoolFeeType.FIXED_TRADING_FEE);
  let protocolFee = getPoolFee(pool.id, LiquidityPoolFeeType.FIXED_PROTOCOL_FEE);
  let lpFee = getPoolFee(pool.id, LiquidityPoolFeeType.FIXED_LP_FEE);
  let totalFee = bigIntToBigDecimal(event.params.fee, FEE_DENOMINATOR_DECIMALS).times(BIGDECIMAL_ONE_HUNDRED);
  let adminFee = bigIntToBigDecimal(event.params.admin_fee, FEE_DENOMINATOR_DECIMALS).times(BIGDECIMAL_ONE_HUNDRED);
  tradingFee.feePercentage = totalFee;
  protocolFee.feePercentage = adminFee.times(totalFee);
  lpFee.feePercentage = totalFee.minus(adminFee.times(totalFee));

  tradingFee.save();
  protocolFee.save();
  lpFee.save();
}

