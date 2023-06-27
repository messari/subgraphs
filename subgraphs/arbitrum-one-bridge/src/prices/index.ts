/* eslint-disable @typescript-eslint/no-magic-numbers */
import {
  log,
  Address,
  ethereum,
  BigDecimal,
  dataSource,
} from "@graphprotocol/graph-ts";
import { CustomPriceType, OracleType } from "./common/types";

import * as utils from "./common/utils";
import * as constants from "./common/constants";
import * as AaveOracle from "./oracles/AaveOracle";
import * as CurveRouter from "./routers/CurveRouter";
import * as ChainLinkFeed from "./oracles/ChainLinkFeed";
import * as YearnLensOracle from "./oracles/YearnLensOracle";
import * as UniswapForksRouter from "./routers/UniswapForksRouter";
import * as CurveCalculations from "./calculations/CalculationsCurve";
import * as SushiCalculations from "./calculations/CalculationsSushiswap";

export function getUsdPricePerToken(
  tokenAddr: Address,
  block: ethereum.Block | null = null
): CustomPriceType {
  if (tokenAddr.equals(constants.NULL.TYPE_ADDRESS)) {
    return new CustomPriceType();
  }

  const config = utils.getConfig();
  if (config.network() == "default") {
    log.warning("Failed to fetch price: network {} not implemented", [
      dataSource.network(),
    ]);

    return new CustomPriceType();
  }

  if (config.hardcodedStables().includes(tokenAddr)) {
    return CustomPriceType.initialize(
      constants.BIGDECIMAL_USD_PRICE,
      constants.DEFAULT_USDC_DECIMALS
    );
  }

  const oracle = new OracleType();
  const override = config.getOracleOverride(tokenAddr, block);
  if (override) {
    oracle.setOracleConfig(override);
  }
  const oracleCount = oracle.oracleCount;
  const oracleOrder = oracle.oracleOrder;

  const prices: CustomPriceType[] = [];
  for (let i = 0; i < oracleOrder.length; i++) {
    if (prices.length >= oracleCount) {
      break;
    }

    let oraclePrice = new CustomPriceType();

    if (oracleOrder[i] == constants.OracleType.YEARN_LENS_ORACLE) {
      oraclePrice = YearnLensOracle.getTokenPriceUSDC(tokenAddr, block);
    } else if (oracleOrder[i] == constants.OracleType.CHAINLINK_FEED) {
      oraclePrice = ChainLinkFeed.getTokenPriceUSDC(tokenAddr, block);
    } else if (oracleOrder[i] == constants.OracleType.CURVE_CALCULATIONS) {
      oraclePrice = CurveCalculations.getTokenPriceUSDC(tokenAddr, block);
    } else if (oracleOrder[i] == constants.OracleType.SUSHI_CALCULATIONS) {
      oraclePrice = SushiCalculations.getTokenPriceUSDC(tokenAddr, block);
    } else if (oracleOrder[i] == constants.OracleType.AAVE_ORACLE) {
      oraclePrice = AaveOracle.getTokenPriceUSDC(tokenAddr, block);
    } else if (oracleOrder[i] == constants.OracleType.CURVE_ROUTER) {
      oraclePrice = CurveRouter.getCurvePriceUsdc(tokenAddr, block);
    } else if (oracleOrder[i] == constants.OracleType.UNISWAP_FORKS_ROUTER) {
      oraclePrice = UniswapForksRouter.getTokenPriceUSDC(tokenAddr, block);
    }

    if (!oraclePrice.reverted) {
      prices.push(oraclePrice);
    }
  }

  if (prices.length == constants.INT_ZERO) {
    log.warning("[Oracle] Failed to Fetch Price, tokenAddr: {}", [
      tokenAddr.toHexString(),
    ]);

    return new CustomPriceType();
  } else if (prices.length == constants.INT_ONE) {
    return prices[constants.INT_ZERO];
  } else if (prices.length == constants.INT_TWO) {
    return utils.averagePrice(prices);
  }

  const k = Math.ceil(prices.length / constants.INT_TWO) as i32;
  const closestPrices = utils.kClosestPrices(k, prices);

  return utils.averagePrice(closestPrices);
}

export function getLiquidityBoundPrice(
  tokenAddress: Address,
  tokenPrice: CustomPriceType,
  amount: BigDecimal
): BigDecimal {
  const reportedPriceUSD = tokenPrice.usdPrice.times(amount);
  const liquidity = tokenPrice.liquidity;

  let liquidityBoundPriceUSD = reportedPriceUSD;
  if (liquidity > constants.BIGDECIMAL_ZERO && reportedPriceUSD > liquidity) {
    liquidityBoundPriceUSD = liquidity
      .div(
        constants.BIGINT_TEN.pow(
          constants.DEFAULT_USDC_DECIMALS as u8
        ).toBigDecimal()
      )
      .times(constants.BIGINT_TEN.pow(tokenPrice.decimals as u8).toBigDecimal())
      .div(amount);

    log.warning(
      "[getLiquidityBoundPrice] reported (token price * amount): ({} * {}) bound to: {} for token: {} due to insufficient liquidity: {}",
      [
        tokenPrice.usdPrice.toString(),
        amount.toString(),
        liquidityBoundPriceUSD.toString(),
        tokenAddress.toHexString(),
        liquidity.toString(),
      ]
    );
  }

  return liquidityBoundPriceUSD;
}

export function getUsdPrice(
  tokenAddr: Address,
  amount: BigDecimal,
  block: ethereum.Block | null = null
): BigDecimal {
  const tokenPrice = getUsdPricePerToken(tokenAddr, block);

  if (!tokenPrice.reverted) {
    if (
      tokenPrice.oracleType == constants.OracleType.UNISWAP_FORKS_ROUTER ||
      tokenPrice.oracleType == constants.OracleType.CURVE_ROUTER
    ) {
      return getLiquidityBoundPrice(tokenAddr, tokenPrice, amount);
    }
    return tokenPrice.usdPrice.times(amount);
  }

  return constants.BIGDECIMAL_ZERO;
}
