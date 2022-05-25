// import { log } from '@graphprotocol/graph-ts'
import { Burn as BurnEvent, Initialize, Mint as MintEvent, Swap as SwapEvent, SetFeeProtocol } from "../../generated/templates/Pool/Pool";
import { UsageType } from "../common/constants";
import { createDeposit, createWithdraw, createSwapHandleVolumeAndFees } from "../common/creators";
import { updatePrices, updatePoolMetrics, updateProtocolFees, updateUsageMetrics, updateFinancials } from "../common/updateMetrics";

export function handleInitialize(event: Initialize): void {
  updatePrices(event, event.params.sqrtPriceX96);
  updatePoolMetrics(event);
}

export function handleSetFeeProtocol(event: SetFeeProtocol): void {
  updateProtocolFees(event);
}

export function handleMint(event: MintEvent): void {
  createDeposit(event, event.params.amount0, event.params.amount1);
  updateUsageMetrics(event, event.params.sender, UsageType.DEPOSIT);
  updateFinancials(event);
  updatePoolMetrics(event);
}

export function handleBurn(event: BurnEvent): void {
  createWithdraw(event, event.params.amount0, event.params.amount1);
  updateUsageMetrics(event, event.transaction.from, UsageType.WITHDRAW);
  updateFinancials(event);
  updatePoolMetrics(event);
}

export function handleSwap(event: SwapEvent): void {
  createSwapHandleVolumeAndFees(event, event.params.amount0, event.params.amount1, event.params.recipient, event.params.sender, event.params.sqrtPriceX96);
  updateFinancials(event);
  updatePoolMetrics(event);
  updateUsageMetrics(event, event.transaction.from, UsageType.SWAP);
}
