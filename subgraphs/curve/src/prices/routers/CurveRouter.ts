import * as utils from "../common/utils";
import { getPriceUsdc } from "./SushiSwapRouter";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { Address, BigInt, dataSource } from "@graphprotocol/graph-ts";
import { CurveRegistry as CurveRegistryContract } from "../../../generated/MainRegistry/CurveRegistry";
import { AddressProvider } from "../../../generated/AddressProvider/AddressProvider";
import { CurveRegistryV2 } from "../../../generated/MainRegistry/CurveRegistryV2";
import { getTokenPriceFromCalculationAave } from "../calculations/CalculationsAAVE";
import { CurvePool } from "../../../generated/MainRegistry/CurvePool";

export function getCurveRegistryAddress(network: string): Address {
  const addressProvider = AddressProvider.bind(constants.CURVE_ADDRESS_PROVIDER_MAP.get(network)!);
  let registryAddressCall = addressProvider.try_get_registry();
  let registryAddress = registryAddressCall.reverted ? constants.ZERO_ADDRESS : registryAddressCall.value;
  return registryAddress
}

export function getAssetTypeConstant(curveLpTokenAddress: Address): i32 {
  let assetType = -1;
  if (constants.ASSET_TYPES.has(curveLpTokenAddress.toHexString().toLowerCase())){
    assetType = constants.ASSET_TYPES.get(curveLpTokenAddress.toHexString().toLowerCase());
  }
  return assetType
}

export function getAssetType(curveLpTokenAddress: Address, network:string): i32 {
  let curveRegistryAddress = getCurveRegistryAddress(network);
  let curveRegistryAssetType = CurveRegistryV2.bind(curveRegistryAddress);
  let poolAddress = curveRegistryAssetType.try_get_pool_from_lp_token(curveLpTokenAddress);
  if (poolAddress.reverted) {
    return getAssetTypeConstant(curveLpTokenAddress)
  }
  let assetType = curveRegistryAssetType.try_get_pool_asset_type(poolAddress.value)
  if (assetType.reverted) {
    return -1
  }
  return assetType.value.toI32();
}

export function getVirtualPriceDenominationToken(curveLpTokenAddress:Address, network: string): Address {
  let whitelist_tokens = constants.WHITELIST_TOKENS_MAP.get(network)!;
  let assetType = getAssetType(curveLpTokenAddress,network);
  if (assetType == -1) {
    return constants.ZERO_ADDRESS;
  }
  if (assetType == 0 || assetType == 4) {
    return whitelist_tokens.get("USDC")!;
  }
  if (assetType == 1) {
    return whitelist_tokens.get("WETH")!;
  }
  if (assetType == 2) {
    return whitelist_tokens.get("WBTC")!;
  }
  if (assetType == 3) {
    return whitelist_tokens.get("EURT")!;
  }
  return whitelist_tokens.get("USDC")!;
}


export function getCurvePriceUsdc(curveLpTokenAddress: Address, network: string): CustomPriceType {

  let tokensMapping = constants.WHITELIST_TOKENS_MAP.get(network);

  let curveRegistryAddress = getCurveRegistryAddress(network);
  const curveRegistry = CurveRegistryContract.bind(curveRegistryAddress);

  let basePrice = getBasePrice(curveLpTokenAddress, curveRegistry, network);
  if (basePrice.reverted) {
    return new CustomPriceType();
  }
  let virtualPrice = getVirtualPrice(curveLpTokenAddress);
  if (virtualPrice.reverted) {
    return new CustomPriceType();
  }
  let usdcDecimals = utils.getTokenDecimals(tokensMapping!.get("USDC")!);
  let decimalsAdjustment = constants.DEFAULT_DECIMALS.minus(usdcDecimals);

  let price = virtualPrice.usdPrice
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
    let underlyingCoinAddress = getVirtualPriceDenominationToken(curveLpTokenAddress, network);
    if (underlyingCoinAddress == constants.ZERO_ADDRESS) {
      return new CustomPriceType();
    }
    let basePrice = getPriceUsdcRecommended(underlyingCoinAddress, network);
    return basePrice;
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

export function getVirtualPrice(curveLpTokenAddress: Address): CustomPriceType {
  let network = dataSource.network();
  let curveRegistryAddress = getCurveRegistryAddress(network);
  const curveRegistry = CurveRegistryContract.bind(curveRegistryAddress);
  let virtualPriceCall = curveRegistry.try_get_virtual_price_from_lp_token(curveLpTokenAddress);
  if (virtualPriceCall.reverted) {
    if (constants.LP_TOKEN_POOL_MAP.has(curveLpTokenAddress.toHexString().toLowerCase())){
      let pool = constants.LP_TOKEN_POOL_MAP.get(curveLpTokenAddress.toHexString().toLowerCase());
      let curvePool = CurvePool.bind(pool);
      let virtualPrice = utils
      .readValue<BigInt>(curvePool.try_get_virtual_price(), constants.BIGINT_ZERO).toBigDecimal();
      return CustomPriceType.initialize(virtualPrice);
    }
    return new CustomPriceType();
  }
  return CustomPriceType.initialize(virtualPriceCall.value.toBigDecimal());
}

export function getPriceUsdcRecommended(tokenAddress: Address, network: string): CustomPriceType {
  let priceUSD = getTokenPriceFromCalculationAave(tokenAddress, network);
  if (!priceUSD.reverted || priceUSD.usdPrice !== constants.BIGDECIMAL_ZERO) {
    return priceUSD;
  }
  if (utils.isStableCoin(tokenAddress, network)) {
    return CustomPriceType.initialize(constants.BIGDECIMAL_ONE);
  }
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
