import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
} from "@graphprotocol/graph-ts";

import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_TWO,
  BIGDECIMAL_ZERO,
  BIGINT_TEN,
  FEE_CHECK_INTERVAL_BLOCKS,
} from "../../common/constants";
import {
  getLiquidityPool,
  getOrCreateFinancialsDailySnapshot,
  getOrCreateLiquidityPoolDailySnapshot,
  getOrCreateLiquidityPoolHourlySnapshot,
  getOrCreateToken,
} from "../../common/getters";
import { applyDecimals, safeDiv } from "../../common/utils/numbers";
import { createPoolFees } from "./entities";

import { DexAmmProtocol, LiquidityPool } from "../../../generated/schema";

function getPoolTokenWeights(
  totalValueLockedUSD: BigDecimal,
  inputTokens: string[],
  inputTokenBalances: BigInt[]
): BigDecimal[] {
  const inputTokenWeights: BigDecimal[] = [];
  for (let idx = 0; idx < inputTokens.length; idx++) {
    if (totalValueLockedUSD == BIGDECIMAL_ZERO) {
      inputTokenWeights.push(BIGDECIMAL_ZERO);
      continue;
    }

    const balance = inputTokenBalances[idx];
    const inputToken = getOrCreateToken(Address.fromString(inputTokens[idx]));

    const balanceUSD = balance
      .divDecimal(BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal())
      .times(inputToken.lastPriceUSD!);
    const weight = balanceUSD
      .div(totalValueLockedUSD)
      .times(BIGDECIMAL_HUNDRED);

    inputTokenWeights.push(weight);
  }

  return inputTokenWeights;
}

//  Update token balances, which also updates token weights
export function updateTokenBalances(
  pool: LiquidityPool,
  balance0: BigInt,
  balance1: BigInt
): void {
  pool.inputTokenBalances = [balance0, balance1];
  pool.inputTokenWeights = getPoolTokenWeights(
    pool.totalValueLockedUSD,
    pool.inputTokens,
    pool.inputTokenBalances
  );
  pool.save();
}

// Updates TVL and output token price
export function updatePoolValue(
  protocol: DexAmmProtocol,
  pool: LiquidityPool,
  block: ethereum.Block
): void {
  const token0 = getOrCreateToken(Address.fromString(pool.inputTokens[0]));
  const token1 = getOrCreateToken(Address.fromString(pool.inputTokens[1]));
  const lpToken = getOrCreateToken(Address.fromString(pool.id));

  const reserve0USD = applyDecimals(
    pool.inputTokenBalances[0],
    token0.decimals
  ).times(token0.lastPriceUSD!);
  const reserve1USD = applyDecimals(
    pool.inputTokenBalances[1],
    token1.decimals
  ).times(token1.lastPriceUSD!);

  const previousPoolTvlUSD = pool.totalValueLockedUSD;

  pool.totalValueLockedUSD = reserve0USD.plus(reserve1USD);
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD
    .minus(previousPoolTvlUSD)
    .plus(reserve0USD.plus(reserve1USD));

  pool.outputTokenPriceUSD = safeDiv(
    pool.totalValueLockedUSD,
    applyDecimals(pool.outputTokenSupply!, lpToken.decimals)
  );

  lpToken.lastPriceUSD = pool.outputTokenPriceUSD;
  lpToken.lastPriceBlockNumber = block.number;

  protocol.save();
  pool.save();
  lpToken.save();
}

export function updatePoolVolume(
  protocol: DexAmmProtocol,
  pool: LiquidityPool,
  amount0: BigInt,
  amount1: BigInt,
  event: ethereum.Event
): void {
  const token0 = getOrCreateToken(Address.fromString(pool.inputTokens[0]));
  const token1 = getOrCreateToken(Address.fromString(pool.inputTokens[1]));

  // Need token USD (0,1)
  let amount0USD = applyDecimals(amount0, token0.decimals).times(
    token0.lastPriceUSD!
  );
  let amount1USD = applyDecimals(amount1, token1.decimals).times(
    token1.lastPriceUSD!
  );

  let amountTotalUSD = BIGDECIMAL_ZERO;
  if (
    token0.lastPriceUSD! != BIGDECIMAL_ZERO &&
    token1.lastPriceUSD! != BIGDECIMAL_ZERO
  ) {
    amountTotalUSD = amount0USD.plus(amount1USD).div(BIGDECIMAL_TWO);
  } else if (
    token0.lastPriceUSD! == BIGDECIMAL_ZERO &&
    token1.lastPriceUSD! != BIGDECIMAL_ZERO
  ) {
    // Token0 price is zero but token1 is not. Use token1 amount only
    amount0USD = amount1USD;
    amountTotalUSD = amount1USD.times(BIGDECIMAL_TWO);
  } else if (
    token0.lastPriceUSD! != BIGDECIMAL_ZERO &&
    token1.lastPriceUSD! == BIGDECIMAL_ZERO
  ) {
    // Token1 price is zero but token0 is not. Use 2x token1
    amount1USD = amount0USD;
    amountTotalUSD = amount0USD.times(BIGDECIMAL_TWO);
  } else {
    // Both amounts are zero, nothing to update
    return;
  }

  // Update entities
  pool.cumulativeVolumeUSD = pool.cumulativeVolumeUSD.plus(amountTotalUSD);

  protocol.cumulativeVolumeUSD =
    protocol.cumulativeVolumeUSD.plus(amountTotalUSD);

  const financialsDailySnapshot = getOrCreateFinancialsDailySnapshot(
    protocol,
    event
  );
  financialsDailySnapshot.dailyVolumeUSD =
    financialsDailySnapshot.dailyVolumeUSD.plus(amountTotalUSD);
  financialsDailySnapshot.cumulativeVolumeUSD =
    financialsDailySnapshot.cumulativeVolumeUSD.plus(amountTotalUSD);
  financialsDailySnapshot.blockNumber = event.block.number;
  financialsDailySnapshot.timestamp = event.block.timestamp;

  const poolDailySnapshot = getOrCreateLiquidityPoolDailySnapshot(
    pool,
    event.block
  );
  poolDailySnapshot.dailyVolumeUSD =
    poolDailySnapshot.dailyVolumeUSD.plus(amountTotalUSD);
  poolDailySnapshot.dailyVolumeByTokenAmount = [
    poolDailySnapshot.dailyVolumeByTokenAmount[0].plus(amount0),
    poolDailySnapshot.dailyVolumeByTokenAmount[1].plus(amount1),
  ];
  poolDailySnapshot.dailyVolumeByTokenUSD = [
    poolDailySnapshot.dailyVolumeByTokenUSD[0].plus(amount0USD),
    poolDailySnapshot.dailyVolumeByTokenUSD[1].plus(amount1USD),
  ];
  poolDailySnapshot.cumulativeVolumeUSD =
    poolDailySnapshot.cumulativeVolumeUSD.plus(amountTotalUSD);
  poolDailySnapshot.blockNumber = event.block.number;
  poolDailySnapshot.timestamp = event.block.timestamp;

  const poolHourlySnapshot = getOrCreateLiquidityPoolHourlySnapshot(
    pool,
    event.block
  );
  poolHourlySnapshot.hourlyVolumeUSD =
    poolHourlySnapshot.hourlyVolumeUSD.plus(amountTotalUSD);
  poolHourlySnapshot.hourlyVolumeByTokenAmount = [
    poolHourlySnapshot.hourlyVolumeByTokenAmount[0].plus(amount0),
    poolHourlySnapshot.hourlyVolumeByTokenAmount[1].plus(amount1),
  ];
  poolHourlySnapshot.hourlyVolumeByTokenUSD = [
    poolHourlySnapshot.hourlyVolumeByTokenUSD[0].plus(amount0USD),
    poolHourlySnapshot.hourlyVolumeByTokenUSD[1].plus(amount1USD),
  ];
  poolHourlySnapshot.cumulativeVolumeUSD =
    poolHourlySnapshot.cumulativeVolumeUSD.plus(amountTotalUSD);
  poolHourlySnapshot.blockNumber = event.block.number;
  poolHourlySnapshot.timestamp = event.block.timestamp;

  pool.save();
  protocol.save();
  financialsDailySnapshot.save();
  poolDailySnapshot.save();
  poolHourlySnapshot.save();
}

export function updateAllPoolFees(
  protocol: DexAmmProtocol,
  stableFee: BigDecimal,
  volatileFee: BigDecimal,
  block: ethereum.Block,
  forceUpdate: boolean = false
): void {
  const blocksSinceLastChecked = block.number.minus(
    protocol._lastFeeCheckBlockNumber
  );

  if (!forceUpdate && blocksSinceLastChecked < FEE_CHECK_INTERVAL_BLOCKS) {
    return;
  }

  const stableFeeChanged = stableFee != protocol._stableFee;
  const volatileFeeChanged = volatileFee != protocol._volatileFee;

  if (!(stableFeeChanged && volatileFeeChanged)) {
    return;
  }

  if (stableFeeChanged) {
    protocol._stableFee = stableFee;
    updatePoolFeesForList(protocol._stablePools, stableFee);
  }

  if (volatileFeeChanged) {
    protocol._volatileFee = volatileFee;
    updatePoolFeesForList(protocol._volatilePools, volatileFee);
  }

  protocol._lastFeeCheckBlockNumber = block.number;
  protocol.save();
}

export function updatePoolFeesForList(
  poolList: Bytes[],
  fee: BigDecimal
): void {
  for (let i = 0; i < poolList.length; i++) {
    const pool = getLiquidityPool(Address.fromBytes(poolList[i]));
    if (!pool) return;

    if (pool._customFeeApplied) continue;
    createPoolFees(Address.fromBytes(poolList[i]), fee);
  }
}
