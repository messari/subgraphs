import { BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { LiquidityPool, Tick } from "../../../generated/schema";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ZERO,
} from "../constants";
import { bigDecimalExponentiated, safeDivBigDecimal } from "../utils/utils";

export function getOrCreateTick(
  event: ethereum.Event,
  pool: LiquidityPool,
  tickIndex: BigInt
): Tick {
  const id = pool.id.concatI32(tickIndex.toI32());
  let tick = Tick.load(id);

  if (!tick) {
    tick = new Tick(id);
    tick.index = tickIndex;
    tick.pool = pool.id;
    tick.createdTimestamp = event.block.timestamp;
    tick.createdBlockNumber = event.block.number;
    const price0 = bigDecimalExponentiated(
      BigDecimal.fromString("1.0001"),
      tick.index
    );
    tick.prices = [price0, safeDivBigDecimal(BIGDECIMAL_ONE, price0)];
    tick.liquidityGross = BIGINT_ZERO;
    tick.liquidityGrossUSD = BIGDECIMAL_ZERO;
    tick.liquidityNet = BIGINT_ZERO;
    tick.liquidityNetUSD = BIGDECIMAL_ZERO;

    tick.lastSnapshotDayID = INT_ZERO;
    tick.lastSnapshotHourID = INT_ZERO;
    tick.lastUpdateBlockNumber = BIGINT_ZERO;
    tick.lastUpdateTimestamp = BIGINT_ZERO;

    tick.save();
  }

  return tick;
}
