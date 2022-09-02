import { Address, ethereum, log } from "@graphprotocol/graph-ts";
import { Token } from "../../generated/schema";
import { getOrCreateToken } from "../getters/token";
import {
  cDAI_ADDRESS,
  cETH_ADDRESS,
  cUSDC_ADDRESS,
  cWBTC_ADDRESS,
  QUARTER,
} from "./constants";

export function getTokenFromCurrency(
  event: ethereum.Event,
  currencyId: string
): Token {
  let tokenAddress: string;

  if (currencyId == "1") {
    tokenAddress = cETH_ADDRESS;
  } else if (currencyId == "2") {
    tokenAddress = cDAI_ADDRESS;
  } else if (currencyId == "3") {
    tokenAddress = cUSDC_ADDRESS;
  } else if (currencyId == "4") {
    tokenAddress = cWBTC_ADDRESS;
  } else {
    log.error(" -- New currency found: {}", [currencyId.toString()]);
  }

  let token = getOrCreateToken(
    Address.fromString(tokenAddress!),
    event.block.number
  );

  return token!;
}

export function getTimeRef(timestamp: i32): i32 {
  return timestamp - (timestamp % QUARTER);
}
