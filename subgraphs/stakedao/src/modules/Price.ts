import * as constants from "../common/constants";
import { Vault } from "../../generated/templates/Vault/Vault";
import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { CalculationsSushi } from "../../generated/templates/Vault/CalculationsSushi";
import { CalculationsCurve } from "../../generated/templates/Vault/CalculationsCurve";

export function getUsdPriceOfToken(
  tokenAddress: Address,
): BigDecimal {
  const curveContract = CalculationsCurve.bind(
    Address.fromString(constants.ETH_MAINNET_CALCULATIONS_CURVE_ADDRESS)
  );

  let tokenPrice = constants.BIGINT_ZERO;
  let try_isLpToken = curveContract.try_isCurveLpToken(tokenAddress);

  let isLpToken = try_isLpToken.reverted ? false : try_isLpToken.value;

  if (isLpToken) {
    let try_tokenPrice = curveContract.try_getCurvePriceUsdc(tokenAddress);

    tokenPrice = try_tokenPrice.reverted
      ? constants.BIGINT_ZERO
      : try_tokenPrice.value;
  } else {
    const sushiContract = CalculationsSushi.bind(
      Address.fromString(constants.ETH_MAINNET_CALCULATIONS_SUSHI_ADDRESS)
    );

    let try_getPriceUsdc = sushiContract.try_getPriceUsdc(tokenAddress);

    tokenPrice = try_getPriceUsdc.reverted
      ? constants.BIGINT_ZERO
      : try_getPriceUsdc.value;
  }
  return tokenPrice.toBigDecimal().div(constants.USDC_DENOMINATOR.toBigDecimal());
}

export function getVirtualPriceOfCurveLpToken(
  tokenAddress: Address,
  _decimals: BigInt
): BigInt {
  const curveContract = CalculationsCurve.bind(
    Address.fromString(constants.ETH_MAINNET_CALCULATIONS_CURVE_ADDRESS)
  );

  let tokenPrice = constants.BIGINT_ZERO;
  let try_isLpToken = curveContract.try_isCurveLpToken(tokenAddress);
  let isLpToken = try_isLpToken.reverted ? false : try_isLpToken.value;

  if (isLpToken) {
    let try_tokenPrice = curveContract.try_getVirtualPrice(tokenAddress);

    tokenPrice = try_tokenPrice.reverted
      ? constants.BIGINT_ZERO
      : try_tokenPrice.value;
  }
  return tokenPrice.div(_decimals);
}

export function getPriceOfStakedTokens(
  vaultAddress: Address,
  tokenAddress: Address,
  _decimals: BigInt
): BigInt {
  const vaultContract = Vault.bind(vaultAddress);

  let try_pricePerShare = vaultContract.try_getPricePerFullShare();

  let pricePerShare = try_pricePerShare.reverted
    ? constants.BIGINT_ZERO
    : try_pricePerShare.value;

  let virtualPrice = getVirtualPriceOfCurveLpToken(tokenAddress, _decimals);

  return pricePerShare.div(_decimals).times(virtualPrice);
}
