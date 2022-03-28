import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { BadgerSett } from "../../generated/VaultRegistry/BadgerSett";
import { CalculationsCurve } from "../../generated/VaultRegistry/CalculationsCurve";
import { CALCULATIONS_CURVE_ADDRESS } from "../constant";
import { readValue } from "../utils/contracts";

export function getPriceOfCurveLpToken(tokenAddress: Address, amount: BigInt, decimals: BigInt): BigInt {
  let curveContract = CalculationsCurve.bind(CALCULATIONS_CURVE_ADDRESS);
  let tokenPrice = BigInt.zero();

  let isBaseToken = readValue<bool>(curveContract.try_isBasicToken(tokenAddress), false);
  if (isBaseToken) {
    tokenPrice = readValue<BigInt>(curveContract.try_getPriceUsdc(tokenAddress), BigInt.zero());
  }

  log.debug("[BADGER] token price for curve lp base price usd for {} is {}", [
    tokenAddress.toHex(),
    tokenPrice.toString(),
  ]);

  let isCToken = readValue<bool>(curveContract.try_isCurveLpToken(tokenAddress), false);
  if (isCToken) {
    tokenPrice = readValue<BigInt>(curveContract.try_getCurvePriceUsdc(tokenAddress), BigInt.zero());
  }

  log.debug("[BADGER] token price for curve lp curve price usd for {} is {}", [
    tokenAddress.toHex(),
    tokenPrice.toString(),
  ]);

  return tokenPrice.times(amount).div(decimals);
}

export function getVirtualPriceOfCurveLpToken(tokenAddress: Address, _decimals: BigInt): BigInt {
  let curveContract = CalculationsCurve.bind(CALCULATIONS_CURVE_ADDRESS);
  let tokenPrice = BigInt.zero();

  let isCToken = readValue<bool>(curveContract.try_isCurveLpToken(tokenAddress), false);
  if (isCToken) {
    tokenPrice = readValue<BigInt>(curveContract.try_getVirtualPrice(tokenAddress), BigInt.zero());
  }

  log.debug("[BADGER] token virtual price for {} is {}", [tokenAddress.toHex(), tokenPrice.toString()]);

  return tokenPrice.div(_decimals);
}

export function getPriceOfStakedTokens(vaultAddress: Address, tokenAddress: Address, _decimals: BigInt): BigInt {
  let vaultContract = BadgerSett.bind(vaultAddress);

  let pricePerShare = readValue<BigInt>(vaultContract.try_getPricePerFullShare(), BigInt.zero());
  let virtualPrice = getVirtualPriceOfCurveLpToken(tokenAddress, _decimals);

  return pricePerShare.div(_decimals).times(virtualPrice);
}
