import { near } from "@graphprotocol/graph-ts";
import { Market, InterestRate } from "../../generated/schema";
import {
  InterestRateSide,
  InterestRateType,
  NANOS_TO_HOUR,
} from "../utils/const";

export function getOrCreateSupplyRate(
  market: Market,
  receipt: near.ReceiptWithOutcome | null = null
): InterestRate {
  let id = InterestRateSide.LENDER.concat("-")
    .concat(InterestRateType.VARIABLE)
    .concat("-")
    .concat(market.id);
  if (receipt)
    id = id
      .concat("-")
      .concat(NANOS_TO_HOUR(receipt.block.header.timestampNanosec).toString());
  let rate = InterestRate.load(id);
  if (rate == null) {
    rate = new InterestRate(id);
    rate.side = InterestRateSide.LENDER;
    rate.type = InterestRateType.VARIABLE;
  }
  return rate as InterestRate;
}

export function getOrCreateBorrowRate(
  market: Market,
  receipt: near.ReceiptWithOutcome | null = null
): InterestRate {
  let id = InterestRateSide.BORROWER.concat("-")
    .concat(InterestRateType.VARIABLE)
    .concat("-")
    .concat(market.id);
  if (receipt)
    id = id
      .concat("-")
      .concat(NANOS_TO_HOUR(receipt.block.header.timestampNanosec).toString());
  let rate = InterestRate.load(id);
  if (rate == null) {
    rate = new InterestRate(id);
    rate.side = InterestRateSide.BORROWER;
    rate.type = InterestRateType.VARIABLE;
  }
  return rate as InterestRate;
}
