import { BigInt } from "@graphprotocol/graph-ts";
import { BIGINT_TEN_TO_EIGHTEENTH, SECONDS_PER_DAY } from "./constants";

export function emissionsPerDay(rewardRatePerSecond: BigInt): BigInt {
  // Take the reward rate per second, divide out the decimals and get the emissions per day
  const BIGINT_SECONDS_PER_DAY = BigInt.fromI32(<i32>SECONDS_PER_DAY);
  return rewardRatePerSecond.times(BIGINT_SECONDS_PER_DAY).div(BIGINT_TEN_TO_EIGHTEENTH);
}
