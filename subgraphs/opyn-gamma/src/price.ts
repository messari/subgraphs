import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../configurations/configure";
import { Oracle } from "../generated/Oracle/Oracle";
import { Option, Token } from "../generated/schema";
import { BIGDECIMAL_ZERO, INT_EIGHT } from "./common/constants";
import { getOrCreateToken } from "./common/tokens";
import { bigIntToBigDecimal } from "./common/utils/numbers";
import { getUsdPricePerToken } from "./prices";

export function getTokenPrice(event: ethereum.Event, token: Token): BigDecimal {
  if (event.block.number == token.lastPriceBlockNumber!) {
    return token.lastPriceUSD!;
  }
  const oracle = Oracle.bind(
    NetworkConfigs.getOracleAddress(event.block.number.toI32())
  );
  const priceResult = oracle.try_getPrice(Address.fromBytes(token.id));
  if (!priceResult.reverted) {
    const price = bigIntToBigDecimal(priceResult.value, INT_EIGHT);
    token.lastPriceBlockNumber = event.block.number;
    token.lastPriceUSD = price;
    token.save();
    return price;
  }
  log.error("Failed to get price for asset: {}, trying with price oracle", [
    token.id.toHex(),
  ]);
  return getUsdPricePerToken(Address.fromBytes(token.id)).usdPrice;
}

export function getUSDAmount(
  event: ethereum.Event,
  token: Token,
  amount: BigInt
): BigDecimal {
  const price = getTokenPrice(event, token);
  return bigIntToBigDecimal(amount, token.decimals).times(price);
}

export function getUnderlyingPrice(
  event: ethereum.Event,
  option: Option
): BigDecimal {
  if (event.block.number == option.lastPriceBlockNumber!) {
    return option.lastPriceUSD!;
  }
  const underlyingPrice = getTokenPrice(
    event,
    getOrCreateToken(Address.fromBytes(option.underlyingAsset))
  );
  const strikeAssetPrice = getTokenPrice(
    event,
    getOrCreateToken(Address.fromBytes(option.strikeAsset!))
  );
  const price = underlyingPrice.times(strikeAssetPrice);
  option.lastPriceBlockNumber = event.block.number;
  option.lastPriceUSD = price;
  option.save();
  return price;
}

export function getOptionValue(
  event: ethereum.Event,
  option: Option,
  amount: BigInt
): BigDecimal {
  return getUnderlyingPrice(event, option).times(
    bigIntToBigDecimal(amount, INT_EIGHT)
  );
}

export function getOptionExpiryPrice(
  event: ethereum.Event,
  option: Option
): BigDecimal {
  const oracle = Oracle.bind(
    NetworkConfigs.getOracleAddress(event.block.number.toI32())
  );
  const underlyingPrice = getExpiryPrice(
    oracle,
    option.underlyingAsset,
    option.expirationTimestamp!
  );
  const strikePrice = getExpiryPrice(
    oracle,
    option.strikeAsset!,
    option.expirationTimestamp!
  );
  return underlyingPrice.times(strikePrice);
}

function getExpiryPrice(
  oracle: Oracle,
  asset: Bytes,
  expirationTimestamp: BigInt
): BigDecimal {
  const result = oracle.getExpiryPrice(
    Address.fromBytes(asset),
    expirationTimestamp
  );
  return bigIntToBigDecimal(result.value0, INT_EIGHT);
}
