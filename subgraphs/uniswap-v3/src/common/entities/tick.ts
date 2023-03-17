import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { LiquidityPool, Tick } from "../../../generated/schema";
import { BIGDECIMAL_ONE, BIGINT_ZERO, INT_ZERO } from "../constants";
import { bigDecimalExponated, safeDivBigDecimal } from "../utils/utils";
import { Pool } from "../../../generated/Factory/Pool";

export function getOrCreateTick(
  event: ethereum.Event,
  pool: LiquidityPool,
  tickIndex: BigInt
): Tick {
  const id = pool.id.concatI32(tickIndex.toI32());
  let tick = Tick.load(id);

  if (!tick) {
    // Get tick info
    const poolContract = Pool.bind(Address.fromBytes(pool.id));
    const tick_info = poolContract.try_ticks(tickIndex.toI32());
    let liquidityNet = BIGINT_ZERO;
    let liquidityGross = BIGINT_ZERO;

    if (!tick_info.reverted) {
      liquidityGross = tick_info.value.value0;
      liquidityNet = tick_info.value.value1;
    }

    // Update pool liquidity
    pool.totalLiquidity = pool.totalLiquidity.plus(liquidityGross);
    const liquidityPricePerUnit = safeDivBigDecimal(
      pool.totalLiquidityUSD,
      pool.totalLiquidity.toBigDecimal()
    );
    pool.totalLiquidityUSD = pool.totalLiquidity
      .toBigDecimal()
      .times(liquidityPricePerUnit);

    // Create tick
    tick = new Tick(id);
    tick.index = tickIndex;
    tick.pool = pool.id;
    tick.createdTimestamp = event.block.timestamp;
    tick.createdBlockNumber = event.block.number;
    const price0 = bigDecimalExponated(
      BigDecimal.fromString("1.0001"),
      tick.index
    );
    tick.prices = [price0, safeDivBigDecimal(BIGDECIMAL_ONE, price0)];
    tick.liquidityGross = liquidityGross;
    tick.liquidityGrossUSD = liquidityGross
      .toBigDecimal()
      .times(liquidityPricePerUnit);
    tick.liquidityNet = liquidityNet;
    tick.liquidityNetUSD = liquidityNet
      .toBigDecimal()
      .times(liquidityPricePerUnit);
    tick.lastSnapshotDayID = INT_ZERO;
    tick.lastSnapshotHourID = INT_ZERO;
    tick.lastUpdateBlockNumber = BIGINT_ZERO;
    tick.lastUpdateTimestamp = BIGINT_ZERO;

    tick.save();
  }

  return tick;
}
