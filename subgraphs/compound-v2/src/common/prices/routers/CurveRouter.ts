import * as utils from "../common/utils";
import { getPriceUsdc } from "./SushiSwapRouter";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { Address, BigDecimal, BigInt, dataSource } from "@graphprotocol/graph-ts";
import { CurveRegistry as CurveRegistryContract } from "../../../../generated/Comptroller/CurveRegistry";

export function getCurvePriceUsdc(curveLpTokenAddress: Address, network: string): CustomPriceType {
  let tokensMapping = constants.WHITELIST_TOKENS_MAP.get(network);

  const curveRegistry = CurveRegistryContract.bind(constants.CURVE_REGISTRY_ADDRESS_MAP.get(network)!);

  let basePrice = getBasePrice(curveLpTokenAddress, curveRegistry, network);
  let virtualPrice = getVirtualPrice(curveLpTokenAddress);

  let usdcDecimals = utils.getTokenDecimals(tokensMapping!.get("USDC")!);
  let decimalsAdjustment = constants.DEFAULT_DECIMALS.minus(usdcDecimals);

  let price = virtualPrice
    .times(basePrice.usdPrice)
    .times(constants.BIGINT_TEN.pow(decimalsAdjustment.toI32() as u8).toBigDecimal())
    .div(constants.BIGINT_TEN.pow(decimalsAdjustment.plus(constants.DEFAULT_DECIMALS).toI32() as u8).toBigDecimal());

  return CustomPriceType.initialize(price);
}

export function getBasePrice(
  curveLpTokenAddress: Address,
  curveRegistry: CurveRegistryContract,
  network: string,
): CustomPriceType {
  const poolAddress = curveRegistry.try_get_pool_from_lp_token(curveLpTokenAddress);

  if (poolAddress.reverted) {
    return new CustomPriceType();
  }

  let underlyingCoinAddress = getUnderlyingCoinFromPool(poolAddress.value, curveRegistry, network);

  let basePrice = getPriceUsdcRecommended(underlyingCoinAddress, network);

  return basePrice;
}

export function getUnderlyingCoinFromPool(
  poolAddress: Address,
  curveRegistry: CurveRegistryContract,
  network: string,
): Address {
  let coinsArray = curveRegistry.try_get_underlying_coins(poolAddress);

  let coins: Address[];

  if (coinsArray.reverted) {
    return constants.ZERO_ADDRESS;
  } else {
    coins = coinsArray.value;
  }

  //? Use first coin from pool and if that is empty (due to error) fall back to second coin
  let preferredCoinAddress = coins[0];
  if (preferredCoinAddress.toHex() == constants.ZERO_ADDRESS_STRING) {
    preferredCoinAddress = coins[1];
  }

  //? Look for preferred coins (basic coins)

  let coinAddress: Address;
  for (let coinIdx = 0; coinIdx < 8; coinIdx++) {
    coinAddress = coins[coinIdx];

    if (coinAddress.toHex() == constants.ZERO_ADDRESS_STRING) {
      break;
    }

    if (isBasicToken(coinAddress, network)) {
      preferredCoinAddress = coinAddress;
      break;
    }
  }

  return preferredCoinAddress;
}

export function getVirtualPrice(curveLpTokenAddress: Address): BigDecimal {
  let network = dataSource.network();
  const curveRegistry = CurveRegistryContract.bind(constants.CURVE_REGISTRY_ADDRESS_MAP.get(network)!);

  let virtualPrice = utils
    .readValue<BigInt>(curveRegistry.try_get_virtual_price_from_lp_token(curveLpTokenAddress), constants.BIGINT_ZERO)
    .toBigDecimal();

  return virtualPrice;
}

export function getPriceUsdcRecommended(tokenAddress: Address, network: string): CustomPriceType {
  return getPriceUsdc(tokenAddress, network);
}

export function isBasicToken(tokenAddress: Address, network: string): bool {
  for (let basicTokenIdx = 0; basicTokenIdx < constants.WHITELIST_TOKENS_LIST.length; basicTokenIdx++) {
    let basicTokenName = constants.WHITELIST_TOKENS_LIST[basicTokenIdx];
    let basicTokenAddress = constants.WHITELIST_TOKENS_MAP.get(network)!.get(basicTokenName);

    if (tokenAddress.toHex() == basicTokenAddress!.toHex()) {
      return true;
    }
  }
  return false;
}
