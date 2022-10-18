import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Exec } from "../../generated/euler/Exec";
import { BIGINT_ZERO, EXEC_PROXY_ADDRESS, UNISWAP_Q192, USDC_WETH_03_ADDRESS } from "./constants";
import { UniswapV3Pool } from "../../generated/euler/UniswapV3Pool";

export function getUnderlyingPrice(underlyingAddress: Address): BigInt {
  const exec = Exec.bind(Address.fromString(EXEC_PROXY_ADDRESS));
  const getPriceResult = exec.try_getPrice(underlyingAddress);

  if (getPriceResult.reverted) {
    return BIGINT_ZERO;
  }

  return getPriceResult.value.value0;
}

export function getEthPriceUsd(): BigDecimal {
  const uniPool = UniswapV3Pool.bind(Address.fromString(USDC_WETH_03_ADDRESS));

  const token0Decimals = BigDecimal.fromString("1e6"); // USDC 6 decimals
  const token1Decimals = BigDecimal.fromString("1e18"); // WETH 18 decimals

  const poolValue = uniPool.slot0().value0.toBigDecimal();
  const exchangeRate = poolValue.times(poolValue).div(UNISWAP_Q192).times(token0Decimals).div(token1Decimals);

  return exchangeRate;
}
