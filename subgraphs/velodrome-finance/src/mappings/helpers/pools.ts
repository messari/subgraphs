import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { BIGDECIMAL_TWO, BIGDECIMAL_ZERO } from "../../common/constants";
import {
  getLiquidityPool,
  getOrCreateDex,
  getOrCreateFinancialsDailySnapshot,
  getOrCreateLiquidityPoolDailySnapshot,
  getOrCreateLiquidityPoolHourlySnapshot,
  getOrCreateToken,
} from "../../common/getters";
import { applyDecimals, safeDiv } from "../../common/utils/numbers";

//  Update token balances, which also
export function updateTokenBalances(
  poolAddress: Address,
  balance0: BigInt,
  balance1: BigInt
): void {
  let pool = getLiquidityPool(poolAddress);
  pool.inputTokenBalances = [balance0, balance1];
  pool.save();
}

// Updates TVL and output token price
export function updatePoolValue(
  poolAddress: Address,
  block: ethereum.Block
): void {
  let protocol = getOrCreateDex();
  let pool = getLiquidityPool(poolAddress);

  let token0 = getOrCreateToken(Address.fromString(pool.inputTokens[0]));
  let token1 = getOrCreateToken(Address.fromString(pool.inputTokens[1]));
  let lpToken = getOrCreateToken(poolAddress);

  let reserve0USD = applyDecimals(
    pool.inputTokenBalances[0],
    token0.decimals
  ).times(token0.lastPriceUSD!);
  let reserve1USD = applyDecimals(
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
  poolAddress: Address,
  amount0: BigInt,
  amount1: BigInt,
  event: ethereum.Event
): void {
  let pool = getLiquidityPool(poolAddress);
  let protocol = getOrCreateDex();

  let token0 = getOrCreateToken(Address.fromString(pool.inputTokens[0]));
  let token1 = getOrCreateToken(Address.fromString(pool.inputTokens[1]));

  // Need token USD (0,1)
  let amount0USD = applyDecimals(amount0, token0.decimals).times(
    token0.lastPriceUSD!
  );
  let amount1USD = applyDecimals(amount1, token1.decimals).times(
    token1.lastPriceUSD!
  );

  let amountTotalUSD = BIGDECIMAL_ZERO;
  if (
    token0.lastPriceUSD != BIGDECIMAL_ZERO &&
    token1.lastPriceUSD != BIGDECIMAL_ZERO
  ) {
    amountTotalUSD = amount0USD.plus(amount1USD).div(BIGDECIMAL_TWO);
  } else if (
    token0.lastPriceUSD == BIGDECIMAL_ZERO &&
    token1.lastPriceUSD != BIGDECIMAL_ZERO
  ) {
    // Token0 price is zero but token1 is not. Use token1 amount only
    amount0USD = amount1USD;
    amountTotalUSD = amount1USD.times(BIGDECIMAL_TWO);
  } else if (
    token0.lastPriceUSD != BIGDECIMAL_ZERO &&
    token1.lastPriceUSD == BIGDECIMAL_ZERO
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

  let financialsDailySnapshot = getOrCreateFinancialsDailySnapshot(event);
  financialsDailySnapshot.dailyVolumeUSD =
    financialsDailySnapshot.dailyVolumeUSD.plus(amountTotalUSD);
  financialsDailySnapshot.cumulativeVolumeUSD =
    financialsDailySnapshot.cumulativeVolumeUSD.plus(amountTotalUSD);
  financialsDailySnapshot.blockNumber = event.block.number;
  financialsDailySnapshot.timestamp = event.block.timestamp;

  let poolDailySnapshot = getOrCreateLiquidityPoolDailySnapshot(event.address, event.block);
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

  let poolHourlySnapshot = getOrCreateLiquidityPoolHourlySnapshot(event.address, event.block);
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
