import { log } from "@graphprotocol/graph-ts";

import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  SushiSwapPair as SushiSwapPairContract,
  SushiSwapPair__getReservesResult,
} from "../../../generated/Pool/SushiSwapPair";
import { SushiSwapRouter as SushiSwapRouterContract } from "../../../generated/Pool/SushiSwapRouter";

export function isLpToken(tokenAddress: Address, network: string): bool {
  if (tokenAddress == constants.WHITELIST_TOKENS_MAP.get(network)!.get("AVAX")!) {
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
  return getPriceFromRouterUsdc(tokenAddress, network);
}

export function getPriceFromRouterUsdc(tokenAddress: Address, network: string): CustomPriceType {
  return getPriceFromRouter(tokenAddress, constants.WHITELIST_TOKENS_MAP.get(network)!.get("USDC")!, network);
}

export function getPriceFromRouter(token0Address: Address, token1Address: Address, network: string): CustomPriceType {
  log.warning("getPriceFromRouter t0:{} t1:{} network:{}", [
    token0Address.toHexString(),
    token1Address.toHexString(),
    network,
  ]);

  let ethAddress = constants.WHITELIST_TOKENS_MAP.get(network)!.get("AVAX")!;
  let wethAddress = constants.WHITELIST_TOKENS_MAP.get(network)!.get("WAVAX")!;

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
  let routerAddressV2 = routerAddresses.get("routerV2");

  let amountOutArray: ethereum.CallResult<BigInt[]>;

  const path_string: string = path.map<string>(x => x.toHexString()).join("-");

  log.warning("sushiswap amountIn:{} path:{}", [amountIn.toString(), path_string]);

  if (routerAddressV2) {
    const sushiSwapRouterV2 = SushiSwapRouterContract.bind(routerAddressV2);

    amountOutArray = sushiSwapRouterV2.try_getAmountsOut(amountIn, path);
    log.warning("sushiswap r2:{} revert:{}", [
      routerAddressV2.toHexString(),
      amountOutArray.reverted.toString()
    ]);

    if (amountOutArray.reverted) {
      return new CustomPriceType();
    }

    let amountOut = amountOutArray.value[amountOutArray.value.length - 1];
    let feeBips = BigInt.fromI32(30); // .3% per swap fees

    let amountOutBigDecimal = amountOut
      .times(constants.BIGINT_TEN_THOUSAND)
      .div(constants.BIGINT_TEN_THOUSAND.minus(feeBips.times(numberOfJumps)))
      .toBigDecimal();

    return CustomPriceType.initialize(amountOutBigDecimal);
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

  let pairDecimals: number;
  let pairDecimalsCall = sushiswapPair.try_decimals();

  if (pairDecimalsCall.reverted) {
    pairDecimals = constants.DEFAULT_DECIMALS.toI32() as u8;
  } else {
    pairDecimals = pairDecimalsCall.value;
  }

  let pricePerLpTokenUsdc = totalLiquidity.usdPrice
    .times(constants.BIGINT_TEN.pow(pairDecimals as u8).toBigDecimal())
    .div(totalSupply.toBigDecimal());

  return CustomPriceType.initialize(pricePerLpTokenUsdc);
}

export function getLpTokenTotalLiquidityUsdc(tokenAddress: Address, network: string): CustomPriceType {
  const sushiSwapPair = SushiSwapPairContract.bind(tokenAddress);

  let token0Address = utils.readValue<Address>(sushiSwapPair.try_token0(), constants.ZERO_ADDRESS);
  let token1Address = utils.readValue<Address>(sushiSwapPair.try_token1(), constants.ZERO_ADDRESS);

  if (
    token0Address.toHex() == constants.ZERO_ADDRESS_STRING ||
    token1Address.toHex() == constants.ZERO_ADDRESS_STRING
  ) {
    return new CustomPriceType();
  }

  let token0Decimals = utils.getTokenDecimals(token0Address);
  let token1Decimals = utils.getTokenDecimals(token1Address);

  let reserves = utils.readValue<SushiSwapPair__getReservesResult>(
    sushiSwapPair.try_getReserves(),
    constants.SUSHISWAP_DEFAULT_RESERVE_CALL,
  );

  let token0Price = getPriceUsdc(token0Address, network);
  let token1Price = getPriceUsdc(token1Address, network);

  if (token0Price.reverted || token1Price.reverted) {
    return new CustomPriceType();
  }

  let reserve0 = reserves.value0;
  let reserve1 = reserves.value1;

  if (reserve0.notEqual(constants.BIGINT_ZERO) || reserve1.notEqual(constants.BIGINT_ZERO)) {
    let totalLiquidity = reserve0
      .div(constants.BIGINT_TEN.pow(token0Decimals.toI32() as u8))
      .toBigDecimal()
      .times(token0Price.usdPrice.div(constants.DEFAULT_USDC_DECIMALS.toBigDecimal()))
      .plus(
        reserve1
          .div(constants.BIGINT_TEN.pow(token1Decimals.toI32() as u8))
          .toBigDecimal()
          .times(token1Price.usdPrice.div(constants.DEFAULT_USDC_DECIMALS.toBigDecimal())),
      );

    return CustomPriceType.initialize(totalLiquidity);
  }
  return new CustomPriceType();
}
