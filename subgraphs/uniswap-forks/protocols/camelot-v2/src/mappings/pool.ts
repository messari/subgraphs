import { BigInt } from "@graphprotocol/graph-ts";
import {
  Burn,
  FeePercentUpdated,
  Mint,
  SetStableSwap,
  Swap,
  Sync,
  Transfer,
} from "../../../../generated/templates/Pair/Pair";
import { UsageType } from "../../../../src/common/constants";
import {
  updateFinancials,
  updatePoolMetrics,
  updateUsageMetrics,
} from "../../../../src/common/updateMetrics";
import { convertTokenToDecimal } from "../../../../src/common/utils/utils";
import {
  handleBurn as handlePoolBurn,
  handleMint as handlePoolMint,
  handleSync as handlePoolSync,
  handleTransfer as handlePoolTransfer,
} from "../../../../src/mappings/pool";
import { createPoolFees } from "../../src/common/creators";
import {} from "../../src/common/updateMetrics";
import { INT_THREE, PairType } from "../common/constants";
import { createSwapHandleVolumeAndFees } from "../common/creators";
import { _HelperStore } from "../../../../generated/schema";

// Handle transfers event.
// The transfers are either occur as a part of the Mint or Burn event process.
// The tokens being transferred in these events are the LP tokens from the liquidity pool that emitted this event.
export function handleTransfer(event: Transfer): void {
  handlePoolTransfer(event);
}

// Handle Sync event.
// Emitted after every Swap, Mint, and Burn event.
// Gives information about the rebalancing of tokens used to update tvl, balances, and token pricing
export function handleSync(event: Sync): void {
  handlePoolSync(event);
}

// Handle a mint event emitted from a pool contract. Considered a deposit into the given liquidity pool.
export function handleMint(event: Mint): void {
  handlePoolMint(event);
}

// Handle a burn event emitted from a pool contract. Considered a withdraw into the given liquidity pool.
export function handleBurn(event: Burn): void {
  handlePoolBurn(event);
}

// Handle a swap event emitted from a pool contract.
export function handleSwap(event: Swap): void {
  createSwapHandleVolumeAndFees(
    event,
    event.params.to.toHexString(),
    event.params.sender.toHexString(),
    event.params.amount0In,
    event.params.amount1In,
    event.params.amount0Out,
    event.params.amount1Out
  );
  updateFinancials(event);
  updatePoolMetrics(event);
  updateUsageMetrics(event, event.transaction.from, UsageType.SWAP);
}

export function handleFeePercentUpdated(event: FeePercentUpdated): void {
  const token0TradeFee = convertTokenToDecimal(
    BigInt.fromI32(event.params.token0FeePercent),
    INT_THREE
  );
  const token1TradeFee = convertTokenToDecimal(
    BigInt.fromI32(event.params.token0FeePercent),
    INT_THREE
  );
  createPoolFees(event.address.toHexString(), token0TradeFee, token1TradeFee);
}

export function handleSetStableSwap(event: SetStableSwap): void {
  const helperStore = new _HelperStore(event.address.toHexString());
  if (event.params.stableSwap) {
    helperStore.valueString = PairType.STABLE;
  } else {
    helperStore.valueString = PairType.VOLATILE;
  }
  helperStore.save();
}
