import { Address, ethereum, BigInt } from "@graphprotocol/graph-ts";
import { BIGINT_TWO, BIGINT_ZERO, INT_ONE, INT_ZERO } from "../constants";
import { Pool } from "../../../generated/Factory/Pool";
import { TickLens } from "../../../generated/Factory/TickLens";
import { ERC20 } from "../../../generated/Factory/ERC20";
import { convertTokenToDecimal } from "./utils";
import { POOL_MAPPINGS } from "./poolMappings";
import {
  createLiquidityPool,
  getLiquidityPool,
  getLiquidityPoolAmounts,
} from "../entities/pool";
import { getOrCreateProtocol } from "../entities/protocol";
import { getOrCreateToken } from "../entities/token";
import { getOrCreateTick } from "../entities/tick";

/**
 * Create entries in store for each pool and token
 * before regenesis.
 */
export function populateEmptyPools(event: ethereum.Event): void {
  const length = POOL_MAPPINGS.length;
  const tickLensContract = TickLens.bind(
    Address.fromString("0xbfd8137f7d1516d3ea5ca83523914859ec47f573")
  );

  for (let i = 0; i < length; ++i) {
    const poolMapping = POOL_MAPPINGS[i];
    const poolAddress = poolMapping[1];
    const token0Address = poolMapping[2];
    const token1Address = poolMapping[3];
    const poolContract = Pool.bind(poolAddress);

    createLiquidityPool(
      event,
      poolAddress,
      token0Address,
      token1Address,
      poolContract.fee()
    );
    const pool = getLiquidityPool(poolAddress)!;
    const poolAmounts = getLiquidityPoolAmounts(poolAddress)!;

    // create the tokens and tokentracker
    const token0 = getOrCreateToken(event, token0Address);
    const token1 = getOrCreateToken(event, token1Address);

    // populate the TVL by call contract balanceOf
    const token0Contract = ERC20.bind(
      Address.fromBytes(pool.inputTokens[INT_ZERO])
    );
    const tvlToken0Raw = token0Contract.balanceOf(Address.fromBytes(pool.id));
    const tvlToken0Adjusted = convertTokenToDecimal(
      tvlToken0Raw,
      token0.decimals
    );

    const token1Contract = ERC20.bind(
      Address.fromBytes(pool.inputTokens[INT_ONE])
    );
    const tvlToken1Raw = token1Contract.balanceOf(Address.fromBytes(pool.id));
    const tvlToken1Adjusted = convertTokenToDecimal(
      tvlToken1Raw,
      token1.decimals
    );

    pool.inputTokenBalances = [tvlToken0Raw, tvlToken1Raw];
    poolAmounts.inputTokenBalances = [tvlToken0Adjusted, tvlToken1Adjusted];
    pool.totalLiquidity = poolContract.liquidity();
    pool.activeLiquidity = pool.totalLiquidity;

    const tickSpacing = poolContract.tickSpacing();

    // https://github.com/Uniswap/v3-core/blob/main/contracts/libraries/TickMath.sol
    // https://docs.uniswap.org/contracts/v3/reference/periphery/lens/TickLens
    // Min and Max tick are the range of ticks that a position can be in
    const maxTick: number = customCeil(887272 / tickSpacing) * tickSpacing;
    const minTick: number = -maxTick;
    const ticksPerWord: number = 256 * tickSpacing;
    const wordsCount: number = customCeil((maxTick - minTick) / ticksPerWord);

    let totalLiquidityGross = BIGINT_ZERO;
    for (let i = 0; i < wordsCount; i++) {
      const tickBitmapIndex = customFloor(minTick / ticksPerWord) + i;
      const populatedTicks = tickLensContract.getPopulatedTicksInWord(
        poolAddress,
        tickBitmapIndex as i32
      );

      for (let j = 0; j < populatedTicks.length; j++) {
        const populatedTick = populatedTicks[j];
        const tick = getOrCreateTick(
          event,
          pool,
          BigInt.fromI32(populatedTick.tick as i32)
        );
        tick.liquidityGross = populatedTick.liquidityGross;
        tick.liquidityNet = populatedTick.liquidityNet;
        tick.lastUpdateTimestamp = event.block.timestamp;
        tick.lastUpdateBlockNumber = event.block.number;
        tick.save();

        totalLiquidityGross = totalLiquidityGross.plus(
          populatedTick.liquidityGross
        );
      }
    }

    pool.totalLiquidity = totalLiquidityGross.div(BIGINT_TWO);

    poolAmounts.save();
    pool.save();
  }

  const protocol = getOrCreateProtocol();

  protocol._regenesis = true;
  protocol.save();
}

function customFloor(value: number): number {
  return value % 1 === 0
    ? value
    : value > 0
    ? parseInt(value.toString())
    : parseInt(value.toString()) - 1;
}

function customCeil(value: number): number {
  return value % 1 === 0
    ? value
    : value > 0
    ? parseInt(value.toString()) + 1
    : parseInt(value.toString());
}
