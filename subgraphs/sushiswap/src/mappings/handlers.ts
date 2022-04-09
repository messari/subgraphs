import { Address } from "@graphprotocol/graph-ts";
import { Deposit, _Transfer } from "../../generated/schema";
import { PairCreated } from "../../generated/SushiV2Factory/Factory";
import { Transfer, Sync, Mint, Burn, Swap } from "../../generated/templates/SushiV2Pair/Pair";
import { ZERO_ADDRESS, TransferType } from "../common/constants";
import { getOrCreateToken, getOrCreateDexAmm, getLiquidityPool } from "../common/getters";
import {
  updateFinancialsDailySnapshot,
  updateLiquidityPoolFromDeposit,
  updateLiquidityPoolFromSwap,
  updateLiquidityPoolFromSync,
  updateLiquidityPoolFromWithdraw,
  updatePoolDailySnapshot,
  updateUsageMetricsDailySnapshot,
} from "../common/metrics";
import { createDeposit, createLiquidityPool, createSwap, createTransfer, createWithdraw } from "./helpers";

export function handlePairCreated(event: PairCreated): void {
  let protocol = getOrCreateDexAmm();
  let token0 = getOrCreateToken(event.params.token0);
  let token1 = getOrCreateToken(event.params.token1);
  let tokenLP = getOrCreateToken(event.params.pair);
  createLiquidityPool(event, protocol, event.params.pair, token0, token1, tokenLP);
}

export function handleTransfer(event: Transfer): void {
  let from = event.params.from.toHexString();
  let to = event.params.to.toHexString();

  if (from == ZERO_ADDRESS && to == ZERO_ADDRESS) {
    // Ignore initial transfer of minimum liquidity
    return;
  } else if (from == ZERO_ADDRESS) {
    // Mint
    createTransfer(event, /*isMint=*/ true);
  } else if (to == ZERO_ADDRESS) {
    // Burn
    createTransfer(event, /*isMint=*/ false);
  }
}

export function handleMint(event: Mint): void {
  let deposit = createDeposit(event);
  updateLiquidityPoolFromDeposit(deposit);
  updateFinancialsDailySnapshot(event);
  updateUsageMetricsDailySnapshot(event, event.params.sender);
  updatePoolDailySnapshot(event);
}

export function handleBurn(event: Burn): void {
  let withdraw = createWithdraw(event);
  updateLiquidityPoolFromWithdraw(withdraw);
  updateFinancialsDailySnapshot(event);
  updateUsageMetricsDailySnapshot(event, event.params.sender);
  updatePoolDailySnapshot(event);
}

export function handleSwap(event: Swap): void {
  let swap = createSwap(event);
  updateLiquidityPoolFromSwap(swap);
  updateFinancialsDailySnapshot(event);
  updateUsageMetricsDailySnapshot(event, event.params.sender);
  updatePoolDailySnapshot(event);
}

export function handleSync(event: Sync): void {
  updateLiquidityPoolFromSync(event.address.toHexString(), event.params.reserve0, event.params.reserve1);
}
