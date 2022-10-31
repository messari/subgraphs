import {
  CollectMarginFees,
  CollectSwapFees,
  DecreasePoolAmount,
  DecreasePosition,
  IncreasePoolAmount,
  IncreasePosition,
  LiquidatePosition,
  Swap,
} from "../../generated/vault/Vault";
import {
  AddLiquidity,
  RemoveLiquidity,
} from "../../generated/glpManager/GlpManager";
import { BIGINT_ZERO, VAULT_PRICE_FEED_DECIMALS } from "../common/constants";
import { updateUsageMetrics } from "../common/metrics";
import { exponentToBigDecimal } from "../common/utils/numbers";
import {
  updateGlpAmounts,
  updatePoolAmounts,
  updateRevenue,
  updateTvl,
} from "./helpers";

export function handleSwap(event: Swap): void {
  // Token swap
  updateUsageMetrics(event, event.params.account);
}

export function handleIncreasePosition(event: IncreasePosition): void {
  // Increase position is a deposit to pool
  updateUsageMetrics(event, event.params.account);
}

export function handleDecreasePosition(event: DecreasePosition): void {
  // Decrease position is a deposit to pool
  updateUsageMetrics(event, event.params.account);
}

export function handleLiquidatePosition(event: LiquidatePosition): void {
  // Liquidation of a position
  updateUsageMetrics(event, event.params.account);
}

export function handleCollectSwapFees(event: CollectSwapFees): void {
  // Swap fees collected
  const totalFeesUSD = event.params.feeTokens
    .toBigDecimal()
    .div(exponentToBigDecimal(VAULT_PRICE_FEED_DECIMALS));

  updateRevenue(event.params.token, totalFeesUSD, event.block);
}

export function handleCollectMarginFees(event: CollectMarginFees): void {
  // Margin fees collected
  const totalFeesUSD = event.params.feeUsd
    .toBigDecimal()
    .div(exponentToBigDecimal(VAULT_PRICE_FEED_DECIMALS));

  updateRevenue(event.params.token, totalFeesUSD, event.block);
}

export function handleIncreasePoolAmount(event: IncreasePoolAmount): void {
  // Increase in collateral deposted to vault
  updatePoolAmounts(event.params.token, event.params.amount, event.block);
  updateTvl(event.params.token, event.block);
}

export function handleDecreasePoolAmount(event: DecreasePoolAmount): void {
  // Decrease in collateral deposted to vault
  updatePoolAmounts(
    event.params.token,
    BIGINT_ZERO.minus(event.params.amount),
    event.block
  );
  updateTvl(event.params.token, event.block);
}

export function handleAddLiquidity(event: AddLiquidity): void {
  // Minting of GLP
  updateGlpAmounts(event.params.token, event.params.mintAmount, event.block);
  updateUsageMetrics(event, event.params.account);
}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  // Redeeming GLP
  updateGlpAmounts(
    event.params.token,
    BIGINT_ZERO.minus(event.params.glpAmount),
    event.block
  );
  updateUsageMetrics(event, event.params.account);
}
