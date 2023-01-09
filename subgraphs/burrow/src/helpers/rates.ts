import { near } from "@graphprotocol/graph-ts";
import { Market, InterestRate } from "../../generated/schema";
import {
  InterestRateType,
  IntervalType,
  NANOS_TO_DAY,
  NANOS_TO_HOUR,
} from "../utils/const";

export function getOrCreateRate(
  market: Market,
  side: string,
  interval: string | null = null,
  receipt: near.ReceiptWithOutcome | null = null
): InterestRate {
  let id = side
    .concat("-")
    .concat(InterestRateType.VARIABLE)
    .concat("-")
    .concat(market.id);
  if (receipt && interval) {
    let timeInterval: string;
    if (interval == IntervalType.DAILY) {
      timeInterval = NANOS_TO_DAY(
        receipt.block.header.timestampNanosec
      ).toString();
    } else {
      timeInterval = NANOS_TO_HOUR(
        receipt.block.header.timestampNanosec
      ).toString();
    }
    id = id.concat("-").concat(timeInterval);
  }
  let rate = InterestRate.load(id);
  if (!rate) {
    rate = new InterestRate(id);
    rate.side = side;
    rate.type = InterestRateType.VARIABLE;
  }
  return rate;
}
