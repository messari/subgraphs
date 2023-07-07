import { Address, ethereum, log } from "@graphprotocol/graph-ts";
import { Token } from "../../generated/schema";
import { getOrCreateToken } from "../getters/token";
import {
  cDAI_ADDRESS,
  cETH_ADDRESS,
  cUSDC_ADDRESS,
  cWBTC_ADDRESS,
  ZERO_ADDRESS,
} from "./constants";

export function getTokenFromCurrency(
  event: ethereum.Event,
  currencyId: string
): Token {
  // default if no currencyID is recognized
  let tokenAddress = ZERO_ADDRESS.toHexString();

  if (currencyId == "1") {
    tokenAddress = cETH_ADDRESS;
  } else if (currencyId == "2") {
    tokenAddress = cDAI_ADDRESS;
  } else if (currencyId == "3") {
    tokenAddress = cUSDC_ADDRESS;
  } else if (currencyId == "4") {
    tokenAddress = cWBTC_ADDRESS;
  } else {
    log.warning(" -- New currency found: {}", [currencyId.toString()]);
  }

  const token = getOrCreateToken(
    Address.fromString(tokenAddress),
    event.block.number
  );

  return token;
}

export function getNameFromCurrency(currencyId: string): string {
  // default if no currencyID is recognized
  let currencyName = "UNKNOWN";

  if (currencyId == "1") {
    currencyName = "ETH";
  } else if (currencyId == "2") {
    currencyName = "DAI";
  } else if (currencyId == "3") {
    currencyName = "USDC";
  } else if (currencyId == "4") {
    currencyName = "WBTC";
  } else {
    log.warning(" -- New currency found: {}", [currencyId.toString()]);
  }

  return currencyName;
}
