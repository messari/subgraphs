import {
  BigInt,
  Address,
  BigDecimal,
  dataSource,
} from "@graphprotocol/graph-ts";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { getPriceUsdc as getPriceUsdcSushi } from "./SushiSwapRouter";
import { CurveRegistry as CurveRegistryContract } from "../../../generated/rocketTokenRETH/CurveRegistry";
import { CurvePoolRegistry as CurvePoolRegistryContract } from "../../../generated/rocketTokenRETH/CurvePoolRegistry";

export function getCurvePriceUsdc(
  curveLpTokenAddress: Address,
  network: string
): CustomPriceType {
  const tokensMapping = constants.WHITELIST_TOKENS_MAP.get(network);

  const curveRegistry = CurveRegistryContract.bind(
    constants.CURVE_REGISTRY_ADDRESS_MAP.get(network)!
  );

  const basePrice = getBasePrice(curveLpTokenAddress, curveRegistry, network);
  const virtualPrice = getVirtualPrice(curveLpTokenAddress);

  const usdcDecimals = utils.getTokenDecimals(tokensMapping!.get("USDC")!);
  const decimalsAdjustment = constants.DEFAULT_DECIMALS.minus(usdcDecimals);

  const price = virtualPrice
    .times(basePrice.usdPrice)
    .times(
      constants.BIGINT_TEN.pow(decimalsAdjustment.toI32() as u8).toBigDecimal()
    )
    .div(
      constants.BIGINT_TEN.pow(
        decimalsAdjustment.plus(constants.DEFAULT_DECIMALS).toI32() as u8
      ).toBigDecimal()
    );

  return CustomPriceType.initialize(price, constants.DEFAULT_USDC_DECIMALS);
}

export function getPoolFromLpToken(
  lpAddress: Address,
  curveRegistry: CurveRegistryContract,
  network: string
): Address {
  let poolAddress = utils.readValue<Address>(
    curveRegistry.try_get_pool_from_lp_token(lpAddress),
    constants.ZERO_ADDRESS
  );

  if (poolAddress.toHex() == constants.ZERO_ADDRESS_STRING) {
    const curvePoolRegistry = CurvePoolRegistryContract.bind(
      constants.CURVE_POOL_REGISTRY_ADDRESS_MAP.get(network)!
    );

    poolAddress = utils.readValue<Address>(
      curvePoolRegistry.try_get_pool_from_lp_token(lpAddress),
      constants.ZERO_ADDRESS
    );
  }

  return poolAddress;
}

export function getBasePrice(
  curveLpTokenAddress: Address,
  curveRegistry: CurveRegistryContract,
  network: string
): CustomPriceType {
  const poolAddress = getPoolFromLpToken(
    curveLpTokenAddress,
    curveRegistry,
    network
  );

  if (poolAddress.toHex() == constants.ZERO_ADDRESS_STRING) {
    return new CustomPriceType();
  }

  const underlyingCoinAddress = getUnderlyingCoinFromPool(
    poolAddress,
    curveRegistry,
    network
  );

  const basePrice = getPriceUsdcRecommended(underlyingCoinAddress, network);

  return basePrice;
}

export function getUnderlyingCoinFromPool(
  poolAddress: Address,
  curveRegistry: CurveRegistryContract,
  network: string
): Address {
  const coinsArray = curveRegistry.try_get_underlying_coins(poolAddress);

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
  for (let coinIdx = 0; coinIdx < coins.length; coinIdx++) {
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
  const network = dataSource.network();
  const curveRegistry = CurveRegistryContract.bind(
    constants.CURVE_REGISTRY_ADDRESS_MAP.get(network)!
  );

  const virtualPrice = utils
    .readValue<BigInt>(
      curveRegistry.try_get_virtual_price_from_lp_token(curveLpTokenAddress),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  return virtualPrice;
}

export function getPriceUsdcRecommended(
  tokenAddress: Address,
  network: string
): CustomPriceType {
  return getPriceUsdcSushi(tokenAddress, network);
}

export function isBasicToken(tokenAddress: Address, network: string): bool {
  for (
    let basicTokenIdx = 0;
    basicTokenIdx < constants.WHITELIST_TOKENS_LIST.length;
    basicTokenIdx++
  ) {
    const basicTokenName = constants.WHITELIST_TOKENS_LIST[basicTokenIdx];
    const basicTokenAddress =
      constants.WHITELIST_TOKENS_MAP.get(network)!.get(basicTokenName);

    if (
      basicTokenAddress &&
      tokenAddress.toHex() == basicTokenAddress.toHex()
    ) {
      return true;
    }
  }
  return false;
}
