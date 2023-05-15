import {
  Token,
  LiquidityPool as LiquidityPoolStore,
} from "../../generated/schema";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { getOrCreateToken } from "../common/initializers";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { AnswerUpdated } from "../../generated/templates/OffchainAggregator/AccessControlledOffchainAggregator";

export function handleAnswerUpdated(event: AnswerUpdated): void {
  let tokenAddress = constants.NULL.TYPE_ADDRESS;

  for (let i = 0; i < constants.assets.fxAggregators.length; i++) {
    if (event.address == constants.assets.fxAggregators[i]) {
      tokenAddress = constants.assets.fxAssets[i];
      break;
    }
  }
  if (tokenAddress == constants.NULL.TYPE_ADDRESS) return;

  const token = getOrCreateToken(tokenAddress, event.block);
  token.lastPriceUSD = event.params.current.divDecimal(
    constants.BIGINT_TEN.pow(8).toBigDecimal()
  );
  token.save();
}

export function isUSDStable(tokenAddress: Address): bool {
  return constants.USD_STABLE_ASSETS.includes(tokenAddress);
}

export function isPricingAsset(tokenAddress: Address): bool {
  return constants.PRICING_ASSETS.includes(tokenAddress);
}

export function valueInUSD(value: BigDecimal, asset: Token): BigDecimal {
  let usdValue = constants.BIGDECIMAL_ZERO;

  if (isUSDStable(Address.fromString(asset.id))) {
    usdValue = value;
  } else {
    if (asset.lastPriceUSD) usdValue = value.times(asset.lastPriceUSD!);
  }

  return usdValue;
}

export function swapValueInUSD(
  tokenInAddress: Address,
  tokenAmountIn: BigInt,
  tokenOutAddress: Address,
  tokenAmountOut: BigInt,
  block: ethereum.Block
): BigDecimal {
  const tokenIn = getOrCreateToken(tokenInAddress, block);
  const tokenOut = getOrCreateToken(tokenOutAddress, block);

  const tokenAmountInBD = tokenAmountIn.divDecimal(
    utils.exponentToBigDecimal(tokenIn.decimals)
  );
  const tokenAmountOutBD = tokenAmountOut.divDecimal(
    utils.exponentToBigDecimal(tokenOut.decimals)
  );

  let swapValueUSD = constants.BIGDECIMAL_ZERO;

  if (isUSDStable(tokenOutAddress)) {
    swapValueUSD = valueInUSD(tokenAmountOutBD, tokenOut);
  } else if (isUSDStable(tokenInAddress)) {
    swapValueUSD = valueInUSD(tokenAmountInBD, tokenIn);
  } else if (
    isPricingAsset(tokenInAddress) &&
    !isPricingAsset(tokenOutAddress)
  ) {
    swapValueUSD = valueInUSD(tokenAmountInBD, tokenIn);
  } else if (
    isPricingAsset(tokenOutAddress) &&
    !isPricingAsset(tokenInAddress)
  ) {
    swapValueUSD = valueInUSD(tokenAmountOutBD, tokenOut);
  } else {
    const tokenInSwapValueUSD = valueInUSD(tokenAmountInBD, tokenIn);
    const tokenOutSwapValueUSD = valueInUSD(tokenAmountOutBD, tokenOut);

    const denominator =
      tokenInSwapValueUSD.gt(constants.BIGDECIMAL_ZERO) &&
      tokenOutSwapValueUSD.gt(constants.BIGDECIMAL_ZERO)
        ? BigDecimal.fromString("2")
        : constants.BIGDECIMAL_ONE;

    swapValueUSD = tokenInSwapValueUSD
      .plus(tokenOutSwapValueUSD)
      .div(denominator);
  }

  return swapValueUSD;
}

export function updateTokenPrices(
  pool: LiquidityPoolStore,
  tokenInAddress: Address,
  tokenInAmount: BigInt,
  tokenOutAddress: Address,
  tokenOutAmount: BigInt,
  volumeUSD: BigDecimal,
  block: ethereum.Block
): void {
  if (!constants.USE_SWAP_BASED_PRICE_LIB) return;

  const tokenIn = getOrCreateToken(tokenInAddress, block);
  const tokenOut = getOrCreateToken(tokenOutAddress, block);

  const tokenInIndex = pool.inputTokens.indexOf(tokenInAddress.toHexString());
  const tokenOutIndex = pool.inputTokens.indexOf(tokenOutAddress.toHexString());

  if (
    tokenInIndex == -1 ||
    tokenOutIndex == -1 ||
    pool.inputTokenWeights.length < tokenInIndex ||
    pool.inputTokenWeights.length < tokenOutIndex
  )
    return;

  const tokenInWeight = pool.inputTokenWeights
    .at(tokenInIndex)
    .div(constants.BIGDECIMAL_HUNDRED);
  const tokenInSupply = pool.inputTokenBalances
    .at(tokenInIndex)
    .divDecimal(utils.exponentToBigDecimal(tokenIn.decimals));

  const tokenOutWeight = pool.inputTokenWeights
    .at(tokenOutIndex)
    .div(constants.BIGDECIMAL_HUNDRED);
  const tokenOutSupply = pool.inputTokenBalances
    .at(tokenOutIndex)
    .divDecimal(utils.exponentToBigDecimal(tokenOut.decimals));

  if (
    isPricingAsset(tokenInAddress) &&
    pool.totalValueLockedUSD.gt(constants.MIN_POOL_LIQUIDITY) &&
    volumeUSD.gt(constants.MIN_SWAP_VALUE_USD)
  ) {
    let tokenPriceUSD = constants.BIGDECIMAL_ZERO;

    if (
      tokenInWeight.notEqual(constants.BIGDECIMAL_ZERO) &&
      tokenOutWeight.notEqual(constants.BIGDECIMAL_ZERO) &&
      tokenOutSupply.notEqual(constants.BIGDECIMAL_ZERO)
    ) {
      tokenPriceUSD = tokenInSupply
        .div(tokenInWeight)
        .div(tokenOutSupply.div(tokenOutWeight));
    } else {
      tokenPriceUSD = tokenInAmount
        .divDecimal(utils.exponentToBigDecimal(tokenIn.decimals))
        .div(
          tokenOutAmount.divDecimal(
            utils.exponentToBigDecimal(tokenOut.decimals)
          )
        );
    }

    tokenOut.lastPriceUSD = valueInUSD(tokenPriceUSD, tokenIn);
    tokenOut.lastPriceBlockNumber = block.number;
    tokenOut.save();
  }

  if (
    isPricingAsset(tokenOutAddress) &&
    pool.totalValueLockedUSD.gt(constants.MIN_POOL_LIQUIDITY) &&
    volumeUSD.gt(constants.MIN_SWAP_VALUE_USD)
  ) {
    let tokenPriceUSD = constants.BIGDECIMAL_ZERO;

    if (
      tokenInWeight.notEqual(constants.BIGDECIMAL_ZERO) &&
      tokenOutWeight.notEqual(constants.BIGDECIMAL_ZERO) &&
      tokenInSupply.notEqual(constants.BIGDECIMAL_ZERO)
    ) {
      tokenPriceUSD = tokenOutSupply
        .div(tokenOutWeight)
        .div(tokenInSupply.div(tokenInWeight));
    } else {
      tokenPriceUSD = tokenOutAmount
        .divDecimal(utils.exponentToBigDecimal(tokenOut.decimals))
        .div(
          tokenInAmount.divDecimal(utils.exponentToBigDecimal(tokenIn.decimals))
        );
    }

    tokenIn.lastPriceUSD = valueInUSD(tokenPriceUSD, tokenOut);
    tokenIn.lastPriceBlockNumber = block.number;
    tokenIn.save();
  }
}
