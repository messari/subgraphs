import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";

import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  MINIMUM_LIQUIDITY_USD,
  USDC_ADDRESS,
  USDC_DECIMALS,
  ZERO_ADDRESS,
} from "../../common/constants";
import { getOrCreateToken } from "../../common/getters";
import { exponentToBigDecimal, safeDiv } from "../../common/utils/numbers";

import { LiquidityPool, _PoolPricingHelper } from "../../../generated/schema";

export function updatePoolPriceFromSwap(
  pool: LiquidityPool,
  amount0In: BigInt,
  amount0Out: BigInt,
  amount1In: BigInt,
  amount1Out: BigInt,
  event: ethereum.Event
): void {
  const helper = _PoolPricingHelper.load(event.address.toHex())!;

  if (!helper.whitelisted) {
    return;
  }

  if (pool.totalValueLockedUSD < MINIMUM_LIQUIDITY_USD) {
    return;
  }

  const token0 = getOrCreateToken(Address.fromString(pool.inputTokens[0]));
  const token1 = getOrCreateToken(Address.fromString(pool.inputTokens[1]));

  const token0IsBase = helper.baseTokenIndex == 0 ? true : false;

  let token = token1;
  let amountBaseIn = amount0In.toBigDecimal();
  let amountBaseOut = amount0Out.toBigDecimal();
  let amountTokenIn = amount1In.toBigDecimal();
  let amountTokenOut = amount1Out.toBigDecimal();

  if (!token0IsBase) {
    token = token0;
    amountBaseIn = amount1In.toBigDecimal();
    amountBaseOut = amount1Out.toBigDecimal();
    amountTokenIn = amount0In.toBigDecimal();
    amountTokenOut = amount0Out.toBigDecimal();
  }

  if (event.block.number <= token.lastPriceBlockNumber!) {
    return;
  }

  if (amount0In > BIGINT_ZERO && amount1Out > BIGINT_ZERO) {
    // Swap is from token0 to token1
    helper.priceTokenInBase = token0IsBase
      ? amountBaseIn.div(amountTokenOut) //  Base In -> Token Out swap
      : amountBaseOut.div(amountTokenIn); //  Token In -> Base Out swap
  } else if (amount1In > BIGINT_ZERO && amount0Out > BIGINT_ZERO) {
    // Swap is from token1 to token0
    helper.priceTokenInBase = token0IsBase
      ? amountBaseOut.div(amountTokenIn) // Token In -> Base Out swap
      : amountBaseIn.div(amountTokenOut); // Base In -> Token Out swap
  } else {
    log.warning("Could not identify swap direction for tx: {}, log Index: {}", [
      event.transaction.hash.toHex(),
      event.logIndex.toString(),
    ]);
  }
  helper.save();

  if (event.block.number > token.lastPriceBlockNumber!) {
    token.lastPriceUSD = helper.priceTokenInBase
      .times(getBaseTokenRateInUSDC(event.address))
      .times(exponentToBigDecimal(token.decimals))
      .div(exponentToBigDecimal(USDC_DECIMALS));
    token.lastPriceBlockNumber = event.block.number;
    token.save();
  }
}

export function getBaseTokenRateInUSDC(poolAddress: Address): BigDecimal {
  let rate = BIGDECIMAL_ZERO;
  const helper = _PoolPricingHelper.load(poolAddress.toHex());
  if (helper != null) {
    if (helper.baseToken == ZERO_ADDRESS) {
      rate = BIGDECIMAL_ZERO;
    } else if (helper.baseToken == USDC_ADDRESS) {
      rate = BIGDECIMAL_ONE;
    } else {
      rate = BIGDECIMAL_ONE;
      for (let i = 0; i < helper.usdPath.length; i++) {
        const intermediateRate = getExchangeRate(
          Address.fromString(helper.usdPath[i]),
          helper.usdPathBaseTokenIndex[i]
        );
        rate = rate.times(intermediateRate);
      }
    }
  }
  return rate;
}

export function getExchangeRate(
  poolAddress: Address,
  baseTokenIndex: i32
): BigDecimal {
  const helper = _PoolPricingHelper.load(poolAddress.toHex())!;
  let rate = BIGDECIMAL_ZERO;
  if (baseTokenIndex == helper.baseTokenIndex) {
    rate = helper.priceTokenInBase;
  } else {
    rate = safeDiv(BIGDECIMAL_ONE, helper.priceTokenInBase);
  }

  return rate;
}
