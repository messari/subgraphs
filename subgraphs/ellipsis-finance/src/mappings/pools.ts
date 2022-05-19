import { log } from "@graphprotocol/graph-ts";
import {
  AddLiquidity,
  NewFee as NewFee2,
  RemoveLiquidity,
  RemoveLiquidityImbalance,
  RemoveLiquidityOne,
  TokenExchange,
} from "../../generated/Factory/BasePool2";
import {
  AddLiquidity as AddLiquidity3,
  NewFee as NewFee3,
  RemoveLiquidity as RemoveLiquidity3,
  RemoveLiquidityImbalance as RemoveLiquidityImbalance3,
} from "../../generated/Factory/BasePool3";
import { TokenExchangeUnderlying } from "../../generated/Factory/StableSwap";
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
  log.error("handleAddLiquidity2 for {}", [event.address.toHexString()]);
  let pool = getOrCreatePool(event.address, event);
  log.error("pool created for {}", [event.address.toHexString()]);
  log.error("event fees {}", [event.params.fees.toString()]);
  handleLiquidityFees(pool, event.params.fees, event); // liquidity fees only take on remove liquidity imbalance and add liquidity

  updatePool(pool, event); // also updates protocol tvl
  updatePoolMetrics(pool.id, event);
  updateFinancials(event); // call after protocol tvl is updated
  updateUsageMetrics(event, "deposit");
}

export function handleRemoveLiquidity2(event: RemoveLiquidity): void {
  log.error("handleRemoveLiquidity2 for {}", [event.address.toHexString()]);

  let pool = getOrCreatePool(event.address, event);
  updatePool(pool, event); // also updates protocol tvl
  updatePoolMetrics(pool.id, event);
  updateFinancials(event); // call after protocol tvl is updated
  updateUsageMetrics(event, "withdraw");
}

export function handleRemoveLiquidityImbalance2(event: RemoveLiquidityImbalance): void {
  log.error("handleRemoveLiquidityImbalance2 for {}", [event.address.toHexString()]);
  let pool = getOrCreatePool(event.address, event);

  handleLiquidityFees(pool, event.params.fees, event); // liquidity fees only take on remove liquidity imbalance and add liquidity
  updatePool(pool, event); // also updates protocol tvl
  updatePoolMetrics(pool.id, event);
  updateFinancials(event); // call after protocol tvl is updated
  updateUsageMetrics(event, "withdraw");
}

export function handleAddLiquidity3(event: AddLiquidity3): void {
  let pool = getOrCreatePool(event.address, event);
  handleLiquidityFees(pool, event.params.fees, event); // liquidity fees only take on remove liquidity imbalance and add liquidity
  updatePool(pool, event); // also updates protocol tvl
  updatePoolMetrics(pool.id, event);
  updateFinancials(event); // call after protocol tvl is updated
  updateUsageMetrics(event, "deposit");
}

export function handleRemoveLiquidity3(event: RemoveLiquidity3): void {
  log.error("handleRemoveLiquidity3 for {}", [event.address.toHexString()]);

  let pool = getOrCreatePool(event.address, event);
  updatePool(pool, event); // also updates protocol tvl
  updatePoolMetrics(pool.id, event);
  updateFinancials(event); // call after protocol tvl is updated
  updateUsageMetrics(event, "withdraw");
}

export function handleRemoveLiquidityImbalance3(event: RemoveLiquidityImbalance3): void {
  log.error("handleRemoveLiquidityImbalance3 for {}", [event.address.toHexString()]);

  let pool = getOrCreatePool(event.address, event);

  handleLiquidityFees(pool, event.params.fees, event); // liquidity fees only take on remove liquidity imbalance and add liquidity
  updatePool(pool, event); // also updates protocol tvl
  updatePoolMetrics(pool.id, event);
  updateFinancials(event); // call after protocol tvl is updated
  updateUsageMetrics(event, "withdraw");
}

export function handleRemoveLiquidityOne(event: RemoveLiquidityOne): void {
  log.error("handleRemoveLiquidityOne for {}", [event.address.toHexString()]);

  let pool = getOrCreatePool(event.address, event);
  updatePool(pool, event); // also updates protocol tvl
  updatePoolMetrics(pool.id, event);
  updateFinancials(event); // call after protocol tvl is updated
  updateUsageMetrics(event, "withdraw");
}

export function handleTokenExchange(event: TokenExchange): void {
  log.error("handleTokenExchange for {}", [event.address.toHexString()]);

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
  log.error("handleTokenExchangeUnderlying for {}", [event.address.toHexString()]);

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

export function handleNewFee2(event: NewFee2): void {
  log.error("handleNewFee2 for {}", [event.address.toHexString()]);

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

export function handleNewFee3(event: NewFee3): void {
  log.error("handleNewFee3 for {}", [event.address.toHexString()]);

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
