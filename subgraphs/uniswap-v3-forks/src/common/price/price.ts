import {
  _HelperStore,
  _LiquidityPoolAmount,
  Token,
  LiquidityPool,
} from "../../../generated/schema";
import { BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import {
  BIGDECIMAL_ZERO,
  BIGDECIMAL_ONE,
  BIGDECIMAL_TWO,
  INT_ONE,
  INT_ZERO,
  Q192,
  PRECISION,
  BIGDECIMAL_TEN_THOUSAND,
  PRICE_CHANGE_BUFFER_LIMIT,
  BIGDECIMAL_TEN_BILLION,
  BIGDECIMAL_FIVE_PERCENT,
} from "../constants";
import {
  absBigDecimal,
  convertTokenToDecimal,
  exponentToBigInt,
  safeDiv,
} from "../utils/utils";
import { NetworkConfigs } from "../../../configurations/configure";
import { getOrCreateToken, getOrCreateTokenWhitelist } from "../entities/token";
import { getLiquidityPool, getLiquidityPoolAmounts } from "../entities/pool";
import { getOrCreateProtocol } from "../entities/protocol";

// Divide numbers too large for floating point or BigDecimal

export function sqrtPriceX96ToTokenPrices(
  sqrtPriceX96: BigInt,
  token0: Token,
  token1: Token
): BigDecimal[] {
  const num = sqrtPriceX96.times(sqrtPriceX96);
  const denom = Q192;
  const price1 = num
    .times(PRECISION)
    .div(denom)
    .times(exponentToBigInt(token0.decimals))
    .div(exponentToBigInt(token1.decimals))
    .toBigDecimal()
    .div(PRECISION.toBigDecimal());

  const price0 = safeDiv(BIGDECIMAL_ONE, price1);

  return [price0, price1];
}

// Derived the price of the native token (Ethereum) using pools where it is paired with a stable coin.
export function getNativeTokenPriceInUSD(nativeToken: Token): BigDecimal {
  let stableAmount = BIGDECIMAL_ZERO;
  let tokenIndicator: i32;

  let largestPool = _LiquidityPoolAmount.load(
    NetworkConfigs.getStableOraclePools()[0]
  );

  if (largestPool == null) {
    log.warning("No STABLE_ORACLE_POOLS given", []);
    return nativeToken.lastPriceUSD!;
  }

  if (largestPool.inputTokens[INT_ZERO] == NetworkConfigs.getReferenceToken()) {
    tokenIndicator = INT_ONE;
  } else {
    tokenIndicator = INT_ZERO;
  }

  // fetch average price of NATIVE_TOKEN_ADDRESS from STABLE_ORACLES
  for (
    let i = INT_ZERO;
    i < NetworkConfigs.getStableOraclePools().length;
    i++
  ) {
    const pool = _LiquidityPoolAmount.load(
      NetworkConfigs.getStableOraclePools()[i]
    );
    if (!pool) continue;
    if (pool.inputTokens[INT_ZERO] == NetworkConfigs.getReferenceToken()) {
      if (pool.inputTokenBalances[INT_ONE] > stableAmount) {
        stableAmount = pool.inputTokenBalances[INT_ONE];
        largestPool = pool;
        tokenIndicator = INT_ONE;
      }
    } else {
      if (pool.inputTokenBalances[INT_ZERO] > stableAmount) {
        stableAmount = pool.inputTokenBalances[INT_ZERO];
        largestPool = pool;
        tokenIndicator = INT_ZERO;
      }
    }
  }

  if (
    stableAmount.gt(BIGDECIMAL_TEN_THOUSAND) &&
    largestPool.tokenPrices[tokenIndicator]
  ) {
    nativeToken.lastPriceUSD = largestPool.tokenPrices[tokenIndicator];
  }

  return nativeToken.lastPriceUSD!;
}

/**
 * This derives the price of a token in USD using pools where it is paired with a whitelisted token.
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
  let largestWhitelistTokenValue = BIGDECIMAL_ZERO;
  let priceSoFar = BIGDECIMAL_ZERO;

  // hardcoded fix for incorrect rates
  // if whitelist includes token - get the safe price
  if (NetworkConfigs.getStableCoins().includes(token.id)) {
    priceSoFar = BIGDECIMAL_ONE;
  } else if (NetworkConfigs.getUntrackedTokens().includes(token.id)) {
    priceSoFar = BIGDECIMAL_ZERO;
  } else {
    for (let i = 0; i < whiteList.length; ++i) {
      const poolAmounts = getLiquidityPoolAmounts(whiteList[i])!;
      const pool = getLiquidityPool(whiteList[i])!;

      if (pool.totalValueLockedUSD.gt(BIGDECIMAL_ZERO)) {
        const token_index: i32 = get_token_index(pool, token);
        if (token_index == -1) {
          log.critical("Token not found in pool", []);
          continue;
        }
        const whitelistTokenIndex = 0 == token_index ? 1 : 0;
        const whitelistToken = getOrCreateToken(
          event,
          pool.inputTokens[whitelistTokenIndex],
          false
        );
        const whitelistTokenValueLocked = poolAmounts.inputTokenBalances[
          whitelistTokenIndex
        ].times(whitelistToken.lastPriceUSD!);

        // Check if it meets criteria to update prices.
        if (
          whitelistTokenValueLocked.gt(largestWhitelistTokenValue) &&
          whitelistTokenValueLocked.gt(
            NetworkConfigs.getMinimumLiquidityThreshold()
          )
        ) {
          const newPriceSoFar = computePriceFromConvertedSqrtX96Ratio(
            pool,
            token,
            whitelistToken,
            poolAmounts.tokenPrices[whitelistTokenIndex]
          );
          if (!newPriceSoFar) {
            continue;
          }

          token._lastPricePool = pool.id;

          // Set new price and largest pool for pricing.
          largestWhitelistTokenValue = whitelistTokenValueLocked;
          priceSoFar = newPriceSoFar;
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
      token.id.toHexString(),
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

function computePriceFromConvertedSqrtX96Ratio(
  pool: LiquidityPool,
  tokenToBePriced: Token,
  whitelistToken: Token,
  convertedSqrtX96Ratio: BigDecimal
): BigDecimal | null {
  // Calculate new price of a token and TVL of token in this pool.
  const newPriceSoFar = convertedSqrtX96Ratio.times(
    whitelistToken.lastPriceUSD as BigDecimal
  );

  const newTokenTotalValueLocked = convertTokenToDecimal(
    tokenToBePriced._totalSupply,
    tokenToBePriced.decimals
  ).times(newPriceSoFar);

  // If price is too high, skip this pool
  if (newTokenTotalValueLocked.gt(BIGDECIMAL_TEN_BILLION)) {
    log.warning("Price too high for token: {} from pool: {}", [
      tokenToBePriced.id.toHexString(),
      pool.id.toHexString(),
    ]);
    return null;
  }

  return newPriceSoFar;
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD.
 * If both are, return average of two amounts
 * If neither is, return 0
 * Also, return the value of the valume for each token if it is contained in the whitelist
 */

export function getTrackedVolumeUSD(
  pool: LiquidityPool,
  tokens: Token[],
  amountsUSD: BigDecimal[]
): BigDecimal[] {
  // dont count tracked volume on these pairs - usually rebase tokens
  if (NetworkConfigs.getUntrackedPairs().includes(pool.id)) {
    return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
  }

  const poolDeposits = _HelperStore.load(pool.id);
  if (poolDeposits == null) return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

  // if less than 5 LPs, require high minimum reserve amount amount or return 0
  // Updated from original subgraph. Number of deposits may not equal number of liquidity providers
  if (poolDeposits.valueInt < 5) {
    const poolReservesUSD = [
      convertTokenToDecimal(
        pool.inputTokenBalances[INT_ZERO],
        tokens[INT_ZERO].decimals
      ).times(tokens[INT_ZERO].lastPriceUSD!),
      convertTokenToDecimal(
        pool.inputTokenBalances[INT_ONE],
        tokens[INT_ONE].decimals
      ).times(tokens[INT_ONE].lastPriceUSD!),
    ];
    if (
      NetworkConfigs.getWhitelistTokens().includes(tokens[INT_ZERO].id) &&
      NetworkConfigs.getWhitelistTokens().includes(tokens[INT_ONE].id)
    ) {
      if (
        poolReservesUSD[INT_ZERO].plus(poolReservesUSD[INT_ONE]).lt(
          NetworkConfigs.getMinimumLiquidityThreshold()
        )
      ) {
        return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
      }
    }
    if (
      NetworkConfigs.getWhitelistTokens().includes(tokens[INT_ZERO].id) &&
      !NetworkConfigs.getWhitelistTokens().includes(tokens[INT_ONE].id)
    ) {
      if (
        poolReservesUSD[INT_ZERO].times(BIGDECIMAL_TWO).lt(
          NetworkConfigs.getMinimumLiquidityThreshold()
        )
      ) {
        return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
      }
    }
    if (
      !NetworkConfigs.getWhitelistTokens().includes(tokens[INT_ZERO].id) &&
      NetworkConfigs.getWhitelistTokens().includes(tokens[INT_ONE].id)
    ) {
      if (
        poolReservesUSD[INT_ONE].times(BIGDECIMAL_TWO).lt(
          NetworkConfigs.getMinimumLiquidityThreshold()
        )
      ) {
        return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
      }
    }
  }

  // both are whitelist tokens, return sum of both amounts
  if (
    NetworkConfigs.getWhitelistTokens().includes(tokens[INT_ZERO].id) &&
    NetworkConfigs.getWhitelistTokens().includes(tokens[INT_ONE].id)
  ) {
    return [amountsUSD[INT_ZERO], amountsUSD[INT_ONE]];
  }

  // take double value of the whitelisted token amount
  if (
    NetworkConfigs.getWhitelistTokens().includes(tokens[INT_ZERO].id) &&
    !NetworkConfigs.getWhitelistTokens().includes(tokens[INT_ONE].id)
  ) {
    return [amountsUSD[INT_ZERO], amountsUSD[INT_ZERO]];
  }

  // take double value of the whitelisted token amount
  if (
    !NetworkConfigs.getWhitelistTokens().includes(tokens[INT_ZERO].id) &&
    NetworkConfigs.getWhitelistTokens().includes(tokens[INT_ONE].id)
  ) {
    return [amountsUSD[INT_ONE], amountsUSD[INT_ONE]];
  }

  // neither token is on white list, tracked amount is 0
  return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
}
