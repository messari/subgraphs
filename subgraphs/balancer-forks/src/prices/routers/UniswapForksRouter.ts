import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { UniswapPair as UniswapPairContract } from "../../../generated/Vault/UniswapPair";
import { UniswapRouter as UniswapRouterContract } from "../../../generated/Vault/UniswapRouter";

export function isLpToken(tokenAddress: Address, ethAddress: Address): bool {
  if (tokenAddress.equals(ethAddress)) return false;

  const lpToken = UniswapRouterContract.bind(tokenAddress);
  let isFactoryAvailable = utils.readValue(
    lpToken.try_factory(),
    constants.NULL.TYPE_ADDRESS
  );

  if (isFactoryAvailable.equals(constants.NULL.TYPE_ADDRESS)) return false;

  return true;
}

export function getTokenPriceUSDC(
  tokenAddress: Address,
  network: string
): CustomPriceType {
  let config = utils.getConfig();
  if (!config) return new CustomPriceType();

  let ethAddress = config.ethAddress();
  let usdcAddress = config.usdcAddress();

  if (isLpToken(tokenAddress, ethAddress)) {
    return getLpTokenPriceUsdc(tokenAddress, network);
  }
  return getPriceFromRouterUSDC(tokenAddress, usdcAddress, network);
}

export function getPriceFromRouterUSDC(
  tokenAddress: Address,
  usdcAddress: Address,
  network: string
): CustomPriceType {
  return getPriceFromRouter(tokenAddress, usdcAddress, network);
}

export function getPriceFromRouter(
  token0Address: Address,
  token1Address: Address,
  network: string
): CustomPriceType {
  let config = utils.getConfig();

  let ethAddress = config.ethAddress();
  let wethAddress = config.wethAddress();

  // Construct swap path
  let path: Address[] = [];
  let numberOfJumps: BigInt;

  // Convert ETH address to WETH
  if (token0Address == ethAddress) {
    token0Address = wethAddress;
  }
  if (token1Address == ethAddress) {
    token1Address = wethAddress;
  }

  let inputTokenIsWeth: bool =
    token0Address == wethAddress || token1Address == wethAddress;

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

  let token0Decimals = utils.getTokenDecimals(token0Address);
  let amountIn = BigInt.fromI32(10).pow(token0Decimals.toI32() as u8);

  let routerAddresses = config.uniswapForks();

  let amountOut = constants.BIGINT_ZERO;
  for (let idx = 0; idx < routerAddresses.length; idx++) {
    let routerAddress = routerAddresses.at(idx);

    const uniswapForkRouter = UniswapRouterContract.bind(routerAddress);
    let amountOutArray = uniswapForkRouter.try_getAmountsOut(amountIn, path);

    if (!amountOutArray.reverted) {
      amountOut = amountOutArray.value[amountOutArray.value.length - 1];
    }
  }

  let feeBips = BigInt.fromI32(30);

  let amountOutBigDecimal = amountOut
    .times(constants.BIGINT_TEN_THOUSAND)
    .div(constants.BIGINT_TEN_THOUSAND.minus(feeBips.times(numberOfJumps)))
    .toBigDecimal();

  return CustomPriceType.initialize(
    amountOutBigDecimal,
    constants.DEFAULT_USDC_DECIMALS
  );
}

export function getLpTokenPriceUsdc(
  tokenAddress: Address,
  network: string
): CustomPriceType {
  const uniSwapPair = UniswapPairContract.bind(tokenAddress);

  let totalLiquidity: CustomPriceType = getLpTokenTotalLiquidityUsdc(
    tokenAddress,
    network
  );
  let totalSupply = utils.readValue<BigInt>(
    uniSwapPair.try_totalSupply(),
    constants.BIGINT_ZERO
  );
  if (totalSupply == constants.BIGINT_ZERO || totalLiquidity.reverted) {
    return new CustomPriceType();
  }

  let pairDecimals: number;
  let pairDecimalsCall = uniSwapPair.try_decimals();

  if (pairDecimalsCall.reverted) {
    pairDecimals = constants.DEFAULT_DECIMALS.toI32() as u8;
  } else {
    pairDecimals = pairDecimalsCall.value;
  }

  let pricePerLpTokenUsdc = totalLiquidity.usdPrice
    .times(constants.BIGINT_TEN.pow(pairDecimals as u8).toBigDecimal())
    .div(totalSupply.toBigDecimal());

  return CustomPriceType.initialize(
    pricePerLpTokenUsdc,
    constants.DEFAULT_USDC_DECIMALS
  );
}

export function getLpTokenTotalLiquidityUsdc(
  tokenAddress: Address,
  network: string
): CustomPriceType {
  const uniSwapPair = UniswapPairContract.bind(tokenAddress);

  let token0Address = utils.readValue<Address>(
    uniSwapPair.try_token0(),
    constants.NULL.TYPE_ADDRESS
  );
  let token1Address = utils.readValue<Address>(
    uniSwapPair.try_token1(),
    constants.NULL.TYPE_ADDRESS
  );

  if (
    token0Address.equals(constants.NULL.TYPE_ADDRESS) ||
    token1Address.equals(constants.NULL.TYPE_ADDRESS)
  ) {
    return new CustomPriceType();
  }

  let token0Decimals = utils.getTokenDecimals(token0Address);
  let token1Decimals = utils.getTokenDecimals(token1Address);

  let reservesCall = uniSwapPair.try_getReserves();

  if (reservesCall.reverted) return new CustomPriceType();

  let token0Price = getTokenPriceUSDC(token0Address, network);
  let token1Price = getTokenPriceUSDC(token1Address, network);

  if (token0Price.reverted || token1Price.reverted) {
    return new CustomPriceType();
  }

  let reserves = reservesCall.value;
  let reserve0 = reserves.value0;
  let reserve1 = reserves.value1;

  if (
    reserve0.notEqual(constants.BIGINT_ZERO) ||
    reserve1.notEqual(constants.BIGINT_ZERO)
  ) {
    let liquidity0 = reserve0
      .div(constants.BIGINT_TEN.pow(token0Decimals.toI32() as u8))
      .toBigDecimal()
      .times(token0Price.usdPrice);

    let liquidity1 = reserve1
      .div(constants.BIGINT_TEN.pow(token1Decimals.toI32() as u8))
      .toBigDecimal()
      .times(token1Price.usdPrice);

    let totalLiquidity = liquidity0.plus(liquidity1);

    return CustomPriceType.initialize(
      totalLiquidity,
      constants.DEFAULT_USDC_DECIMALS
    );
  }
  return new CustomPriceType();
}
