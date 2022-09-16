// import { log } from "@graphprotocol/graph-ts";
import {
  Burn as BurnEvent,
  Initialize,
  Mint as MintEvent,
  Swap as SwapEvent,
  SetFeeProtocol,
} from "../../generated/templates/Pool/Pool";
import { UsageType } from "../common/constants";
import {
  createDeposit,
  createWithdraw,
  createSwapHandleVolumeAndFees,
} from "../common/creators";
import {
  updatePrices,
  updatePoolMetrics,
  updateProtocolFees,
  updateUsageMetrics,
  updateFinancials,
} from "../common/updateMetrics";

// Emitted when a given liquidity pool is first created.
export function handleInitialize(event: Initialize): void {
  updatePrices(event, event.params.sqrtPriceX96);
  updatePoolMetrics(event);
}

// Update the fees colected by the protocol.
export function handleSetFeeProtocol(event: SetFeeProtocol): void {
  updateProtocolFees(event);
}

// Handle a mint event emitted from a pool contract. Considered a deposit into the given liquidity pool.
export function handleMint(event: MintEvent): void {
  createDeposit(
    event,
    event.params.owner,
    event.params.amount0,
    event.params.amount1
  );
  updateUsageMetrics(event, event.params.owner, UsageType.DEPOSIT);
  updateFinancials(event);
  updatePoolMetrics(event);
}

// Handle a burn event emitted from a pool contract. Considered a withdraw into the given liquidity pool.
export function handleBurn(event: BurnEvent): void {
  createWithdraw(
    event,
    event.params.owner,
    event.params.amount0,
    event.params.amount1
  );
  updateUsageMetrics(event, event.params.owner, UsageType.WITHDRAW);
  updateFinancials(event);
  updatePoolMetrics(event);
}

// Handle a swap event emitted from a pool contract.
export function handleSwap(event: SwapEvent): void {
  createSwapHandleVolumeAndFees(
    event,
    event.params.amount0,
    event.params.amount1,
    event.params.recipient,
    event.params.sender,
    event.params.sqrtPriceX96
  );
  updateFinancials(event);
  updatePoolMetrics(event);
  updateUsageMetrics(event, event.transaction.from, UsageType.SWAP);
}
