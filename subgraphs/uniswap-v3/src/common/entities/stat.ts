import { Bytes, ethereum } from "@graphprotocol/graph-ts";
import { Stat } from "../../../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, SECONDS_PER_DAY } from "../constants";

export function getOrCreateDailyStat(event: ethereum.Event, id: Bytes): Stat {
  const day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const statID = Bytes.fromHexString("STAT - ").concat(id).concatI32(day);
  let stat = Stat.load(statID);

  if (!stat) {
    stat = new Stat(statID);
    stat.count = BIGINT_ZERO;
    stat.meanAmount = BIGINT_ZERO;
    stat.meanUSD = BIGDECIMAL_ZERO;
    stat.medianAmount = BIGINT_ZERO;
    stat.medianUSD = BIGDECIMAL_ZERO;
    stat.maxAmount = BIGINT_ZERO;
    stat.maxUSD = BIGDECIMAL_ZERO;
    stat.minAmount = BIGINT_ZERO;
    stat.minUSD = BIGDECIMAL_ZERO;
    stat.varAmount = BIGDECIMAL_ZERO;
    stat.varUSD = BIGDECIMAL_ZERO;

    stat.save();
  }

  return stat;
}
