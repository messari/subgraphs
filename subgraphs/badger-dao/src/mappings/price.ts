import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { Token } from "../../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_TEN, DEFAULT_DECIMALS } from "../constant";
import { getUsdPricePerToken } from "../price";

export function getPriceOfStakeToken(
  inputTokenPrice: BigDecimal,
  pricePerShare: BigInt,
): BigDecimal {
  let decimals = BIGINT_TEN.pow(DEFAULT_DECIMALS as u8);

  return pricePerShare
    .toBigDecimal()
    .div(decimals.toBigDecimal())
    .times(inputTokenPrice);
}

export function getOrUpdateTokenPrice(token: Token, block: ethereum.Block): BigDecimal {
  let lastPriceUSD = token.lastPriceUSD as BigDecimal;
  let lastPriceBlockNumber = token.lastPriceBlockNumber as BigInt;

  if (lastPriceUSD.notEqual(BIGDECIMAL_ZERO)) {
    if (lastPriceBlockNumber.equals(block.number)) {
      log.warning("[Oracle] from cache token {} tokenPrice {}", [
        token.id,
        lastPriceUSD.toString(),
      ]);
      return lastPriceUSD as BigDecimal;
    }
  }

  let try_price = getUsdPricePerToken(Address.fromString(token.id), block);
  let inputTokenPrice = try_price.reverted
    ? try_price.usdPrice
    : try_price.usdPrice.div(try_price.decimals.toBigDecimal());

  token.lastPriceBlockNumber = block.number;
  token.lastPriceUSD = inputTokenPrice;
  token.save();

  return inputTokenPrice;
}
