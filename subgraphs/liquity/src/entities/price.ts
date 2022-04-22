import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { _Price } from "../../generated/schema";
import { bigIntToBigDecimal } from "../utils/numbers";

export function setCurrentETHPrice(price: BigInt): void {
  const ethPrice = new _Price("ETH");
  ethPrice.price = bigIntToBigDecimal(price);
  ethPrice.save();
}

export function getCurrentETHPrice(): BigDecimal {
  const ethPrice = _Price.load("ETH");
  return ethPrice!.price;
}
