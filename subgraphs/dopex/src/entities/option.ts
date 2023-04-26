import { ethereum, Bytes, Address, BigInt } from "@graphprotocol/graph-ts";
import { LiquidityPool, Option } from "../../generated/schema";
import { OptionType, PRICE_PRECISION } from "../utils/constants";
import { SsovV3OptionsToken } from "../../generated/BasicWeeklyCalls/SsovV3OptionsToken";
import { getOrCreateToken } from "./token";

export function getOption(
  event: ethereum.Event,
  pool: LiquidityPool,
  epoch: BigInt,
  strike: BigInt,
  optionType: string
): Option | null {
  const optionId = getOptionID(pool, epoch, strike, optionType);
  return Option.load(optionId);
}

export function createOption(
  event: ethereum.Event,
  pool: LiquidityPool,
  epoch: BigInt,
  strike: BigInt,
  strikeTokenAddress: Address
): Option {
  let optionType = OptionType.CALL;
  if (pool._isPut) {
    optionType = OptionType.PUT;
  }
  const optionId = getOptionID(pool, epoch, strike, optionType);
  const option = new Option(optionId);
  option.type = optionType;
  option.pool = pool.id;
  option.underlyingAsset = pool._underlyingAsset;
  option.collateralAsset = pool.inputTokens[0];
  option.strikePrice = strike.divDecimal(PRICE_PRECISION);
  option.createdTimestamp = event.block.timestamp;

  const strikeTokenContract = SsovV3OptionsToken.bind(strikeTokenAddress);
  const strikeToken = getOrCreateToken(event, strikeTokenAddress, false);
  option.name = strikeToken.name;
  option.symbol = strikeToken.symbol;
  const tryUnderlyingSymbol = strikeTokenContract.try_underlyingSymbol();
  if (!tryUnderlyingSymbol.reverted) {
    option.underlyingAsset = Bytes.fromUTF8(tryUnderlyingSymbol.value);
  }
  const tryExpiry = strikeTokenContract.try_expiry();
  if (!tryExpiry.reverted) {
    option.expirationTimestamp = tryExpiry.value;
  }

  option.save();

  return option;
}

function getOptionID(
  pool: LiquidityPool,
  epoch: BigInt,
  strike: BigInt,
  optionType: string
): Bytes {
  return pool.id
    .concat(Bytes.fromUTF8(optionType))
    .concat(Bytes.fromUTF8(epoch.toString()))
    .concat(Bytes.fromUTF8(strike.toString()));
}
