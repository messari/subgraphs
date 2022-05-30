import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { Token, Vault } from "../../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_TEN, BIGINT_ZERO, DEFAULT_DECIMALS } from "../constant";
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
  let tokenAddress = Address.fromString(token.id);
  let mHBTC = Address.fromString("0x48c59199Da51B7E30Ea200a74Ea07974e62C4bA7");
  let imbtc = Address.fromString("0x17d8CBB6Bce8cEE970a4027d1198F6700A7a6c24");

  if (tokenAddress == mHBTC || tokenAddress == imbtc) {
    tokenAddress = Address.fromString("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"); // wbtc
  }

  let fetchPrice = getUsdPricePerToken(tokenAddress);
  let inputTokenPrice = !fetchPrice.reverted
    ? fetchPrice.usdPrice.div(fetchPrice.decimalsBaseTen)
    : fetchPrice.usdPrice;

  log.warning("[FINAL_PRICE] vault {} price {} tokenAddr {} block {}", [
    vault.id,
    inputTokenPrice.toString(),
    token.id,
    block.number.toString(),
  ]);

  // to check when the actual price were caught
  if (token.lastPriceBlockNumber == BIGINT_ZERO && inputTokenPrice != BIGDECIMAL_ZERO) {
    token.lastPriceBlockNumber = block.number;
  }
  token.lastPriceUSD = inputTokenPrice;
  token.save();

  return inputTokenPrice;
}
