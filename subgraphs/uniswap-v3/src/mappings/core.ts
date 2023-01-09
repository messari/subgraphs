import { BigInt } from "@graphprotocol/graph-ts";
import {
  Initialize,
  Mint as MintEvent,
  Burn as BurnEvent,
  Swap as SwapEvent,
  Collect as CollectEvent,
  SetFeeProtocol,
} from "../../generated/templates/Pool/Pool";
import {
  getDepositDeltas,
  incrementDepositHelper,
} from "../common/entities/deposit";
import { DexEventHandler } from "../common/dex_event_handler";
import {
  getOrCreateProtocol,
  updateProtocolFees,
} from "../common/entities/protocol";
import { updateTokenPrices } from "../common/entities/token";
import { getAmountUSD, getLiquidityPool } from "../common/entities/pool";
import {
  subtractBigDecimalLists,
  subtractBigIntLists,
  sumBigDecimalList,
  sumBigIntListByIndex,
} from "../common/utils/utils";
import { getOrCreateTick } from "../common/entities/tick";
import { CollectProtocol } from "../../generated/Factory/Pool";
import { getSwapDeltas } from "../common/entities/swap";
import { getWithdrawDeltas } from "../common/entities/withdraw";
import { BIGINT_ZERO } from "../common/constants";

// Emitted when a given liquidity pool is first created.
export function handleInitialize(event: Initialize): void {
  const pool = getLiquidityPool(event.address)!;
  pool.tick = BigInt.fromI32(event.params.tick);
  pool.save();
}

// Update the fees colected by the protocol.
export function handleSetFeeProtocol(event: SetFeeProtocol): void {
  updateProtocolFees(event);
}

// Handle mint event emmitted from a pool contract.
export function handleMint(event: MintEvent): void {
  const pool = getLiquidityPool(event.address)!;
  const deltas = getDepositDeltas(
    pool,
    event.params.amount,
    event.params.amount0,
    event.params.amount1,
    BigInt.fromI32(event.params.tickLower),
    BigInt.fromI32(event.params.tickUpper)
  );
  const dexEventHandler = new DexEventHandler(event, pool, false, deltas);
  dexEventHandler.createDeposit(
    event.params.owner,
    getOrCreateTick(event, pool, BigInt.fromI32(event.params.tickLower)),
    getOrCreateTick(event, pool, BigInt.fromI32(event.params.tickUpper)),
    null
  );
  dexEventHandler.processLPBalanceChanges();
  incrementDepositHelper(dexEventHandler.pool.id);
}

// Handle burn event emmitted from a pool contract.
export function handleBurn(event: BurnEvent): void {
  const pool = getLiquidityPool(event.address)!;
  const deltas = getWithdrawDeltas(
    pool,
    event.params.amount,
    event.params.amount0,
    event.params.amount1,
    BigInt.fromI32(event.params.tickLower),
    BigInt.fromI32(event.params.tickUpper)
  );
  pool._totalAmountWithdrawn = sumBigIntListByIndex([
    pool._totalAmountWithdrawn,
    [event.params.amount0, event.params.amount1],
  ]);
  const dexEventHandler = new DexEventHandler(event, pool, false, deltas);
  dexEventHandler.createWithdraw(
    event.params.owner,
    getOrCreateTick(event, pool, BigInt.fromI32(event.params.tickLower)),
    getOrCreateTick(event, pool, BigInt.fromI32(event.params.tickUpper)),
    null
  );
  dexEventHandler.processLPBalanceChanges();
}

// Handle a swap event emitted from a pool contract.
export function handleSwap(event: SwapEvent): void {
  updateTokenPrices(event, event.params.sqrtPriceX96);
  const pool = getLiquidityPool(event.address)!;
  const deltas = getSwapDeltas(
    pool,
    event.params.liquidity,
    event.params.amount0,
    event.params.amount1
  );

  pool._totalAmountEarned = sumBigIntListByIndex([
    pool._totalAmountEarned,
    deltas.uncollectedProtocolSideTokenAmountsDeltas,
    deltas.uncollectedSupplySideTokenAmountsDeltas,
  ]);
  const dexEventHandler = new DexEventHandler(event, pool, true, deltas);

  // 0 if amount0 is positive, 1 if amount1 is positive
  const tokenInIdx = event.params.amount0.gt(BIGINT_ZERO) ? 0 : 1;
  const tokenOutIdx = tokenInIdx === 0 ? 1 : 0;
  dexEventHandler.createSwap(
    tokenInIdx,
    tokenOutIdx,
    event.params.sender,
    BigInt.fromI32(event.params.tick)
  );
  dexEventHandler.processLPBalanceChanges();
}

// Handle a collect event emitted from a pool contract.
// Collects uncollectedTokens
export function handleCollectPool(event: CollectEvent): void {
  const pool = getLiquidityPool(event.address)!;
  const protocol = getOrCreateProtocol();

  const oldUncollectedSupplyValuesUSD = pool.uncollectedSupplySideValuesUSD;
  pool._totalAmountCollected = sumBigIntListByIndex([
    pool._totalAmountCollected,
    [event.params.amount0, event.params.amount1],
  ]);
  pool.uncollectedSupplySideTokenAmounts = sumBigIntListByIndex([
    subtractBigIntLists(pool._totalAmountEarned, pool._totalAmountCollected),
    pool._totalAmountWithdrawn,
  ]);
  pool.uncollectedSupplySideValuesUSD = getAmountUSD(
    event,
    pool,
    pool.uncollectedSupplySideTokenAmounts
  );

  const usdDelta = sumBigDecimalList(
    subtractBigDecimalLists(
      pool.uncollectedSupplySideValuesUSD,
      oldUncollectedSupplyValuesUSD
    )
  );

  pool.totalValueLockedUSD = pool.totalValueLockedUSD.plus(usdDelta);
  protocol.uncollectedSupplySideValueUSD =
    protocol.uncollectedSupplySideValueUSD.plus(usdDelta);
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(usdDelta);

  pool.save();
  protocol.save();
}

// Handle protocol fee collection event emitted from a pool contract.
// Collects uncollectedTokens
export function handleCollectProtocol(event: CollectProtocol): void {
  const pool = getLiquidityPool(event.address)!;
  const protocol = getOrCreateProtocol();

  const oldUncollectedProtocolValueUSD = pool.uncollectedProtocolSideValuesUSD;
  pool.uncollectedProtocolSideTokenAmounts = subtractBigIntLists(
    pool.uncollectedProtocolSideTokenAmounts,
    [event.params.amount0, event.params.amount1]
  );
  pool.uncollectedProtocolSideValuesUSD = getAmountUSD(
    event,
    pool,
    pool.uncollectedProtocolSideTokenAmounts
  );

  const usdDelta = sumBigDecimalList(
    subtractBigDecimalLists(
      pool.uncollectedProtocolSideValuesUSD,
      oldUncollectedProtocolValueUSD
    )
  );
  pool.totalValueLockedUSD = pool.totalValueLockedUSD.plus(usdDelta);
  protocol.uncollectedProtocolSideValueUSD =
    protocol.uncollectedProtocolSideValueUSD.plus(usdDelta);
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(usdDelta);

  pool.save();
  protocol.save();
}
