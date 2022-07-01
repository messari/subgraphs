import { log } from "@graphprotocol/graph-ts";
import { _HelperStore } from "../../generated/schema";
import {
  Mint,
  Burn,
  Swap,
  Transfer,
  Sync,
} from "../../generated/templates/Pair/Pair";
import {
  createDeposit,
  createWithdraw,
  createSwapHandleVolumeAndFees,
} from "../common/creators";
import {
  handleTransferBurn,
  handleTransferMint,
  handleTransferToPoolBurn,
} from "../common/handlers";
import {
  updateFinancials,
  updateInputTokenBalances,
  updatePoolMetrics,
  updateTvlAndTokenPrices,
  updateUsageMetrics,
} from "../common/updateMetrics";
import {
  BIGINT_THOUSAND,
  BIGINT_ZERO,
  UsageType,
  ZERO_ADDRESS,
} from "../common/constants";
import { getLiquidityPool } from "../common/getters";

export function handleTransfer(event: Transfer): void {
  let pool = getLiquidityPool(event.address.toHexString());

  // ignore initial transfers for first adds
  if (
    event.params.to.toHexString() == ZERO_ADDRESS &&
    event.params.value.equals(BIGINT_THOUSAND) &&
    pool.outputTokenSupply == BIGINT_ZERO
  ) {
    return;
  }
  // mints
  if (event.params.from.toHexString() == ZERO_ADDRESS) {
    handleTransferMint(
      event,
      pool,
      event.params.value,
      event.params.to.toHexString()
    );
  }
  // Case where direct send first on native token withdrawls.
  // For burns, mint tokens are first transferred to the pool before transferred for burn.
  // This gets the EOA that made the burn loaded into the _Transfer.

  if (event.params.to == event.address) {
    handleTransferToPoolBurn(event, event.params.from.toHexString());
  }
  // burn
  if (
    event.params.to.toHexString() == ZERO_ADDRESS &&
    event.params.from == event.address
  ) {
    handleTransferBurn(
      event,
      pool,
      event.params.value,
      event.params.from.toHexString()
    );
  }
}

export function handleSync(event: Sync): void {
  updateInputTokenBalances(
    event.address.toHexString(),
    event.params.reserve0,
    event.params.reserve1
  );
  updateTvlAndTokenPrices(event.address.toHexString(), event.block.number);
}

export function handleMint(event: Mint): void {
  createDeposit(event, event.params.amount0, event.params.amount1);
  updateUsageMetrics(event, event.params.sender, UsageType.DEPOSIT);
  updateFinancials(event);
  updatePoolMetrics(event);
}

export function handleBurn(event: Burn): void {
  createWithdraw(event, event.params.amount0, event.params.amount1);
  updateUsageMetrics(event, event.transaction.from, UsageType.WITHDRAW);
  updateFinancials(event);
  updatePoolMetrics(event);
}

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
