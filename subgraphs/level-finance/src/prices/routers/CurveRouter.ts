import { getUsdPricePerToken } from "..";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { BigInt, Address, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { CurvePool as CurvePoolContract } from "../../../generated/Pool/CurvePool";
import { CurveRegistry as CurveRegistryContract } from "../../../generated/Pool/CurveRegistry";

export function isCurveLpToken(
  lpAddress: Address,
  block: ethereum.Block | null
): bool {
  const poolAddress = getPoolFromLpToken(lpAddress, block);
  if (poolAddress.notEqual(constants.NULL.TYPE_ADDRESS)) return true;

  return false;
}

export function getPoolFromLpToken(
  lpAddress: Address,
  block: ethereum.Block | null = null
): Address {
  const config = utils.getConfig();
  const curveRegistryAdresses = config.curveRegistry();

  for (let idx = 0; idx < curveRegistryAdresses.length; idx++) {
    const curveRegistry = curveRegistryAdresses[idx];
    if (block && curveRegistry.startBlock.gt(block.number)) continue;

    const curveRegistryContract = CurveRegistryContract.bind(
      curveRegistry.address
    );

    const poolAddress = utils.readValue<Address>(
      curveRegistryContract.try_get_pool_from_lp_token(lpAddress),
      constants.NULL.TYPE_ADDRESS
    );

    if (poolAddress.notEqual(constants.NULL.TYPE_ADDRESS)) return poolAddress;
  }

  return constants.NULL.TYPE_ADDRESS;
}

export function isLpCryptoPool(
  lpAddress: Address,
  block: ethereum.Block | null = null
): bool {
  const poolAddress = getPoolFromLpToken(lpAddress, block);

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

export function getCurvePriceUsdc(
  lpAddress: Address,
  block: ethereum.Block | null = null
): CustomPriceType {
  if (isLpCryptoPool(lpAddress, block))
    return cryptoPoolLpPriceUsdc(lpAddress, block);

  const basePrice = getBasePrice(lpAddress, block);
  const virtualPrice = getVirtualPrice(lpAddress, block).toBigDecimal();

  const config = utils.getConfig();
  const usdcTokenDecimals = config
    .whitelistedTokens()
    .mustGet(constants.STABLE_TOKENS_STRINGS.USDC).decimals;

  const decimalsAdjustment = constants.DEFAULT_DECIMALS.minus(
    BigInt.fromI32(usdcTokenDecimals)
  );
  const priceUsdc = virtualPrice
    .times(basePrice.usdPrice)
    .times(
      constants.BIGINT_TEN.pow(decimalsAdjustment.toI32() as u8).toBigDecimal()
    );

  return CustomPriceType.initialize(
    priceUsdc,
    decimalsAdjustment.plus(constants.DEFAULT_DECIMALS).toI32() as u8,
    constants.OracleType.CURVE_ROUTER
  );
}

export function getBasePrice(
  lpAddress: Address,
  block: ethereum.Block | null = null
): CustomPriceType {
  const poolAddress = getPoolFromLpToken(lpAddress, block);

  if (poolAddress.equals(constants.NULL.TYPE_ADDRESS))
    return new CustomPriceType();

  const underlyingCoinAddress = getUnderlyingCoinFromPool(poolAddress, block);
  const basePrice = getPriceUsdcRecommended(underlyingCoinAddress, block);

  return basePrice;
}

export function getUnderlyingCoinFromPool(
  poolAddress: Address,
  block: ethereum.Block | null = null
): Address {
  const config = utils.getConfig();
  const curveRegistryAdresses = config.curveRegistry();

  for (let idx = 0; idx < curveRegistryAdresses.length; idx++) {
    const curveRegistry = curveRegistryAdresses[idx];
    if (block && curveRegistry.startBlock.gt(block.number)) continue;

    const curveRegistryContract = CurveRegistryContract.bind(
      curveRegistry.address
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
  for (let coinIdx = 0; coinIdx < constants.INT_EIGHT; coinIdx++) {
    const coinAddress = coins[coinIdx];

    if (coinAddress.notEqual(constants.NULL.TYPE_ADDRESS)) {
      preferredCoinAddress = coinAddress;
    }
    // Found preferred coin and we're at the end of the token array
    if (
      (preferredCoinAddress.notEqual(constants.NULL.TYPE_ADDRESS) &&
        coinAddress.equals(constants.NULL.TYPE_ADDRESS)) ||
      coinIdx == constants.INT_SEVEN
    ) {
      break;
    }
  }

  return preferredCoinAddress;
}

export function getVirtualPrice(
  curveLpTokenAddress: Address,
  block: ethereum.Block | null = null
): BigInt {
  const config = utils.getConfig();
  const curveRegistryAdresses = config.curveRegistry();

  for (let idx = 0; idx < curveRegistryAdresses.length; idx++) {
    const curveRegistry = curveRegistryAdresses[idx];
    if (block && curveRegistry.startBlock.gt(block.number)) continue;

    const curveRegistryContract = CurveRegistryContract.bind(
      curveRegistry.address
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
  tokenAddress: Address,
  block: ethereum.Block | null = null
): CustomPriceType {
  return getUsdPricePerToken(tokenAddress, block);
}

export function cryptoPoolLpPriceUsdc(
  lpAddress: Address,
  block: ethereum.Block | null = null
): CustomPriceType {
  const totalSupply = utils.getTokenSupply(lpAddress);

  const totalValueUsdc = cryptoPoolLpTotalValueUsdc(lpAddress, block);
  const priceUsdc = totalValueUsdc
    .times(
      constants.BIGINT_TEN.pow(
        constants.DEFAULT_DECIMALS.toI32() as u8
      ).toBigDecimal()
    )
    .div(totalSupply.toBigDecimal());

  return CustomPriceType.initialize(
    priceUsdc,
    0,
    constants.OracleType.CURVE_ROUTER
  );
}

export function cryptoPoolLpTotalValueUsdc(
  lpAddress: Address,
  block: ethereum.Block | null = null
): BigDecimal {
  const poolAddress = getPoolFromLpToken(lpAddress, block);

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
      BigInt.fromI32(tokenIdx),
      block
    );
    totalValue = totalValue.plus(tokenValueUsdc);
  }

  return totalValue;
}

export function cryptoPoolTokenAmountUsdc(
  poolAddress: Address,
  tokenAddress: Address,
  tokenIdx: BigInt,
  block: ethereum.Block | null = null
): BigDecimal {
  const poolContract = CurvePoolContract.bind(poolAddress);

  const tokenBalance = utils
    .readValue<BigInt>(
      poolContract.try_balances(tokenIdx),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  const tokenDecimals = utils.getTokenDecimals(tokenAddress);
  const tokenPrice = getPriceUsdcRecommended(tokenAddress, block);
  const tokenValueUsdc = tokenBalance
    .times(tokenPrice.usdPrice)
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

export function getPriceUsdc(
  tokenAddress: Address,
  block: ethereum.Block | null
): CustomPriceType {
  if (isCurveLpToken(tokenAddress, block))
    return getCurvePriceUsdc(tokenAddress, block);

  const poolContract = CurvePoolContract.bind(tokenAddress);
  const virtualPrice = utils
    .readValue<BigInt>(
      poolContract.try_get_virtual_price(),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  const coins: Address[] = [];
  for (let i = 0; i < constants.INT_EIGHT; i++) {
    const coin = utils.readValue<Address>(
      poolContract.try_coins(BigInt.fromI32(i)),
      constants.NULL.TYPE_ADDRESS
    );

    coins.push(coin);
  }

  const preferredCoin = getPreferredCoinFromCoins(coins);
  const price = getPriceUsdcRecommended(preferredCoin, block);

  return CustomPriceType.initialize(
    price.usdPrice.times(virtualPrice),
    constants.DEFAULT_DECIMALS.toI32() as u8,
    constants.OracleType.CURVE_ROUTER
  );
}
