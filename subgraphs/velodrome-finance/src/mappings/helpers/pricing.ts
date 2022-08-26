import { Address, BigDecimal, log } from "@graphprotocol/graph-ts";
import { _PoolPricingHelper } from "../../../generated/schema";
import { Swap } from "../../../generated/templates/Pair/Pair";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  USDC_ADDRESS,
  ZERO_ADDRESS,
} from "../../common/constants";
import { getLiquidityPool, getOrCreateToken } from "../../common/getters";
import { safeDiv } from "../../common/utils/numbers";

export function updatePoolPriceFromSwap(event: Swap): void {
  let pool = getLiquidityPool(event.address);
  let helper = _PoolPricingHelper.load(event.address.toHex())!;

  if (!helper.whitelisted) {
    return;
  }

  let token0 = getOrCreateToken(Address.fromString(pool.inputTokens[0]));
  let token1 = getOrCreateToken(Address.fromString(pool.inputTokens[1]));

  let token0IsBase = helper.baseTokenIndex == 0 ? true : false;

  let base = token0;
  let token = token1;
  let amountBaseIn = event.params.amount0In.toBigDecimal();
  let amountBaseOut = event.params.amount0Out.toBigDecimal();
  let amountTokenIn = event.params.amount1In.toBigDecimal();
  let amountTokenOut = event.params.amount1Out.toBigDecimal();

  if (!token0IsBase) {
    base = token1;
    token = token0;
    amountBaseIn = event.params.amount1In.toBigDecimal();
    amountBaseOut = event.params.amount1Out.toBigDecimal();
    amountTokenIn = event.params.amount0In.toBigDecimal();
    amountTokenOut = event.params.amount0Out.toBigDecimal();
  }

  if (event.block.number <= token.lastPriceBlockNumber!) {
    return;
  }

  if (
    event.params.amount0In > BIGINT_ZERO &&
    event.params.amount1Out > BIGINT_ZERO
  ) {
    // Swap is from token0 to token1
    helper.priceTokenInBase = token0IsBase
      ? amountTokenOut.div(amountBaseIn)   //  Base In -> Token Out swap
      : amountTokenIn.div(amountBaseOut);  //  Token In -> Base Out swap
  } else if (
    event.params.amount1In > BIGINT_ZERO &&
    event.params.amount0Out > BIGINT_ZERO
  ) {
    // Swap is from token1 to token0
    helper.priceTokenInBase = token0IsBase
      ? amountTokenIn.div(amountBaseOut)   // Token In -> Base Out swap
      : amountTokenOut.div(amountBaseIn);  // Base In -> Token Out swap
  } else {
    log.warning("Could not identify swap direction for tx: {}, log Index: {}", [
      event.transaction.hash.toHex(),
      event.logIndex.toString(),
    ]);
  }
  helper.save();

  if (event.block.number > token.lastPriceBlockNumber!) {
    token.lastPriceUSD = helper.priceTokenInBase.times(
      getBaseTokenRateInUSDC(event.address)
    );
    token.lastPriceBlockNumber = event.block.number;
    token.save();
  }
}

let USDC_DECIMAL_FACTOR = 10 ** 6;

export function getBaseTokenRateInUSDC(poolAddress: Address): BigDecimal {
  let rate = BIGDECIMAL_ZERO;
  let helper = _PoolPricingHelper.load(poolAddress.toHex());
  if (helper != null) {
    if (helper.baseToken == ZERO_ADDRESS) {
      rate = BIGDECIMAL_ZERO;
    } else if (helper.baseToken == USDC_ADDRESS) {
      rate = BIGDECIMAL_ONE;
    } else {
      rate = BIGDECIMAL_ONE;
      for (let i = 0; i < helper.usdPath.length; i++) {
        let intermediateRate = getExchangeRate(
          Address.fromString(helper.usdPath[i]),
          helper.usdPathBaseTokenIndex[i]
        );
        rate = rate.times(intermediateRate);
      }
    }
  }
  // After conversions the rate will always be in USDC, which has 6 decimals
  return rate.div(
    BigDecimal.fromString(USDC_DECIMAL_FACTOR.toString())
  ) as BigDecimal;
}

export function getExchangeRate(
  poolAddress: Address,
  baseTokenIndex: i32
): BigDecimal {
  let helper = _PoolPricingHelper.load(poolAddress.toHex())!;
  let rate = BIGDECIMAL_ZERO;
  if (baseTokenIndex == helper.baseTokenIndex) {
    rate = helper.priceTokenInBase;
  } else {
    rate = safeDiv(BIGDECIMAL_ONE, helper.priceTokenInBase)
  }

  return rate;
}

export function updateLPTokenPrice(poolAddress: Address): void {

}