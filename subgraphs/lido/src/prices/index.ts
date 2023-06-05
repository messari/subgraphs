import {
  Address,
  BigDecimal,
  dataSource,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";

import { CustomPriceType } from "./common/types";
import * as utils from "./common/utils";
import * as constants from "./common/constants";

import * as YearnLensOracle from "./oracles/YearnLensOracle";
import * as ChainLinkFeed from "./oracles/ChainLinkFeed";
import * as CalculationsCurve from "./calculations/CalculationsCurve";
import * as CalculationsSushiSwap from "./calculations/CalculationsSushiswap";
import * as CurveRouter from "./routers/CurveRouter";
import * as UniswapRouter from "./routers/UniswapRouter";
import * as SushiSwapRouter from "./routers/SushiSwapRouter";

export function getUsdPricePerToken(
  tokenAddr: Address,
  block: ethereum.Block | null = null
): CustomPriceType {
  // Check if tokenAddr is a NULL Address
  if (tokenAddr.toHex() == constants.ZERO_ADDRESS_STRING) {
    return new CustomPriceType();
  }

  const network = dataSource.network();
  const config = utils.getConfig();

  const oracleConfig = config.getOracleConfig(tokenAddr, block);
  const oracleCount = oracleConfig.oracleCount();
  const oracleOrder = oracleConfig.oracleOrder();

  let prices: CustomPriceType[] = [];
  for (let i = 0; i < oracleOrder.length; i++) {
    if (prices.length >= oracleCount) {
      break;
    }

    let oraclePrice = new CustomPriceType();

    if (oracleOrder[i] == constants.OracleType.YEARN_LENS_ORACLE) {
      oraclePrice = YearnLensOracle.getTokenPriceFromYearnLens(
        tokenAddr,
        network
      );
    } else if (oracleOrder[i] == constants.OracleType.CHAINLINK_FEED) {
      oraclePrice = ChainLinkFeed.getTokenPriceFromChainLink(
        tokenAddr,
        network
      );
    } else if (oracleOrder[i] == constants.OracleType.CURVE_CALCULATIONS) {
      oraclePrice = CalculationsCurve.getTokenPriceFromCalculationCurve(
        tokenAddr,
        network
      );
    } else if (oracleOrder[i] == constants.OracleType.SUSHI_CALCULATIONS) {
      oraclePrice = CalculationsSushiSwap.getTokenPriceFromSushiSwap(
        tokenAddr,
        network
      );
    } else if (oracleOrder[i] == constants.OracleType.CURVE_ROUTER) {
      oraclePrice = CurveRouter.getCurvePriceUsdc(tokenAddr, network);
    } else if (oracleOrder[i] == constants.OracleType.UNISWAP_FORKS_ROUTER) {
      oraclePrice = UniswapRouter.getPriceUsdc(tokenAddr, network);
    } else if (oracleOrder[i] == constants.OracleType.SUSHI_ROUTER) {
      oraclePrice = SushiSwapRouter.getPriceUsdc(tokenAddr, network);
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

export function getUsdPrice(
  tokenAddr: Address,
  amount: BigDecimal
): BigDecimal {
  let tokenPrice = getUsdPricePerToken(tokenAddr);

  if (!tokenPrice.reverted) {
    return tokenPrice.usdPrice.times(amount).div(tokenPrice.decimalsBaseTen);
  }

  return constants.BIGDECIMAL_ZERO;
}
