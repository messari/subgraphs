import { Address } from "@graphprotocol/graph-ts";

import {
  createDeposit,
  createWithdraw,
  createSwap,
} from "../../../../src/mappings/helpers/entities";
import {
  updateFinancials,
  updateUsageMetrics,
  updatePoolMetrics,
  updateRevenue,
} from "../../../../src/common/metrics";
import {
  BIGDECIMAL_HUNDRED,
  BIGINT_THOUSAND,
  BIGINT_ZERO,
  UsageType,
  ZERO_ADDRESS,
} from "../../../../src/common/constants";
import {
  getLiquidityPool,
  getOrCreateDex,
} from "../../../../src/common/getters";
import {
  handleTransferBurn,
  handleTransferMint,
  handleTransferToPoolBurn,
} from "../../../../src/common/handlers";
import { updatePoolPriceFromSwap } from "../../../../src/mappings/helpers/pricing";
import {
  updateAllPoolFees,
  updatePoolValue,
  updatePoolVolume,
  updateTokenBalances,
} from "../../../../src/mappings/helpers/pools";
import {
  FACTORY_ADDRESS,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../common/constants";

import { PairFactory } from "../../../../generated/Factory/PairFactory";
import {
  Mint,
  Burn,
  Swap,
  Fees,
  Transfer,
  Sync,
} from "../../../../generated/templates/Pair/Pair";

export function handleMint(event: Mint): void {
  const protocol = getOrCreateDex(
    FACTORY_ADDRESS,
    PROTOCOL_NAME,
    PROTOCOL_SLUG
  );
  const pool = getLiquidityPool(event.address);
  if (!pool) return;
  createDeposit(
    protocol,
    pool,
    event.params.amount0,
    event.params.amount1,
    event.params.sender,
    event
  );
  updatePoolValue(protocol, pool, event.block); // TVL, output token price
  updateUsageMetrics(protocol, event.params.sender, UsageType.DEPOSIT, event);
  updateFinancials(protocol, event);
  updatePoolMetrics(pool, event.block); // Syncs daily/hourly metrics with pool
}

export function handleBurn(event: Burn): void {
  const protocol = getOrCreateDex(
    FACTORY_ADDRESS,
    PROTOCOL_NAME,
    PROTOCOL_SLUG
  );
  const pool = getLiquidityPool(event.address);
  if (!pool) return;

  createWithdraw(
    protocol,
    pool,
    event.params.amount0,
    event.params.amount1,
    event.params.to,
    event
  );
  updatePoolValue(protocol, pool, event.block); // TVL, output token price
  updateUsageMetrics(
    protocol,
    event.transaction.from,
    UsageType.WITHDRAW,
    event
  );
  updateFinancials(protocol, event);
  updatePoolMetrics(pool, event.block); // Syncs daily/hourly metrics with pool
}

export function handleSwap(event: Swap): void {
  const protocol = getOrCreateDex(
    FACTORY_ADDRESS,
    PROTOCOL_NAME,
    PROTOCOL_SLUG
  );
  const pool = getLiquidityPool(event.address);
  if (!pool) return;

  createSwap(
    protocol,
    pool,
    event.params.amount0In,
    event.params.amount0Out,
    event.params.amount1In,
    event.params.amount1Out,
    event.params.sender,
    event.params.to,
    event
  );
  updatePoolPriceFromSwap(
    pool,
    event.params.amount0In,
    event.params.amount0Out,
    event.params.amount1In,
    event.params.amount1Out,
    event
  );
  updatePoolValue(protocol, pool, event.block); // TVL, output token price
  updatePoolVolume(
    protocol,
    pool,
    event.params.amount0In.plus(event.params.amount0Out),
    event.params.amount1In.plus(event.params.amount1Out),
    event
  );
  updateUsageMetrics(protocol, event.params.sender, UsageType.SWAP, event);
  updateFinancials(protocol, event);

  const factoryContract = PairFactory.bind(Address.fromString(FACTORY_ADDRESS));
  const stableFee = factoryContract
    .getFee(true)
    .toBigDecimal()
    .div(BIGDECIMAL_HUNDRED);
  const volatileFee = factoryContract
    .getFee(false)
    .toBigDecimal()
    .div(BIGDECIMAL_HUNDRED);

  updateAllPoolFees(protocol, stableFee, volatileFee, event.block, false);
  updatePoolMetrics(pool, event.block); // Syncs daily/hourly metrics with pool
}

export function handleFees(event: Fees): void {
  const protocol = getOrCreateDex(
    FACTORY_ADDRESS,
    PROTOCOL_NAME,
    PROTOCOL_SLUG
  );
  const pool = getLiquidityPool(event.address);
  if (!pool) return;

  updateRevenue(
    protocol,
    pool,
    event.params.amount0,
    event.params.amount1,
    event
  );
}

// Sync emitted whenever reserves are updated
export function handleSync(event: Sync): void {
  const pool = getLiquidityPool(event.address);
  if (!pool) return;

  updateTokenBalances(pool, event.params.reserve0, event.params.reserve1);
}

// Handle transfers event.
// The transfers are either occur as a part of the Mint or Burn event process.
// The tokens being transferred in these events are the LP tokens from the liquidity pool that emitted this event.
export function handleTransfer(event: Transfer): void {
  const pool = getLiquidityPool(event.address);
  if (!pool) return;

  // ignore initial transfers for first adds
  if (
    event.params.to.toHexString() == ZERO_ADDRESS &&
    event.params.amount.equals(BIGINT_THOUSAND) &&
    pool.outputTokenSupply! == BIGINT_ZERO
  ) {
    return;
  }
  // mints
  if (event.params.from.toHexString() == ZERO_ADDRESS) {
    handleTransferMint(
      event,
      pool,
      event.params.amount,
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
      event.params.amount,
      event.params.from.toHexString()
    );
  }
}
