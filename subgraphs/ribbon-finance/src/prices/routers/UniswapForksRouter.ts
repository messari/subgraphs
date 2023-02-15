import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { UniswapPair as UniswapPairContract } from "../../../generated/templates/LiquidityGauge/UniswapPair";
import { UniswapRouter as UniswapRouterContract } from "../../../generated/templates/LiquidityGauge/UniswapRouter";

export function isLpToken(tokenAddress: Address, ethAddress: Address): bool {
  if (tokenAddress.equals(ethAddress)) return false;

  const lpToken = UniswapRouterContract.bind(tokenAddress);
  const isFactoryAvailable = utils.readValue(
    lpToken.try_factory(),
    constants.NULL.TYPE_ADDRESS
  );

  if (isFactoryAvailable.equals(constants.NULL.TYPE_ADDRESS)) return false;

  return true;
}

export function getTokenPriceUSDC(tokenAddress: Address): CustomPriceType {
  const config = utils.getConfig();
  if (!config) return new CustomPriceType();

  const ethAddress = config.ethAddress();
  const usdcAddress = config.usdcAddress();

  if (isLpToken(tokenAddress, ethAddress)) {
    return getLpTokenPriceUsdc(tokenAddress);
  }
  return getPriceFromRouterUSDC(tokenAddress, usdcAddress);
}

export function getPriceFromRouterUSDC(
  tokenAddress: Address,
  usdcAddress: Address
): CustomPriceType {
  return getPriceFromRouter(tokenAddress, usdcAddress);
}

export function getPriceFromRouter(
  token0Address: Address,
  token1Address: Address
): CustomPriceType {
  const config = utils.getConfig();

  const ethAddress = config.ethAddress();
  const wethAddress = config.wethAddress();

  // Construct swap path
  const path: Address[] = [];
  let numberOfJumps: BigInt;

  // Convert ETH address to WETH
  if (token0Address == ethAddress) token0Address = wethAddress;
  if (token1Address == ethAddress) token1Address = wethAddress;

  const inputTokenIsWeth: bool =
    token0Address.equals(wethAddress) || token1Address.equals(wethAddress);

  if (inputTokenIsWeth) {
    // Path = [token0, weth] or [weth, token1]
    numberOfJumps = BigInt.fromI32(1);

    path.push(token0Address);
    path.push(token1Address);
  } else {
    // Path = [token0, weth, token1]
    numberOfJumps = BigInt.fromI32(2);

    path.push(token0Address);
    path.push(wethAddress);
    path.push(token1Address);
  }

  const token0Decimals = utils.getTokenDecimals(token0Address);
  const amountIn = constants.BIGINT_TEN.pow(token0Decimals.toI32() as u8);

  const routerAddresses = config.uniswapForks();

  let amountOut = constants.BIGINT_ZERO;
  for (let idx = 0; idx < routerAddresses.length; idx++) {
    const routerAddress = routerAddresses.at(idx);

    const uniswapForkRouter = UniswapRouterContract.bind(routerAddress);
    const amountOutArray = uniswapForkRouter.try_getAmountsOut(amountIn, path);

    if (!amountOutArray.reverted) {
      amountOut = amountOutArray.value[amountOutArray.value.length - 1];
      break;
    }
  }

  const feeBips = BigInt.fromI32(30);

  const amountOutBigDecimal = amountOut
    .times(constants.BIGINT_TEN_THOUSAND)
    .div(constants.BIGINT_TEN_THOUSAND.minus(feeBips.times(numberOfJumps)))
    .toBigDecimal();

  return CustomPriceType.initialize(
    amountOutBigDecimal,
    config.usdcTokenDecimals().toI32() as u8
  );
}

export function getLpTokenPriceUsdc(tokenAddress: Address): CustomPriceType {
  const uniSwapPair = UniswapPairContract.bind(tokenAddress);

  const totalLiquidity: CustomPriceType =
    getLpTokenTotalLiquidityUsdc(tokenAddress);
  const totalSupply = utils.readValue<BigInt>(
    uniSwapPair.try_totalSupply(),
    constants.BIGINT_ZERO
  );
  if (totalSupply == constants.BIGINT_ZERO || totalLiquidity.reverted) {
    return new CustomPriceType();
  }

  let pairDecimals: number;
  const pairDecimalsCall = uniSwapPair.try_decimals();

  if (pairDecimalsCall.reverted) {
    log.warning(
      "[UniswapForksRouter] Failed to fetch pair decimals, tokenAddress: {}",
      [tokenAddress.toHexString()]
    );

    return new CustomPriceType();
  } else {
    pairDecimals = pairDecimalsCall.value;
  }

  const pricePerLpTokenUsdc = totalLiquidity.usdPrice
    .times(constants.BIGINT_TEN.pow(pairDecimals as u8).toBigDecimal())
    .div(totalSupply.toBigDecimal());

  return CustomPriceType.initialize(
    pricePerLpTokenUsdc,
    constants.DEFAULT_USDC_DECIMALS
  );
}

export function getLpTokenTotalLiquidityUsdc(
  tokenAddress: Address
): CustomPriceType {
  const uniSwapPair = UniswapPairContract.bind(tokenAddress);

  const token0Address = utils.readValue<Address>(
    uniSwapPair.try_token0(),
    constants.NULL.TYPE_ADDRESS
  );
  const token1Address = utils.readValue<Address>(
    uniSwapPair.try_token1(),
    constants.NULL.TYPE_ADDRESS
  );

  if (
    token0Address.equals(constants.NULL.TYPE_ADDRESS) ||
    token1Address.equals(constants.NULL.TYPE_ADDRESS)
  ) {
    return new CustomPriceType();
  }

  const token0Decimals = utils.getTokenDecimals(token0Address);
  const token1Decimals = utils.getTokenDecimals(token1Address);

  const reservesCall = uniSwapPair.try_getReserves();

  if (reservesCall.reverted) return new CustomPriceType();

  const token0Price = getTokenPriceUSDC(token0Address);
  const token1Price = getTokenPriceUSDC(token1Address);

  if (token0Price.reverted || token1Price.reverted) {
    return new CustomPriceType();
  }

  const reserves = reservesCall.value;
  const reserve0 = reserves.value0;
  const reserve1 = reserves.value1;

  if (
    reserve0.notEqual(constants.BIGINT_ZERO) ||
    reserve1.notEqual(constants.BIGINT_ZERO)
  ) {
    const liquidity0 = reserve0
      .div(constants.BIGINT_TEN.pow(token0Decimals.toI32() as u8))
      .toBigDecimal()
      .times(token0Price.usdPrice);

    const liquidity1 = reserve1
      .div(constants.BIGINT_TEN.pow(token1Decimals.toI32() as u8))
      .toBigDecimal()
      .times(token1Price.usdPrice);

    const totalLiquidity = liquidity0.plus(liquidity1);

    return CustomPriceType.initialize(
      totalLiquidity,
      constants.DEFAULT_USDC_DECIMALS
    );
  }
  return new CustomPriceType();
}
