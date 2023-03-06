import { Address, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { Token } from "../../../generated/schema";
import { TOKEN_PRICE_SOURCE_SKIPS } from "../../common/constants";
import { getOrCreateToken } from "../../common/getters";
import { bigIntToBigDecimal } from "../../common/utils/numbers";
import { getUsdPricePerToken } from "../../prices";

// Return combined USD token value of two tokens
export function getDualTokenUSD(
  token0Address: Address,
  token1Address: Address,
  amount0: BigInt,
  amount1: BigInt,
  blockNumber: BigInt
): BigDecimal {
  // Update token prices
  const amount0USD = getTokenValueUSD(token0Address, amount0, blockNumber);
  const amount1USD = getTokenValueUSD(token1Address, amount1, blockNumber);

  return amount0USD.plus(amount1USD);
}

export function getTokenValueUSD(
  tokenAddress: Address,
  amount: BigInt,
  blockNumber: BigInt
): BigDecimal {
  const token = updateTokenPrice(tokenAddress, blockNumber);
  const amountUSD = token.lastPriceUSD!.times(
    bigIntToBigDecimal(amount, token.decimals)
  );
  return amountUSD;
}

// Update token price and return token entity
export function updateTokenPrice(
  tokenAddress: Address,
  blockNumber: BigInt
): Token {
  const token = getOrCreateToken(tokenAddress);
  if (blockNumber > token.lastPriceBlockNumber!) {
    let priceSourceSkips = TOKEN_PRICE_SOURCE_SKIPS.get(tokenAddress);
    if (priceSourceSkips === null) {
      priceSourceSkips = [];
    }
    const fetchPrice = getUsdPricePerToken(tokenAddress, priceSourceSkips);
    token.lastPriceUSD = fetchPrice.usdPrice.div(fetchPrice.decimalsBaseTen);
    token.lastPriceBlockNumber = blockNumber;
    token.save();
  }
  return token;
}
