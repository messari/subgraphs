import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import * as constants from "../constant";

export function getDay(timestamp: i64): i64 {
  return timestamp / constants.SECONDS_PER_DAY;
}

export function getHour(timestamp: i64): i64 {
  return timestamp / constants.SECONDS_PER_HOUR;
}

export function normalizedUsdcPrice(usdcPrice: BigInt): BigInt {
  return usdcPrice.div(constants.USDC_DENOMINATOR);
}

export function getTimestampInMillis(block: ethereum.Block): BigInt {
  return block.timestamp.times(BigInt.fromI32(1000));
}
