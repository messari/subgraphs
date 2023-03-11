import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import { OtokenCreated } from "../../generated/OTokenFactory/OTokenFactory";
import { Option } from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_EIGHT,
  OptionType,
} from "../common/constants";
import { getOrCreateToken } from "../common/tokens";
import { bigIntToBigDecimal } from "../common/utils/numbers";
import { getOptionExpiryPrice, getUnderlyingPrice } from "../price";
import { getOrCreatePool, updatePoolOpenInterest } from "./pool";

export function createOption(event: OtokenCreated): Option {
  const token = getOrCreateToken(event.params.tokenAddress);
  const option = new Option(event.params.tokenAddress);
  option.name = token.name;
  option.symbol = token.symbol;
  option.underlyingAsset = getOrCreateToken(event.params.underlying).id;
  const collateralToken = getOrCreateToken(event.params.collateral);
  option.collateralAsset = collateralToken.id;
  option.pool = getOrCreatePool(collateralToken).id;
  option.strikeAsset = getOrCreateToken(event.params.strike).id;
  option.strikePrice = bigIntToBigDecimal(event.params.strikePrice);

  option.type = event.params.isPut ? OptionType.PUT : OptionType.CALL;
  option.expirationTimestamp = event.params.expiry;
  option.createdTimestamp = event.block.timestamp;
  option.lastPriceBlockNumber = BIGINT_ZERO;
  option.totalSupply = BIGINT_ZERO;
  option.openInterestUSD = BIGDECIMAL_ZERO;
  option.save();
  return option;
}

export function markOptionExpired(event: ethereum.Event, option: Option): void {
  if (option.expirationPriceUSD) {
    return;
  }
  option.expirationPriceUSD = getOptionExpiryPrice(event, option);
  option.save();
}

export function updateOptionTotalSupply(
  event: ethereum.Event,
  option: Option,
  netChange: BigInt
): void {
  const price = getUnderlyingPrice(event, option);
  const previousOpenInterestUSD = option.openInterestUSD!;
  option.totalSupply = option.totalSupply!.plus(netChange);
  option.openInterestUSD = price.times(
    bigIntToBigDecimal(option.totalSupply!, INT_EIGHT)
  );
  option.save();
  const pool = getOrCreatePool(getOrCreateToken(option.pool));
  updatePoolOpenInterest(
    event,
    pool,
    option.openInterestUSD!.minus(previousOpenInterestUSD)
  );
}
