import * as utils from "../common/utils";
import { getUsdPricePerToken } from "..";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { BigInt, Address, BigDecimal } from "@graphprotocol/graph-ts";
import { _ERC20 } from "../../../generated/templates/PoolTemplate/_ERC20";
import { CurvePool as CurvePoolContract } from "../../../generated/templates/PoolTemplate/CurvePool";
import { CurveRegistry as CurveRegistryContract } from "../../../generated/templates/PoolTemplate/CurveRegistry";

export function isCurveLpToken(lpAddress: Address): bool {
  const poolAddress = getPoolFromLpToken(lpAddress);

  if (poolAddress.notEqual(constants.NULL.TYPE_ADDRESS)) return true;

  return false;
}

export function getPoolFromLpToken(lpAddress: Address): Address {
  const config = utils.getConfig();
  const curveRegistryAdresses = config.curveRegistry();

  for (let idx = 0; idx < curveRegistryAdresses.length; idx++) {
    const curveRegistryContract = CurveRegistryContract.bind(
      curveRegistryAdresses[idx]
    );

    const poolAddress = utils.readValue<Address>(
      curveRegistryContract.try_get_pool_from_lp_token(lpAddress),
      constants.NULL.TYPE_ADDRESS
    );

    if (poolAddress.notEqual(constants.NULL.TYPE_ADDRESS)) return poolAddress;
  }

  return constants.NULL.TYPE_ADDRESS;
}

export function isLpCryptoPool(lpAddress: Address): bool {
  const poolAddress = getPoolFromLpToken(lpAddress);

  if (poolAddress != constants.NULL.TYPE_ADDRESS) {
    return isPoolCryptoPool(poolAddress);
  }

  return false;
}

export function isPoolCryptoPool(poolAddress: Address): bool {
  const poolContract = CurvePoolContract.bind(poolAddress);

  const priceOracleCall = poolContract.try_price_oracle();
  if (!priceOracleCall.reverted) return true;

  const priceOracle1Call = poolContract.try_price_oracle1(
    constants.BIGINT_ZERO
  );
  if (!priceOracle1Call.reverted) return true;

  return false;
}

export function getCurvePriceUsdc(lpAddress: Address): CustomPriceType {
  if (isLpCryptoPool(lpAddress)) {
    return cryptoPoolLpPriceUsdc(lpAddress);
  }

  const basePrice = getBasePrice(lpAddress);
  const virtualPrice = getVirtualPrice(lpAddress).toBigDecimal();

  const config = utils.getConfig();
  const usdcTokenDecimals = config.usdcTokenDecimals();

  const decimalsAdjustment =
    constants.DEFAULT_DECIMALS.minus(usdcTokenDecimals);
  const priceUsdc = virtualPrice
    .times(basePrice.usdPrice)
    .div(basePrice.decimalsBaseTen)
    .times(
      constants.BIGINT_TEN.pow(decimalsAdjustment.toI32() as u8).toBigDecimal()
    );

  return CustomPriceType.initialize(
    priceUsdc,
    decimalsAdjustment.plus(constants.DEFAULT_DECIMALS).toI32() as u8
  );
}

export function getBasePrice(lpAddress: Address): CustomPriceType {
  const poolAddress = getPoolFromLpToken(lpAddress);

  if (poolAddress.equals(constants.NULL.TYPE_ADDRESS))
    return new CustomPriceType();

  const underlyingCoinAddress = getUnderlyingCoinFromPool(poolAddress);
  const basePrice = getPriceUsdcRecommended(underlyingCoinAddress);

  return basePrice;
}

export function getUnderlyingCoinFromPool(poolAddress: Address): Address {
  const config = utils.getConfig();
  const curveRegistryAdresses = config.curveRegistry();

  for (let idx = 0; idx < curveRegistryAdresses.length; idx++) {
    const curveRegistryContract = CurveRegistryContract.bind(
      curveRegistryAdresses[idx]
    );

    const coins = utils.readValue<Address[]>(
      curveRegistryContract.try_get_underlying_coins(poolAddress),
      []
    );

    if (coins.length != 0) return getPreferredCoinFromCoins(coins);
  }

  return constants.NULL.TYPE_ADDRESS;
}

export function getPreferredCoinFromCoins(coins: Address[]): Address {
  let preferredCoinAddress = constants.NULL.TYPE_ADDRESS;
  for (let coinIdx = 0; coinIdx < 8; coinIdx++) {
    const coinAddress = coins[coinIdx];

    if (coinAddress.notEqual(constants.NULL.TYPE_ADDRESS)) {
      preferredCoinAddress = coinAddress;
    }
    // Found preferred coin and we're at the end of the token array
    if (
      (preferredCoinAddress.notEqual(constants.NULL.TYPE_ADDRESS) &&
        coinAddress.equals(constants.NULL.TYPE_ADDRESS)) ||
      coinIdx == 7
    ) {
      break;
    }
  }

  return preferredCoinAddress;
}

export function getVirtualPrice(curveLpTokenAddress: Address): BigInt {
  const config = utils.getConfig();
  const curveRegistryAdresses = config.curveRegistry();

  for (let idx = 0; idx < curveRegistryAdresses.length; idx++) {
    const curveRegistryContract = CurveRegistryContract.bind(
      curveRegistryAdresses[idx]
    );

    const virtualPriceCall =
      curveRegistryContract.try_get_virtual_price_from_lp_token(
        curveLpTokenAddress
      );

    if (!virtualPriceCall.reverted) return virtualPriceCall.value;
  }

  return constants.BIGINT_ZERO;
}

export function getPriceUsdcRecommended(
  tokenAddress: Address
): CustomPriceType {
  return getUsdPricePerToken(tokenAddress);
}

export function cryptoPoolLpPriceUsdc(lpAddress: Address): CustomPriceType {
  const lpTokenContract = _ERC20.bind(lpAddress);
  const totalSupply = utils
    .readValue<BigInt>(lpTokenContract.try_totalSupply(), constants.BIGINT_ONE)
    .toBigDecimal();

  const totalValueUsdc = cryptoPoolLpTotalValueUsdc(lpAddress);
  const priceUsdc = totalValueUsdc
    .times(
      constants.BIGINT_TEN.pow(
        constants.DEFAULT_DECIMALS.toI32() as u8
      ).toBigDecimal()
    )
    .div(totalSupply);

  return CustomPriceType.initialize(priceUsdc, 0);
}

export function cryptoPoolLpTotalValueUsdc(lpAddress: Address): BigDecimal {
  const poolAddress = getPoolFromLpToken(lpAddress);

  const underlyingTokensAddresses =
    cryptoPoolUnderlyingTokensAddressesByPoolAddress(poolAddress);

  let totalValue = constants.BIGDECIMAL_ZERO;

  for (
    let tokenIdx = 0;
    tokenIdx < underlyingTokensAddresses.length;
    tokenIdx++
  ) {
    const tokenValueUsdc = cryptoPoolTokenAmountUsdc(
      poolAddress,
      underlyingTokensAddresses[tokenIdx],
      BigInt.fromI32(tokenIdx)
    );
    totalValue = totalValue.plus(tokenValueUsdc);
  }

  return totalValue;
}

export function cryptoPoolTokenAmountUsdc(
  poolAddress: Address,
  tokenAddress: Address,
  tokenIdx: BigInt
): BigDecimal {
  const poolContract = CurvePoolContract.bind(poolAddress);

  const tokenBalance = utils
    .readValue<BigInt>(
      poolContract.try_balances(tokenIdx),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  const tokenDecimals = utils.getTokenDecimals(tokenAddress);
  const tokenPrice = getPriceUsdcRecommended(tokenAddress);
  const tokenValueUsdc = tokenBalance
    .times(tokenPrice.usdPrice)
    .div(tokenPrice.decimalsBaseTen)
    .div(constants.BIGINT_TEN.pow(tokenDecimals.toI32() as u8).toBigDecimal());

  return tokenValueUsdc;
}

export function cryptoPoolUnderlyingTokensAddressesByPoolAddress(
  poolAddress: Address
): Address[] {
  const poolContract = CurvePoolContract.bind(poolAddress);

  let idx = 0;
  const coins: Address[] = [];
  while (idx >= 0) {
    const coin = utils.readValue<Address>(
      poolContract.try_coins(BigInt.fromI32(idx)),
      constants.NULL.TYPE_ADDRESS
    );

    if (coin.equals(constants.NULL.TYPE_ADDRESS)) {
      return coins;
    }

    coins.push(coin);
    idx += 1;
  }

  return coins;
}

export function getPriceUsdc(tokenAddress: Address): CustomPriceType {
  if (isCurveLpToken(tokenAddress)) {
    return getCurvePriceUsdc(tokenAddress);
  }

  const poolContract = CurvePoolContract.bind(tokenAddress);
  const virtualPrice = utils
    .readValue<BigInt>(
      poolContract.try_get_virtual_price(),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  const coins: Address[] = [];
  for (let i = 0; i < 8; i++) {
    const coin = utils.readValue<Address>(
      poolContract.try_coins(BigInt.fromI32(i)),
      constants.NULL.TYPE_ADDRESS
    );

    coins.push(coin);
  }

  const preferredCoin = getPreferredCoinFromCoins(coins);
  const price = getPriceUsdcRecommended(preferredCoin);

  return CustomPriceType.initialize(
    price.usdPrice.times(virtualPrice).div(price.decimalsBaseTen),
    constants.DEFAULT_DECIMALS.toI32() as u8
  );
}
