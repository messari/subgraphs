import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
  log,
} from "@graphprotocol/graph-ts";

import { readValue } from "../common/utils";
import * as constants from "../common/constants";
import { getTokenPriceFromYearnLens } from "./YearnLens";
import { getTokenPriceFromChainLink } from "./Chainlink";
import { getTokenPriceFromSushiSwap } from "./SushiSwap";
import { getTokenPriceFromCalculationCurve } from "./CalculationCurve";
import { ERC20 as ERC20Contract } from "../../generated/Controller/ERC20";

export function getTokenDecimals(tokenAddr: Address): BigInt {
  const token = ERC20Contract.bind(tokenAddr);

  let decimals = readValue<BigInt>(
    token.try_decimals(),
    constants.DEFAULT_DECIMALS
  );

  return decimals;
}

export function getUsdPricePerToken(tokenAddr: Address): [BigDecimal, BigInt] {
  let netowrk = dataSource.network();

  // 1. YearnLens
  let yearnLensPrice = getTokenPriceFromYearnLens(tokenAddr, netowrk);
  if (yearnLensPrice.notEqual(constants.BIGDECIMAL_ZERO)) {
    return [yearnLensPrice, BigInt.fromI32(6)];
  }

  // 2. ChainLink
  let chainLinkPrice = getTokenPriceFromChainLink(tokenAddr, netowrk);
  if (chainLinkPrice.notEqual(constants.BIGDECIMAL_ZERO)) {
    return [chainLinkPrice, BigInt.fromI32(8)];
  }

  // 3. SushiSwap
  let sushiSwapPrice = getTokenPriceFromSushiSwap(tokenAddr, netowrk);
  if (sushiSwapPrice.notEqual(constants.BIGDECIMAL_ZERO)) {
    return [sushiSwapPrice, BigInt.fromI32(6)];
  }

  // 4. CalculationCurve
  let curvePrice = getTokenPriceFromCalculationCurve(tokenAddr, netowrk);
  if (curvePrice.notEqual(constants.BIGDECIMAL_ZERO)) {
    return [curvePrice, BigInt.fromI32(6)];
  }

  return [constants.BIGDECIMAL_ZERO, constants.BIGINT_ONE];
}

export function getUsdPrice(
  tokenAddr: Address,
  amount: BigInt,
  decimals?: null | BigInt
): BigDecimal {
  if (!decimals) {
    decimals = getTokenDecimals(tokenAddr);
  }

  decimals = BigInt.fromI32(10).pow(decimals.toI32());

  let usdPrice = getUsdPricePerToken(tokenAddr);
  let usdDenominator = BigInt.fromI32(10).pow(usdPrice[1].toI32());

  if (usdPrice[0].notEqual(constants.BIGDECIMAL_ZERO)) {
    return usdPrice[0]
      .times(amount.toBigDecimal())
      .div(decimals.toBigDecimal())
      .div(usdDenominator.toBigDecimal());
  }

  log.warning("[UsdPrice] Cannot Find USD Price of token: {}, Decimals: {}", [
    tokenAddr.toHexString(),
    decimals.toString(),
  ]);

  return constants.BIGDECIMAL_ZERO;
}
