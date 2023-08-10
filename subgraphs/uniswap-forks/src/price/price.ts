import { BigDecimal, ethereum, log } from "@graphprotocol/graph-ts/index";
import {
  getLiquidityPool,
  getLiquidityPoolAmounts,
  getOrCreateProtocol,
  getOrCreateToken,
  getOrCreateTokenWhitelist,
} from "../common/getters";
import {
  LiquidityPool,
  Token,
  _HelperStore,
  _LiquidityPoolAmount,
} from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGDECIMAL_ONE,
  BIGDECIMAL_TWO,
  BIGINT_ZERO,
  PRICE_CHANGE_BUFFER_LIMIT,
  BIGDECIMAL_TEN_BILLION,
  BIGDECIMAL_FIVE_PERCENT,
} from "../common/constants";
import {
  absBigDecimal,
  convertTokenToDecimal,
  safeDiv,
} from "../common/utils/utils";
import { NetworkConfigs } from "../../configurations/configure";

// Update the token price of the native token for the specific protocol/network (see network specific configs)
// Update the token by referencing the native token against pools with the reference token and a stable coin
// Estimate the price against the pool with the highest liquidity
export function getNativeTokenPriceInUSD(nativeToken: Token): BigDecimal {
  let nativeAmount = BIGDECIMAL_ZERO;
  let stableAmount = BIGDECIMAL_ZERO;
  // fetch average price of NATIVE_TOKEN_ADDRESS from STABLE_ORACLES
  for (let i = 0; i < NetworkConfigs.getStableOraclePools().length; i++) {
    const pool = _LiquidityPoolAmount.load(
      NetworkConfigs.getStableOraclePools()[i]
    );
    if (!pool) continue;
    if (pool.inputTokens[0] == NetworkConfigs.getReferenceToken()) {
      if (pool.inputTokenBalances[1] > stableAmount) {
        nativeAmount = pool.inputTokenBalances[0];
        stableAmount = pool.inputTokenBalances[1];
      }
    } else {
      if (pool.inputTokenBalances[0] > stableAmount) {
        nativeAmount = pool.inputTokenBalances[1];
        stableAmount = pool.inputTokenBalances[0];
      }
    }
  }
  nativeToken.lastPriceUSD = safeDiv(stableAmount, nativeAmount);
  nativeToken.save();
  return nativeToken.lastPriceUSD!;
}

/**
 * This derives the price of a token in USD using pools where it is paired with a whitelisted token and pair is above the minimum liquidity threshold (helps prevent bad pricing).
 * You can find the possible whitelisted tokens used for comparision in the network configuration typescript file.
 **/
export function findUSDPricePerToken(
  event: ethereum.Event,
  token: Token
): BigDecimal {
  if (token.id == NetworkConfigs.getReferenceToken()) {
    return getNativeTokenPriceInUSD(token);
  }
  const tokenWhitelist = getOrCreateTokenWhitelist(token.id);
  const whiteList = tokenWhitelist.whitelistPools;
  // for now just take USD from pool with greatest TVL
  // need to update this to actually detect best rate based on liquidity distribution
  let largestLiquidityWhitelistTokens = BIGDECIMAL_ZERO;
  let priceSoFar = BIGDECIMAL_ZERO;

  // hardcoded fix for incorrect rates
  // if whitelist includes token - get the safe price
  if (NetworkConfigs.getStableCoins().includes(token.id)) {
    priceSoFar = BIGDECIMAL_ONE;
  } else if (NetworkConfigs.getUntrackedTokens().includes(token.id)) {
    priceSoFar = BIGDECIMAL_ZERO;
  } else {
    for (let i = 0; i < whiteList.length; ++i) {
      const poolAddress = whiteList[i];
      const poolAmounts = getLiquidityPoolAmounts(poolAddress);
      const pool = getLiquidityPool(poolAddress, event.block.number);

      if (pool.outputTokenSupply!.gt(BIGINT_ZERO)) {
        const priceTokenIndex: i32 = get_token_index(pool, token);
        if (priceTokenIndex == -1) {
          continue;
        }
        const whitelistTokenIndex = 0 == priceTokenIndex ? 1 : 0;

        const whitelistToken = getOrCreateToken(
          event,
          pool.inputTokens[whitelistTokenIndex],
          false
        );
        const whitelistTokenLocked = poolAmounts.inputTokenBalances[
          whitelistTokenIndex
        ].times(whitelistToken.lastPriceUSD!);
        if (
          whitelistTokenLocked.gt(largestLiquidityWhitelistTokens) &&
          whitelistTokenLocked.gt(
            NetworkConfigs.getMinimumLiquidityThresholdTrackPrice()
          )
        ) {
          largestLiquidityWhitelistTokens = whitelistTokenLocked;
          // token1 per our token * nativeToken per token1

          const newPrice = safeDiv(
            poolAmounts.inputTokenBalances[whitelistTokenIndex],
            poolAmounts.inputTokenBalances[priceTokenIndex]
          ).times(whitelistToken.lastPriceUSD! as BigDecimal);

          if (isValidTVL(pool, token, newPrice)) {
            priceSoFar = newPrice;
          }
        }
      }
    }
  }

  // Buffer token pricings that would cause large spikes on the protocol level
  const protocol = getOrCreateProtocol();
  const tokenTVLDelta = absBigDecimal(
    priceSoFar
      .times(convertTokenToDecimal(token._totalSupply, token.decimals))
      .minus(token._totalValueLockedUSD)
  );
  const protocolTVLPercentageDelta = absBigDecimal(
    safeDiv(tokenTVLDelta, protocol.totalValueLockedUSD)
  );
  if (protocolTVLPercentageDelta.gt(BIGDECIMAL_FIVE_PERCENT)) {
    log.warning("Price too high for token: {} from pool: {}", [
      token.id,
      priceSoFar.toString(),
    ]);
    if (token._largeTVLImpactBuffer < PRICE_CHANGE_BUFFER_LIMIT) {
      token._largeTVLImpactBuffer += 1;
      token.save();
      return token.lastPriceUSD!;
    }
  }

  if (!token.lastPriceUSD || token.lastPriceUSD!.equals(BIGDECIMAL_ZERO)) {
    token.save();
    return priceSoFar;
  }

  // If priceSoFar 10x greater or less than token.lastPriceUSD, use token.lastPriceUSD
  // Increment buffer so that it allows large price jumps if seen repeatedly
  if (
    priceSoFar.gt(token.lastPriceUSD!.times(BIGDECIMAL_TWO)) ||
    priceSoFar.lt(token.lastPriceUSD!.div(BIGDECIMAL_TWO))
  ) {
    if (token._largePriceChangeBuffer < PRICE_CHANGE_BUFFER_LIMIT) {
      token._largePriceChangeBuffer += 1;
      token.save();
      return token.lastPriceUSD!;
    }
  }

  token._largePriceChangeBuffer = 0;
  token._largeTVLImpactBuffer = 0;

  token.save();
  return priceSoFar;
}

// Tried to return null from here and it did not
function get_token_index(pool: LiquidityPool, token: Token): i32 {
  if (pool.inputTokens[0] == token.id) {
    return 0;
  }
  if (pool.inputTokens[1] == token.id) {
    return 1;
  }
  return -1;
}

function isValidTVL(
  pool: LiquidityPool,
  token: Token,
  price: BigDecimal
): bool {
  const newTokenTotalValueLocked = convertTokenToDecimal(
    token._totalSupply,
    token.decimals
  ).times(price);

  // If price is too high, skip this pool
  if (newTokenTotalValueLocked.gt(BIGDECIMAL_TEN_BILLION)) {
    log.warning("Price too high for token: {} from pool: {}", [
      token.id,
      pool.id,
    ]);
    return false;
  }
  return true;
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD.
 * If both are, return average of two amounts
 * If neither is, return 0
 * Also, return the value of the valume for each token if it is contained in the whitelist
 */

export function getTrackedVolumeUSD(
  pool: _LiquidityPoolAmount,
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token
): BigDecimal[] {
  const price0USD = token0.lastPriceUSD!;
  const price1USD = token1.lastPriceUSD!;

  // dont count tracked volume on these pairs - usually rebass tokens
  if (NetworkConfigs.getUntrackedPairs().includes(pool.id)) {
    return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
  }

  const poolDeposits = _HelperStore.load(pool.id);
  if (poolDeposits == null)
    return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

  // if less than 5 LPs, require high minimum reserve amount amount or return 0
  // Updated from original subgraph. Number of deposits may not equal number of liquidity providers
  if (poolDeposits.valueInt < 5) {
    const reserve0USD = pool.inputTokenBalances[0].times(price0USD);
    const reserve1USD = pool.inputTokenBalances[1].times(price1USD);
    if (
      NetworkConfigs.getWhitelistTokens().includes(token0.id) &&
      NetworkConfigs.getWhitelistTokens().includes(token1.id)
    ) {
      if (
        reserve0USD
          .plus(reserve1USD)
          .lt(NetworkConfigs.getMinimumLiquidityThresholdTrackVolume())
      ) {
        return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
      }
    }
    if (
      NetworkConfigs.getWhitelistTokens().includes(token0.id) &&
      !NetworkConfigs.getWhitelistTokens().includes(token1.id)
    ) {
      if (
        reserve0USD
          .times(BIGDECIMAL_TWO)
          .lt(NetworkConfigs.getMinimumLiquidityThresholdTrackVolume())
      ) {
        return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
      }
    }
    if (
      !NetworkConfigs.getWhitelistTokens().includes(token0.id) &&
      NetworkConfigs.getWhitelistTokens().includes(token1.id)
    ) {
      if (
        reserve1USD
          .times(BIGDECIMAL_TWO)
          .lt(NetworkConfigs.getMinimumLiquidityThresholdTrackVolume())
      ) {
        return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
      }
    }
  }

  // both are whitelist tokens, return sum of both amounts
  if (
    NetworkConfigs.getWhitelistTokens().includes(token0.id) &&
    NetworkConfigs.getWhitelistTokens().includes(token1.id)
  ) {
    const token0ValueUSD = tokenAmount0.times(price0USD);
    const token1ValueUSD = tokenAmount1.times(price1USD);

    return [
      token0ValueUSD,
      token1ValueUSD,
      token0ValueUSD.plus(token1ValueUSD).div(BIGDECIMAL_TWO),
    ];
  }

  // take double value of the whitelisted token amount
  if (
    NetworkConfigs.getWhitelistTokens().includes(token0.id) &&
    !NetworkConfigs.getWhitelistTokens().includes(token1.id)
  ) {
    return [
      tokenAmount0.times(price0USD),
      tokenAmount0.times(price0USD),
      tokenAmount0.times(price0USD),
    ];
  }

  // take double value of the whitelisted token amount
  if (
    !NetworkConfigs.getWhitelistTokens().includes(token0.id) &&
    NetworkConfigs.getWhitelistTokens().includes(token1.id)
  ) {
    return [
      tokenAmount1.times(price1USD),
      tokenAmount1.times(price1USD),
      tokenAmount1.times(price1USD),
    ];
  }

  // neither token is on white list, tracked amount is 0
  return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
}
