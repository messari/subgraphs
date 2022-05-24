import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import {
  SushiSwapPair as SushiSwapPairContract,
  SushiSwapPair__getReservesResult,
} from "../../../generated/bBadger/SushiSwapPair";
import { SushiSwapRouter as SushiSwapRouterContract } from "../../../generated/bBadger/SushiSwapRouter";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import * as utils from "../common/utils";

export function isLpToken(tokenAddress: Address, network: string): bool {
  if (tokenAddress.equals(constants.WHITELIST_TOKENS_MAP.get(network)!.get("ETH")!)) {
    return false;
  }

  const lpToken = SushiSwapPairContract.bind(tokenAddress);
  let isFactoryAvailable = utils.readValue(lpToken.try_factory(), constants.ZERO_ADDRESS);

  if (isFactoryAvailable.toHex() == constants.ZERO_ADDRESS_STRING) {
    return false;
  }

  return true;
}

export function getPriceUsdc(tokenAddress: Address, network: string): CustomPriceType {
  if (isLpToken(tokenAddress, network)) {
    log.warning("[SUSHI] is lp token {} ", [tokenAddress.toHex()]);
    return getLpTokenPriceUsdc(tokenAddress, network);
  }
  return getPriceFromRouterUsdc(tokenAddress, network);
}

export function getPriceFromRouterUsdc(tokenAddress: Address, network: string): CustomPriceType {
  return getPriceFromRouter(
    tokenAddress,
    constants.WHITELIST_TOKENS_MAP.get(network)!.get("USDC")!,
    network,
  );
}

export function getPriceFromRouter(
  token0Address: Address,
  token1Address: Address,
  network: string,
): CustomPriceType {
  let wethAddress = constants.SUSHISWAP_WETH_ADDRESS.get(network)!;
  let ethAddress = constants.WHITELIST_TOKENS_MAP.get(network)!.get("ETH")!;

  // Convert ETH address to WETH
  if (token0Address == ethAddress) {
    token0Address = wethAddress;
  }
  if (token1Address == ethAddress) {
    token1Address = wethAddress;
  }

  let path: Address[] = [];
  let numberOfJumps: BigInt;
  let inputTokenIsWeth: bool = token0Address == wethAddress || token1Address == wethAddress;

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
  let amountIn = constants.BIGINT_TEN.pow(token0Decimals.toI32() as u8);

  const routerAddresses = constants.SUSHISWAP_ROUTER_ADDRESS_MAP.get(network)!;

  let routerAddressV1 = routerAddresses.get("routerV1");
  let routerAddressV2 = routerAddresses.get("routerV2");

  let amountOutArray: ethereum.CallResult<BigInt[]>;

  if (routerAddressV1) {
    const sushiSwapRouterV1 = SushiSwapRouterContract.bind(routerAddressV1);
    amountOutArray = sushiSwapRouterV1.try_getAmountsOut(amountIn, path);
    if (amountOutArray.reverted && routerAddressV2) {
      const sushiSwapRouterV2 = SushiSwapRouterContract.bind(routerAddressV2);
      amountOutArray = sushiSwapRouterV2.try_getAmountsOut(amountIn, path);

      if (amountOutArray.reverted) {
        return new CustomPriceType();
      }
    }

    let amountOut = amountOutArray.value[amountOutArray.value.length - 1];
    let feeBips = BigInt.fromI32(30); // .3% per swap fees

    let amountOutBigDecimal = amountOut
      .times(constants.BIGINT_TEN_THOUSAND)
      .div(constants.BIGINT_TEN_THOUSAND.minus(feeBips.times(numberOfJumps)))
      .toBigDecimal();

    return CustomPriceType.initialize(amountOutBigDecimal, constants.DEFAULT_USDC_DECIMALS);
  }

  return new CustomPriceType();
}

export function getLpTokenPriceUsdc(tokenAddress: Address, network: string): CustomPriceType {
  const sushiswapPair = SushiSwapPairContract.bind(tokenAddress);

  let totalLiquidity: CustomPriceType = getLpTokenTotalLiquidityUsdc(tokenAddress, network);

  let totalSupply = utils.readValue<BigInt>(sushiswapPair.try_totalSupply(), constants.BIGINT_ZERO);
  if (totalSupply == constants.BIGINT_ZERO) {
    return new CustomPriceType();
  }

  let pairDecimals = utils.readValue<i32>(
    sushiswapPair.try_decimals(),
    constants.DEFAULT_DECIMALS.toI32() as u8,
  );

  let pricePerLpTokenUsdc = totalLiquidity.usdPrice
    .times(constants.BIGINT_TEN.pow(pairDecimals as u8).toBigDecimal())
    .div(totalSupply.toBigDecimal());

  log.warning("[SUSHI] lp token price usdc token {} price {}", [
    tokenAddress.toHex(),
    pricePerLpTokenUsdc.toString(),
  ]);

  return CustomPriceType.initialize(pricePerLpTokenUsdc, constants.DEFAULT_USDC_DECIMALS);
}

export function getLpTokenTotalLiquidityUsdc(
  tokenAddress: Address,
  network: string,
): CustomPriceType {
  const sushiSwapPair = SushiSwapPairContract.bind(tokenAddress);

  let wbtcAddress = constants.WHITELIST_TOKENS_MAP.get(network)!.get("WBTC")!;
  let token0Address = utils.readValue<Address>(sushiSwapPair.try_token0(), constants.ZERO_ADDRESS);
  let token1Address = utils.readValue<Address>(sushiSwapPair.try_token1(), constants.ZERO_ADDRESS);

  if (
    token0Address.toHex() == constants.ZERO_ADDRESS_STRING ||
    token1Address.toHex() == constants.ZERO_ADDRESS_STRING
  ) {
    return new CustomPriceType();
  }

  if (token1Address == Address.fromString("0xc4E15973E6fF2A35cC804c2CF9D2a1b817a8b40F")) {
    token1Address = wbtcAddress;
  }

  let token0Decimals = utils.getTokenDecimals(token0Address);
  let token1Decimals = utils.getTokenDecimals(token1Address);

  let reserves = utils.readValue<SushiSwapPair__getReservesResult>(
    sushiSwapPair.try_getReserves(),
    constants.SUSHISWAP_DEFAULT_RESERVE_CALL,
  );

  let token0Price = getPriceUsdc(token0Address, network);
  let token1Price = getPriceUsdc(token1Address, network);

  /**
    token0 0x2260fac5e5542a773aa44fbcfedf7c193bc2c599 
    token1 0xc4e15973e6ff2a35cc804c2cf9d2a1b817a8b40f 
    token0price 57225543954 
    token1price 0 
    token0revert false 
    token1revert true
   */
  log.warning(
    "[SUSHI] amount out token0 {} token1 {} token0price {} token1price {} token0revert {} token1revert {}",
    [
      token0Address.toHex(),
      token1Address.toHex(),
      token0Price.usdPrice.toString(),
      token1Price.usdPrice.toString(),
      token0Price.reverted.toString(),
      token1Price.reverted.toString(),
    ],
  );

  if (token0Price.reverted || token1Price.reverted) {
    return new CustomPriceType();
  }

  let reserve0 = reserves.value0;
  let reserve1 = reserves.value1;

  if (reserve0.notEqual(constants.BIGINT_ZERO) || reserve1.notEqual(constants.BIGINT_ZERO)) {
    let liquidity0 = reserve0
      .div(constants.BIGINT_TEN.pow(token0Decimals.toI32() as u8))
      .toBigDecimal()
      .times(token0Price.usdPrice);

    let liquidity1 = reserve1
      .div(constants.BIGINT_TEN.pow(token1Decimals.toI32() as u8))
      .toBigDecimal()
      .times(token1Price.usdPrice);

    let totalLiquidity = liquidity0.plus(liquidity1);

    return CustomPriceType.initialize(totalLiquidity, constants.DEFAULT_USDC_DECIMALS);
  }
  return new CustomPriceType();
}
