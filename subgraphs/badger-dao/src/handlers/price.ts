import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { BadgerSett } from "../../generated/badger-wbtc/BadgerSett";
import { CalculationsCurve } from "../../generated/badger-wbtc/CalculationsCurve";
import { CalculationsSushi } from "../../generated/badger-wbtc/CalculationsSushi";
import {
  BIGINT_ZERO,
  ETH_MAINNET_CALCULATIONS_CURVE_ADDRESS,
  ETH_MAINNET_CALCULATIONS_SUSHI_ADDRESS,
  USDC_DENOMINATOR,
} from "../constant";
import { readValue } from "../utils/contracts";

export function getUsdPriceOfToken(tokenAddress: Address): BigDecimal {
  const curveContract = CalculationsCurve.bind(Address.fromString(ETH_MAINNET_CALCULATIONS_CURVE_ADDRESS));

  let tokenPrice = BIGINT_ZERO;

  let isLpToken = readValue<bool>(curveContract.try_isCurveLpToken(tokenAddress), false);
  if (isLpToken) {
    tokenPrice = readValue<BigInt>(curveContract.try_getCurvePriceUsdc(tokenAddress), BIGINT_ZERO);
  } else {
    const sushiContract = CalculationsSushi.bind(Address.fromString(ETH_MAINNET_CALCULATIONS_SUSHI_ADDRESS));
    tokenPrice = readValue<BigInt>(sushiContract.try_getPriceUsdc(tokenAddress), BIGINT_ZERO);
  }

  return tokenPrice.toBigDecimal().div(USDC_DENOMINATOR.toBigDecimal());
}

export function getVirtualPriceOfCurveLpToken(tokenAddress: Address, _decimals: BigInt): BigInt {
  const curveContract = CalculationsCurve.bind(Address.fromString(ETH_MAINNET_CALCULATIONS_CURVE_ADDRESS));

  let tokenPrice = BIGINT_ZERO;
  let isLpToken = readValue<bool>(curveContract.try_isCurveLpToken(tokenAddress), false);

  if (isLpToken) {
    tokenPrice = readValue<BigInt>(curveContract.try_getVirtualPrice(tokenAddress), BIGINT_ZERO);
  }

  return tokenPrice.div(_decimals);
}

export function getPriceOfStakedTokens(vaultAddress: Address, tokenAddress: Address, _decimals: BigInt): BigInt {
  const vaultContract = BadgerSett.bind(vaultAddress);

  let pricePerShare = readValue<BigInt>(vaultContract.try_getPricePerFullShare(), BIGINT_ZERO);
  let virtualPrice = getVirtualPriceOfCurveLpToken(tokenAddress, _decimals);

  return pricePerShare.div(_decimals).times(virtualPrice);
}
