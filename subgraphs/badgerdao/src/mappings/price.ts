import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { Token, Vault } from "../../generated/schema";
import { BIGINT_TEN, DEFAULT_DECIMALS } from "../constant";
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

export function getOrUpdateTokenPrice(
  vault: Vault,
  token: Token,
  block: ethereum.Block,
): BigDecimal {
  // let lastPriceUSD = token.lastPriceUSD as BigDecimal;
  // let lastPriceBlockNumber = token.lastPriceBlockNumber as BigInt;

  // if (lastPriceUSD.notEqual(BIGDECIMAL_ZERO)) {
  //   if (lastPriceBlockNumber.equals(block.number)) {
  //     log.warning("[Oracle] from cache token {} tokenPrice {}", [
  //       token.id,
  //       lastPriceUSD.toString(),
  //     ]);
  //     return lastPriceUSD as BigDecimal;
  //   }
  // }

  // let tokenAddress = Address.fromString("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599")
  let fetchPrice = getUsdPricePerToken(Address.fromString(token.id));
  let inputTokenPrice = !fetchPrice.reverted
    ? fetchPrice.usdPrice.div(fetchPrice.decimalsBaseTen)
    : fetchPrice.usdPrice;

  log.warning("[FINAL_PRICE] vault {} price {} tokenAddr {} block {}", [
    vault.id,
    inputTokenPrice.toString(),
    token.id,
    block.number.toString(),
  ]);

  token.lastPriceBlockNumber = block.number;
  token.lastPriceUSD = inputTokenPrice;
  token.save();

  return inputTokenPrice;
}
