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
  let token0 = updateTokenPrice(token0Address, blockNumber);
  let token1 = updateTokenPrice(token1Address, blockNumber);

  let amount0Usd = token0.lastPriceUSD!.times(
    bigIntToBigDecimal(amount0, token0.decimals)
  );
  let amount1Usd = token1.lastPriceUSD!.times(
    bigIntToBigDecimal(amount1, token1.decimals)
  );

  return amount0Usd.plus(amount1Usd);
}

// Update token price and return token entity
export function updateTokenPrice(
  tokenAddress: Address,
  blockNumber: BigInt
): Token {
  let token = getOrCreateToken(tokenAddress);
  if (blockNumber > token.lastPriceBlockNumber!) {
    let priceSourceSkips = TOKEN_PRICE_SOURCE_SKIPS.get(tokenAddress);
    if (priceSourceSkips === null) {
      priceSourceSkips = [];
    }
    let fetchPrice = getUsdPricePerToken(tokenAddress, priceSourceSkips);
    token.lastPriceUSD = fetchPrice.usdPrice.div(fetchPrice.decimalsBaseTen);
    token.lastPriceBlockNumber = blockNumber;
    token.save();
  }
  return token;
}
