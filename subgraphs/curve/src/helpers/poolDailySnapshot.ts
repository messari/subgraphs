import { BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { LiquidityPool, PoolDailySnapshot } from "../../generated/schema";
import { getOrCreateProtocol } from "../utils/common";
import { SECONDS_PER_DAY } from "../utils/constant";

export function createPoolDailySnapshot(
  event: ethereum.Event,
  pool: LiquidityPool
): void {
  // Number of days since Unix epoch
  let timestamp = event.block.timestamp;
  let blockNumber = event.block.number;
  let day: i64 = timestamp.toI64() / SECONDS_PER_DAY;
  let id = event.address
    .toHexString()
    .concat("-")
    .concat(day.toString());
  let protocol = getOrCreateProtocol();
  let poolDailySnapshot = PoolDailySnapshot.load(id);
  if (poolDailySnapshot == null) {
    poolDailySnapshot = new PoolDailySnapshot(id);
    poolDailySnapshot.protocol = protocol.id;
    poolDailySnapshot.pool = pool.id;
    poolDailySnapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
    poolDailySnapshot.totalVolumeUSD = pool.totalVolumeUSD;
    poolDailySnapshot.inputTokenBalances = pool.inputTokenBalances.map<
      BigDecimal
    >((it) => it);
    poolDailySnapshot.outputTokenSupply = pool.outputTokenSupply;
    poolDailySnapshot.outputTokenPriceUSD = pool.outputTokenPriceUSD;
    poolDailySnapshot.rewardTokenEmissionsAmount = [];
    poolDailySnapshot.rewardTokenEmissionsUSD = [];
    poolDailySnapshot.blockNumber = blockNumber;
    poolDailySnapshot.timestamp = timestamp;

    poolDailySnapshot.save();
  }
}
