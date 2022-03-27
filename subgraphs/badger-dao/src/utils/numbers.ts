import { BigInt } from '@graphprotocol/graph-ts';
import { SECONDS_PER_DAY, USDC_DENOMINATOR } from '../constant';

export function getDay(timestamp: BigInt): i32 {
  return timestamp.toI32() / SECONDS_PER_DAY;
}

export function normalizedUsdcPrice(usdcPrice: BigInt): BigInt {
  return usdcPrice.div(USDC_DENOMINATOR);
}
