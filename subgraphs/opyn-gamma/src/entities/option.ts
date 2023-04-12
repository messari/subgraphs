import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../configurations/configure";
import { Controller } from "../../generated/Controller/Controller";
import { OtokenCreated } from "../../generated/OTokenFactory/OTokenFactory";
import { Option } from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_TEN_TO_EIGHTH,
  BIGINT_ZERO,
  INT_EIGHT,
  OptionType,
} from "../common/constants";
import { getOrCreateToken } from "../common/tokens";
import { bigIntToBigDecimal } from "../common/utils/numbers";
import { getOptionExpiryPrice, getOptionValue } from "../price";
import {
  addPoolClosedVolume,
  addPoolExercisedVolume,
  addPoolMintVolume,
  getOrCreatePool,
  updatePoolOpenInterest,
} from "./pool";

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
  option.strikePrice = bigIntToBigDecimal(event.params.strikePrice, INT_EIGHT);

  option.type = event.params.isPut ? OptionType.PUT : OptionType.CALL;
  option.expirationTimestamp = event.params.expiry;
  option.createdTimestamp = event.block.timestamp;
  option.lastPriceBlockNumber = BIGINT_ZERO;
  option.totalSupply = BIGINT_ZERO;
  option.openInterestUSD = BIGDECIMAL_ZERO;
  option.save();
  return option;
}

export function isOptionITM(option: Option): boolean {
  const controller = Controller.bind(NetworkConfigs.getControllerAddress());
  const payout = controller.getPayout(
    Address.fromBytes(option.id),
    BIGINT_TEN_TO_EIGHTH
  );
  return payout.gt(BIGINT_ZERO);
}

export function markOptionExpired(event: ethereum.Event, option: Option): void {
  if (!isOptionExpired(event, option)) {
    return;
  }
  if (option.expirationPriceUSD) {
    return;
  }
  option.expirationPriceUSD = getOptionExpiryPrice(event, option);
  option.save();
  const pool = getOrCreatePool(getOrCreateToken(option.pool));
  const totalValueUSD = getOptionValue(event, option, option.totalSupply!);
  if (isOptionITM(option)) {
    addPoolExercisedVolume(event, pool, totalValueUSD);
  }
  addPoolClosedVolume(event, pool, totalValueUSD);
  updateOptionTotalSupply(event, option, BIGINT_ZERO);
}

export function updateOptionTotalSupply(
  event: ethereum.Event,
  option: Option,
  netChange: BigInt
): void {
  const previousOpenInterestUSD = option.openInterestUSD!;
  option.totalSupply = option.totalSupply!.plus(netChange);
  let totalValueUSD = BIGDECIMAL_ZERO;
  if (!isOptionExpired(event, option)) {
    totalValueUSD = getOptionValue(event, option, option.totalSupply!);
  }
  option.openInterestUSD = totalValueUSD;
  const pool = getOrCreatePool(getOrCreateToken(option.pool));
  updatePoolOpenInterest(
    event,
    pool,
    option.openInterestUSD!.minus(previousOpenInterestUSD)
  );
  option.save();
}

export function mintOption(
  event: ethereum.Event,
  option: Option,
  amount: BigInt
): void {
  updateOptionTotalSupply(event, option, amount);
  const pool = getOrCreatePool(getOrCreateToken(option.pool));
  const amountUSD = getOptionValue(event, option, amount);
  addPoolMintVolume(event, pool, amountUSD);
}

export function burnOption(
  event: ethereum.Event,
  option: Option,
  amount: BigInt
): void {
  updateOptionTotalSupply(event, option, BIGINT_ZERO.minus(amount));
}

function isOptionExpired(event: ethereum.Event, option: Option): boolean {
  return event.block.timestamp.gt(option.expirationTimestamp!);
}
