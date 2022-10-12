import * as utils from "../common/utils";
import { getUsdPricePerToken } from "..";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { BigInt, Address, BigDecimal, log } from "@graphprotocol/graph-ts";
import { CurveRegistry as CurveRegistryContract } from "../../../generated/Vault/CurveRegistry";

export function getCurvePriceUsdc(
  curveLpTokenAddress: Address,
  network: string
): CustomPriceType {
  let config = utils.getConfig();
  if (!config) return new CustomPriceType();

  let price = constants.BIGDECIMAL_ZERO;
  const curveRegistryAdresses = config.curveRegistry();

  for (let idx = 0; idx < curveRegistryAdresses.length; idx++) {
    let curveRegistry = curveRegistryAdresses[idx];

    let curveRegistryContract = CurveRegistryContract.bind(curveRegistry);

    let virtualPrice = getVirtualPrice(
      curveLpTokenAddress,
      curveRegistryContract
    );

    if (virtualPrice.equals(constants.BIGDECIMAL_ZERO)) continue;

    price = virtualPrice.div(
      constants.BIGINT_TEN.pow(
        constants.DEFAULT_DECIMALS.toI32() as u8
      ).toBigDecimal()
    );

    let basePrice = getBasePrice(curveLpTokenAddress, curveRegistryContract);
    if (basePrice.reverted) continue;

    return CustomPriceType.initialize(
      price.times(basePrice.usdPrice),
      basePrice.decimals
    );
  }

  return new CustomPriceType();
}

export function getPoolFromLpToken(
  lpAddress: Address,
  curveRegistry: CurveRegistryContract
): Address {
  let poolAddress = utils.readValue<Address>(
    curveRegistry.try_get_pool_from_lp_token(lpAddress),
    constants.NULL.TYPE_ADDRESS
  );

  return poolAddress;
}

export function getBasePrice(
  curveLpTokenAddress: Address,
  curveRegistry: CurveRegistryContract
): CustomPriceType {
  const poolAddress = getPoolFromLpToken(curveLpTokenAddress, curveRegistry);

  if (poolAddress.equals(constants.NULL.TYPE_ADDRESS)) {
    return new CustomPriceType();
  }

  let underlyingCoinAddress = getUnderlyingCoinFromPool(
    poolAddress,
    curveRegistry
  );

  let basePrice = getPriceUsdcRecommended(underlyingCoinAddress);

  return basePrice;
}

export function getUnderlyingCoinFromPool(
  poolAddress: Address,
  curveRegistry: CurveRegistryContract
): Address {
  let coinsArray = curveRegistry.try_get_underlying_coins(poolAddress);

  let coins: Address[];

  if (coinsArray.reverted) {
    return constants.NULL.TYPE_ADDRESS;
  } else {
    coins = coinsArray.value;
  }

  //? Use first coin from pool and if that is empty (due to error) fall back to second coin
  let preferredCoinAddress = coins[0];
  if (preferredCoinAddress.equals(constants.NULL.TYPE_ADDRESS)) {
    preferredCoinAddress = coins[1];
  }

  return preferredCoinAddress;
}

export function getVirtualPrice(
  curveLpTokenAddress: Address,
  curveRegistry: CurveRegistryContract
): BigDecimal {
  let virtualPrice = utils
    .readValue<BigInt>(
      curveRegistry.try_get_virtual_price_from_lp_token(curveLpTokenAddress),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  return virtualPrice;
}

export function getPriceUsdcRecommended(
  tokenAddress: Address
): CustomPriceType {
  return getUsdPricePerToken(tokenAddress);
}
