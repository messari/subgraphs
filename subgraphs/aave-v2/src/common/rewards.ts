<<<<<<< aave-v2
import { BigInt } from "@graphprotocol/graph-ts";
=======
import { BigInt, log } from "@graphprotocol/graph-ts";
>>>>>>> master
import { BIGINT_TEN_TO_EIGHTEENTH, SECONDS_PER_DAY } from "./constants";

export function emissionsPerDay(rewardRatePerSecond: BigInt): BigInt {
  // Take the reward rate per second, divide out the decimals and get the emissions per day
<<<<<<< aave-v2
  const BIGINT_SECONDS_PER_DAY = BigInt.fromI32(<i32>SECONDS_PER_DAY);
  return rewardRatePerSecond.times(BIGINT_SECONDS_PER_DAY).div(BIGINT_TEN_TO_EIGHTEENTH);
=======
  const dec18 = BIGINT_TEN_TO_EIGHTEENTH;
  log.info('RETURN ' + rewardRatePerSecond.toString() + ' ' + dec18.toString() + ' ' + (rewardRatePerSecond.div(dec18)).toString() + (rewardRatePerSecond.times(BigInt.fromI32(<i32>SECONDS_PER_DAY))).div(dec18).toString(), []);
  return (rewardRatePerSecond.times(BigInt.fromI32(<i32>SECONDS_PER_DAY))).div(dec18);
>>>>>>> master
}