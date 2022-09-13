import { BigDecimal } from "@graphprotocol/graph-ts/index";
import {
  getLiquidityPool,
  getLiquidityPoolAmounts,
  getOrCreateToken,
  getOrCreateTokenWhitelist,
} from "../common/getters";
import {
  Token,
  _HelperStore,
  _LiquidityPoolAmount,
} from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGDECIMAL_ONE,
  BIGDECIMAL_TWO,
  BIGINT_ZERO,
} from "../common/constants";
import { safeDiv } from "../common/utils/utils";
import { NetworkConfigs } from "../../configurations/configure";

// Update the token price of the native token for the specific protocol/network (see network specific configs)
// Update the token by referencing the native token against pools with the reference token and a stable coin
// Estimate the price against the pool with the highest liquidity
export function updateNativeTokenPriceInUSD(): Token {
  let nativeAmount = BIGDECIMAL_ZERO;
  let stableAmount = BIGDECIMAL_ZERO;
  let nativeToken = getOrCreateToken(NetworkConfigs.getReferenceToken());
  // fetch average price of NATIVE_TOKEN_ADDRESS from STABLE_ORACLES
  for (let i = 0; i < NetworkConfigs.getStableOraclePools().length; i++) {
    let pool = _LiquidityPoolAmount.load(
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
  return nativeToken;
}

/**
 * This derives the price of a token in USD using pools where it is paired with a whitelisted token and pair is above the minimum liquidity threshold (helps prevent bad pricing).
 * You can find the possible whitelisted tokens used for comparision in the network configuration typescript file.
 **/
export function findUSDPricePerToken(
  token: Token,
  nativeToken: Token
): BigDecimal {
  if (token.id == NetworkConfigs.getReferenceToken()) {
    return nativeToken.lastPriceUSD!;
  }
  let tokenWhitelist = getOrCreateTokenWhitelist(token.id);
  let whiteList = tokenWhitelist.whitelistPools;
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
      let poolAddress = whiteList[i];
      let poolAmounts = getLiquidityPoolAmounts(poolAddress);
      let pool = getLiquidityPool(poolAddress);

      if (pool.outputTokenSupply!.gt(BIGINT_ZERO)) {
        if (
          pool.inputTokens[0] == token.id &&
          pool.totalValueLockedUSD.gt(
            NetworkConfigs.getMinimumLiquidityThresholdTrackPrice()
          )
        ) {
          // whitelist token is token1
          let whitelistToken = getOrCreateToken(pool.inputTokens[1]);
          // get the derived NativeToken in pool
          let whitelistTokenLocked = poolAmounts.inputTokenBalances[1].times(
            whitelistToken.lastPriceUSD!
          );
          if (whitelistTokenLocked.gt(largestLiquidityWhitelistTokens)) {
            largestLiquidityWhitelistTokens = whitelistTokenLocked;
            // token1 per our token * nativeToken per token1
            priceSoFar = safeDiv(
              poolAmounts.inputTokenBalances[1],
              poolAmounts.inputTokenBalances[0]
            ).times(whitelistToken.lastPriceUSD! as BigDecimal);
          }
        }
        if (
          pool.inputTokens[1] == token.id &&
          pool.totalValueLockedUSD.gt(
            NetworkConfigs.getMinimumLiquidityThresholdTrackPrice()
          )
        ) {
          let whitelistToken = getOrCreateToken(pool.inputTokens[0]);
          // get the derived nativeToken in pool
          let whitelistTokenLocked = poolAmounts.inputTokenBalances[0].times(
            whitelistToken.lastPriceUSD!
          );
          if (whitelistTokenLocked.gt(largestLiquidityWhitelistTokens)) {
            largestLiquidityWhitelistTokens = whitelistTokenLocked;
            // token0 per our token * NativeToken per token0
            priceSoFar = safeDiv(
              poolAmounts.inputTokenBalances[0],
              poolAmounts.inputTokenBalances[1]
            ).times(whitelistToken.lastPriceUSD! as BigDecimal);
          }
        }
      }
    }
  }
  return priceSoFar; // nothing was found return 0
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
  let price0USD = token0.lastPriceUSD!;
  let price1USD = token1.lastPriceUSD!;

  // dont count tracked volume on these pairs - usually rebass tokens
  if (NetworkConfigs.getUntrackedPairs().includes(pool.id)) {
    return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
  }

  let poolDeposits = _HelperStore.load(pool.id);
  if (poolDeposits == null)
    return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

  // if less than 5 LPs, require high minimum reserve amount amount or return 0
  // Updated from original subgraph. Number of deposits may not equal number of liquidity providers
  if (poolDeposits.valueInt < 5) {
    let reserve0USD = pool.inputTokenBalances[0].times(price0USD);
    let reserve1USD = pool.inputTokenBalances[1].times(price1USD);
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
    let token0ValueUSD = tokenAmount0.times(price0USD);
    let token1ValueUSD = tokenAmount1.times(price1USD);

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
