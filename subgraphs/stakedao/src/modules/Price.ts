import * as constants from "../common/constants";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Vault } from "../../generated/templates/Vault/Vault";
import { CalculationsCurve } from "../../generated/templates/Vault/CalculationsCurve";

export function getPriceOfCurveLpToken(tokenAddress: Address, _amount: BigInt): BigInt {
  const curveContract = CalculationsCurve.bind(
    Address.fromString(constants.ETH_MAINNET_CALCULATIONS_CURVE_ADDRESS)
  );

  let tokenPrice = constants.BIGINT_ZERO;
  let try_isLpToken = curveContract.try_isCurveLpToken(tokenAddress);
  
  let isLpToken = try_isLpToken.reverted
    ? false
    : try_isLpToken.value

  if (isLpToken) {
    let try_tokenPrice = curveContract.try_getCurvePriceUsdc(tokenAddress);

    tokenPrice = try_tokenPrice.reverted
      ? constants.BIGINT_ZERO
      : try_tokenPrice.value;
  }
  return tokenPrice.times(_amount);
}

export function getVirtualPriceOfCurveLpToken(tokenAddress: Address): BigInt {
  const curveContract = CalculationsCurve.bind(
    Address.fromString(constants.ETH_MAINNET_CALCULATIONS_CURVE_ADDRESS)
  );

  let tokenPrice = constants.BIGINT_ZERO;
  let isLpToken = curveContract.isCurveLpToken(tokenAddress);

  if (isLpToken) {
    let try_tokenPrice = curveContract.try_getVirtualPrice(tokenAddress);

    tokenPrice = try_tokenPrice.reverted
      ? constants.BIGINT_ZERO
      : try_tokenPrice.value;
  }
  return tokenPrice;
}

export function getPriceOfStakedTokens(
  vaultAddress: Address,
  tokenAddress: Address,
  _amount: BigInt
): BigInt {
  const vaultContract = Vault.bind(vaultAddress);

  let try_pricePerShare = vaultContract.try_getPricePerFullShare();

  let pricePerShare = try_pricePerShare.reverted
    ? constants.BIGINT_ZERO
    : try_pricePerShare.value;

  let virtualPrice = getVirtualPriceOfCurveLpToken(tokenAddress);

  return pricePerShare.times(virtualPrice).times(_amount);
}
