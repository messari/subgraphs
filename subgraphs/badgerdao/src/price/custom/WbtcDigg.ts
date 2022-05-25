import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { UniswapRouter as UniswapRouterContract } from "../../../generated/bimBTC/UniswapRouter";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";

export function getUsdPriceOfWbtcDiggToken(
  tokenAddress: Address,
  network: string,
): CustomPriceType {
  let routerAddressV1 = constants.UNISWAP_ROUTER_CONTRACT_ADDRESSES.get(network)!.get(
    "routerV1",
  ) as Address;

  let amountIn = BigInt.fromString("100000000"); // 0.1 digg
  let path = [
    tokenAddress,
    Address.fromString("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"), // WBTC
    Address.fromString("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"), // WETH
    Address.fromString("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"), // USDC
  ];

  const uniswapRouterV1 = UniswapRouterContract.bind(routerAddressV1);

  let amountOutArray = uniswapRouterV1.try_getAmountsOut(amountIn, path);
  if (!amountOutArray.reverted) {
    let amountOut = amountOutArray.value[amountOutArray.value.length - 1];
    let amountOutBigDecimal = amountOut.toBigDecimal();

    log.warning("[WBTCPRICE] amountOut {}", [amountOut.toString()]);
    return CustomPriceType.initialize(amountOutBigDecimal, 5);
  }

  return new CustomPriceType();
}
