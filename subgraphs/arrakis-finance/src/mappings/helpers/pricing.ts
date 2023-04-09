import { Address, BigInt, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { Token } from "../../../generated/schema";
import {
  TOKEN_PRICE_SOURCE_SKIPS,
  THIRTY_MINUTES_IN_SECONDS,
} from "../../common/constants";
import { getOrCreateToken } from "../../common/getters";
import { bigIntToBigDecimal } from "../../common/utils/numbers";
import { getUsdPricePerToken } from "../../prices";

// Return combined USD token value of two tokens
export function getDualTokenUSD(
  token0Address: Address,
  token1Address: Address,
  amount0: BigInt,
  amount1: BigInt,
  block: ethereum.Block
): BigDecimal {
  // Update token prices
  const amount0USD = getTokenValueUSD(token0Address, amount0, block);
  const amount1USD = getTokenValueUSD(token1Address, amount1, block);

  return amount0USD.plus(amount1USD);
}

export function getTokenValueUSD(
  tokenAddress: Address,
  amount: BigInt,
  block: ethereum.Block
): BigDecimal {
  const token = updateTokenPrice(tokenAddress, block);
  const amountUSD = token.lastPriceUSD!.times(
    bigIntToBigDecimal(amount, token.decimals)
  );
  return amountUSD;
}

// Update token price and return token entity
export function updateTokenPrice(
  tokenAddress: Address,
  block: ethereum.Block
): Token {
  const token = getOrCreateToken(tokenAddress);
  if (
    block.timestamp > token._lastPriceTimestamp!.plus(THIRTY_MINUTES_IN_SECONDS)
  ) {
    let priceSourceSkips = TOKEN_PRICE_SOURCE_SKIPS.get(tokenAddress);
    if (priceSourceSkips === null) {
      priceSourceSkips = [];
    }
    const fetchPrice = getUsdPricePerToken(tokenAddress, priceSourceSkips);
    token.lastPriceUSD = fetchPrice.usdPrice.div(fetchPrice.decimalsBaseTen);
    token.lastPriceBlockNumber = block.number;
    token._lastPriceTimestamp = block.timestamp;
    token.save();
  }
  return token;
}
