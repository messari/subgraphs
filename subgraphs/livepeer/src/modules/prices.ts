import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { UniswapV3Pool } from "../../generated/BondingManager/UniswapV3Pool";

export function getEthPriceUsd(): BigDecimal {
  return getPriceForPair(constants.UNISWAP_V3_DAI_ETH_POOL_ADDRESS);
}

export function getLptPriceEth(): BigDecimal {
  return getPriceForPair(constants.UNISWAP_V3_LPT_ETH_POOL_ADDRESS);
}

export function getPriceForPair(address: Address): BigDecimal {
  let pricePair = constants.BIGDECIMAL_ZERO;

  const uniswapPool = UniswapV3Pool.bind(address);
  const slot0 = uniswapPool.try_slot0();
  if (!slot0.reverted) {
    const sqrtPriceX96 = slot0.value.value0;
    const prices = utils.sqrtPriceX96ToTokenPrices(
      sqrtPriceX96,
      constants.DEFAULT_DECIMALS,
      constants.DEFAULT_DECIMALS
    );
    pricePair = prices[1];
  }

  return pricePair;
}
