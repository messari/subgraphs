import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { Address, log, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { TraderJoeRouter as TraderJoeRouterContract } from "../../../generated/YakStrategyV2/TraderJoeRouter";
import { getTokenDecimals } from "../../common/utils";
import { ETH_ADDRESS, TRADERJOE_ROUTER_ADDRESS_V1, TRADERJOE_ROUTER_ADDRESS_V2, USDC_ADDRESS, WETH_ADDRESS } from "../config/avalanche";

export function getPriceUsdc(
  tokenAddress: Address,
): CustomPriceType {
  const usdc_address = USDC_ADDRESS;
  return getPriceFromRouter(tokenAddress, usdc_address);
}

export function getPriceFromRouter(
  token0Address: Address,
  token1Address: Address,
): CustomPriceType {
  let wethAddress = WETH_ADDRESS;
  let ethAddress = ETH_ADDRESS;

  // Convert ETH address to WETH
  if (token0Address == ethAddress) {
    token0Address = wethAddress;
  }
  if (token1Address == ethAddress) {
    token1Address = wethAddress;
  }

  let path: Address[] = [];
  let numberOfJumps: BigInt;
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

  let token0Decimals = getTokenDecimals(token0Address);
  let amountIn = constants.BIGINT_TEN.pow(token0Decimals.toI32() as u8);

  let routerAddressV1 = TRADERJOE_ROUTER_ADDRESS_V1;
  let routerAddressV2 = TRADERJOE_ROUTER_ADDRESS_V2;

  let amountOutArray: ethereum.CallResult<BigInt[]>;

  log.info("[TraderJoe Router]Calling: AmountIn: {} using path: {}!", [
    amountIn.toString(),
    path.map<string>((item) => item.toHexString()).toString(),
  ]);

  if (routerAddressV1) {
    const TraderJoeRouterV1 = TraderJoeRouterContract.bind(routerAddressV1);
    amountOutArray = TraderJoeRouterV1.try_getAmountsOut(amountIn, path);

    if (amountOutArray.reverted && routerAddressV2) {
      const TraderJoeRouterV2 = TraderJoeRouterContract.bind(routerAddressV2);
      amountOutArray = TraderJoeRouterV2.try_getAmountsOut(amountIn, path);

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

    return CustomPriceType.initialize(
      amountOutBigDecimal,
      constants.DEFAULT_USDC_DECIMALS
    );
  }

  return new CustomPriceType();
}
