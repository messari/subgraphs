/*
import { Address, BigDecimal, BigInt, ByteArray, dataSource, log } from "@graphprotocol/graph-ts";
import { MainRegistry } from "../../../generated/MainRegistry/MainRegistry";
import { LiquidityPool } from "../../../generated/schema";
import { BIGDECIMAL_ZERO } from "../common/constants";
import { getCurveRegistryAddress } from "../routers/CurveRouter";
import * as constants from "../common/constants";
import { StableSwap } from "../../../generated/templates/Pool/StableSwap";
import { BIGDECIMAL_ONE } from "../../common/constants";
import { ERC20 } from "../../../generated/MainRegistry/ERC20";
import { bigIntToBigDecimal, divBigDecimal, exponentToBigDecimal } from "../../common/utils/numbers";
import { getOrCreateToken } from "../../common/getters";
import { getEthRate, getUsdRate } from "../../prices";
import { ChainlinkAggregator } from "../../../generated/MainRegistry/ChainlinkAggregator";

export function getV2LpTokenPrice(pool: LiquidityPool): BigDecimal {
  const lpToken = Address.fromString(pool.outputToken);
  const tokenContract = ERC20.bind(lpToken);
  const supplyResult = tokenContract.try_totalSupply();
  const supply = supplyResult.reverted
    ? BIGDECIMAL_ZERO
    : supplyResult.value.toBigDecimal().div(constants.BIG_DECIMAL_1E18);
  let total = BIGDECIMAL_ZERO;
  let missingCoins = 0;

  let tokensMapping = constants.WHITELIST_TOKENS_MAP.get(dataSource.network());
  const WETH_ADDRESS = tokensMapping!.get("WETH")!;
  for (let i = 0; i < pool.inputTokens.length; ++i) {
    const currentCoin = Address.fromString(pool.inputTokens[i]);
    const coinContract = ERC20.bind(currentCoin);
    const balanceResult = coinContract.try_balanceOf(Address.fromString(pool.outputToken));
    const decimalsResult = coinContract.try_decimals();
    let balance = balanceResult.reverted ? BIGDECIMAL_ZERO : balanceResult.value.toBigDecimal();
    const decimals = decimalsResult.reverted ? BigInt.fromI32(18) : BigInt.fromI32(decimalsResult.value);
    balance = balance.div(exponentToBigDecimal(decimals.toI32()));
    let price = BIGDECIMAL_ONE;
    // handling edge cases that are not traded on Sushi
    if (currentCoin == constants.EURT_ADDRESS) {
      price = getForexUsdRate(Address.fromString(constants.EUR_LP_TOKEN));
    } else {
      price = getUsdRate(currentCoin, dataSource.network());
    }
    // Some pools have WETH listed under "coins" but actually use native ETH
    // In case we encounter similar missing coins, we keep track of all
    // And will multiply the final result as if the pool was perfectly balanced
    if (balance == BIGDECIMAL_ZERO && currentCoin == WETH_ADDRESS) {
      missingCoins += 1;
    }
    total = total.plus(price.times(balance));
  }
  let value = supply == BIGDECIMAL_ZERO ? BIGDECIMAL_ZERO : total.div(supply);

  if (missingCoins > 0) {
    log.warning("Missing {} coins for {}", [missingCoins.toString(), pool.name]);
    const missingProportion = BigDecimal.fromString((pool.inputTokens.length / missingCoins).toString());
    value = value.times(missingProportion);
  }
  return value;
}

export function getForexUsdRate(lpToken: Address): BigDecimal {
  // returns the amount of USD 1 unit of the foreign currency is worth
  const priceOracle = ChainlinkAggregator.bind(constants.FOREX_ORACLES.get(lpToken.toHexString()));
  const conversionRateReponse = priceOracle.try_latestAnswer();
  const conversionRate = conversionRateReponse.reverted
    ? BIGDECIMAL_ONE
    : conversionRateReponse.value.toBigDecimal().div(constants.BIG_DECIMAL_1E8);
  log.debug("Answer from Forex oracle {} for token {}: {}", [
    constants.FOREX_ORACLES.get(lpToken.toHexString()).toHexString(),
    lpToken.toHexString(),
    conversionRate.toString(),
  ]);
  return conversionRate;
}

export function getTokenAValueInTokenB(tokenA: Address, tokenB: Address, network: string): BigDecimal {
  if (tokenA == tokenB) {
    return BIGDECIMAL_ONE;
  }
  const decimalsA = getOrCreateToken(tokenA).decimals;
  const decimalsB = getOrCreateToken(tokenB).decimals;
  const ethRateA = BigInt.fromString(
    getEthRate(tokenA, network)
      .times(constants.BIG_DECIMAL_1E18)
      .toString(),
  );
  const ethRateB = BigInt.fromString(
    getEthRate(tokenB, network)
      .times(constants.BIG_DECIMAL_1E18)
      .toString(),
  );
  return divBigDecimal(bigIntToBigDecimal(ethRateA, decimalsA), bigIntToBigDecimal(ethRateB, decimalsB));
}

export function getTokenValueInLpUnderlyingToken(tokenAddr: Address, lpToken: Address, network: string): BigDecimal {
  let tokensMapping = constants.WHITELIST_TOKENS_MAP.get(network);
  if (lpToken == constants.LINK_LP_TOKEN_ADDRESS) {
    const LINK_ADDRESS = tokensMapping!.get("LINK")!;
    return getTokenAValueInTokenB(tokenAddr, LINK_ADDRESS, network);
  } else if (lpToken == Address.fromString(constants.CVX_CRV_LP_TOKEN)) {
    const CRV_ADDRESS = tokensMapping!.get("CRV")!;
    return getTokenAValueInTokenB(tokenAddr, CRV_ADDRESS, network);
  }
  return BIGDECIMAL_ONE;
}

export function getLpUnderlyingTokenValueInOtherToken(lpToken: Address, token: Address): BigDecimal {
  return BIGDECIMAL_ONE.div(getTokenValueInLpUnderlyingToken(token, lpToken, dataSource.network()));
}

export function getLpTokenVirtualPrice(lpToken: string): BigDecimal {
  const lpTokenAddress = Address.fromString(lpToken);
  const CURVE_REGISTRY = getCurveRegistryAddress(dataSource.network());
  const curveRegistry = MainRegistry.bind(CURVE_REGISTRY);
  let vPriceCallResult = curveRegistry.try_get_virtual_price_from_lp_token(lpTokenAddress);
  let vPrice = BIGDECIMAL_ZERO;
  if (!vPriceCallResult.reverted) {
    log.debug("Virtual price from registry for {} : {}", [lpToken, vPriceCallResult.value.toString()]);
    vPrice = vPriceCallResult.value.toBigDecimal().div(constants.BIG_DECIMAL_1E18);
  }
  // most likely for when factory pools are not included in the registry
  else {
    log.debug("Failed to fetch virtual price from registry for {}", [lpToken]);
    const lpTokenContract = StableSwap.bind(lpTokenAddress);
    vPriceCallResult = lpTokenContract.try_get_virtual_price();
    vPrice = !vPriceCallResult.reverted
      ? vPriceCallResult.value.toBigDecimal().div(constants.BIG_DECIMAL_1E18)
      : vPrice;
  }
  return vPrice;
}

export function getLpTokenPriceUSD(pool: LiquidityPool): BigDecimal {
  const lpTokenAddress = Address.fromString(pool.outputToken);
  const vPrice = getLpTokenVirtualPrice(pool.outputToken);
  let tokensMapping = constants.WHITELIST_TOKENS_MAP.get(dataSource.network());
  const USDT_ADDRESS = tokensMapping!.get("USDT")!;
  const WETH_ADDRESS = tokensMapping!.get("WETH")!;
  const WBTC_ADDRESS = tokensMapping!.get("WBTC")!;

  // TODO : check how to determine v1/v2 pool on-chain
  if (pool.isV2) {
    return getV2LpTokenPrice(pool);
  }
  if (constants.FOREX_ORACLES.has(pool.outputToken)) {
    return vPrice.times(getForexUsdRate(Address.fromString(pool.outputToken)));
  }
  switch (pool.assetType) {
    default:
      // USD
      return vPrice;
    case 1: // ETH
      return vPrice.times(getUsdRate(WETH_ADDRESS, dataSource.network()));
    case 2: // BTC
      return vPrice.times(getUsdRate(WBTC_ADDRESS, dataSource.network()));
    case 3:
      return vPrice.times(getLpUnderlyingTokenValueInOtherToken(lpTokenAddress, USDT_ADDRESS)); //quoteInSpecifiedToken(USDT_ADDRESS, pool.lpToken).times(exponentToBigDecimal(BigInt.fromI32(12))))
  }
}
*/