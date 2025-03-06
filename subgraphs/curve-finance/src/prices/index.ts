import {
  log,
  BigInt,
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
  block: ethereum.Block | null = null,
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
      constants.DEFAULT_USDC_DECIMALS,
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
    let oracleSucceeded = true;

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
    } else {
      oracleSucceeded = false;
    }

    if (oracleSucceeded && !oraclePrice.reverted) {
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

  if (closestPrices.length == 0) {
    if (prices.length > 0) {
      return prices[0];
    }
    return new CustomPriceType();
  }

  return utils.averagePrice(closestPrices);
}

export function getLiquidityBoundPrice(
  tokenAddress: Address,
  tokenPrice: CustomPriceType,
  amount: BigDecimal,
): BigDecimal {
  const reportedPriceUSD = tokenPrice.usdPrice.times(amount);
  const liquidity = tokenPrice.liquidity;

  let liquidityBoundPriceUSD = reportedPriceUSD;
  if (
    liquidity.gt(constants.BIGDECIMAL_ZERO) &&
    reportedPriceUSD.gt(liquidity)
  ) {
    // Always use safe values for decimals, ensuring they're valid integers
    const usdcDecimals = BigInt.fromI32(constants.DEFAULT_USDC_DECIMALS);

    // Super defensive handling for token decimals
    let tokenDecimals: BigInt;

    // First check if the decimals value is legitimate
    if (tokenPrice.decimals > 0 && tokenPrice.decimals <= 30) {
      // 30 is a reasonable upper bound for token decimals
      tokenDecimals = BigInt.fromI32(tokenPrice.decimals);
    } else {
      // Log the issue and use default value for ERC20 tokens (18)
      log.warning(
        "[getLiquidityBoundPrice] Invalid token decimals {} for token: {}, using default 18",
        [tokenPrice.decimals.toString(), tokenAddress.toHexString()],
      );
      tokenDecimals = constants.DEFAULT_DECIMALS;
    }

    // Calculate factors based on decimal values
    const usdcFactor = constants.BIGINT_TEN.pow(
      usdcDecimals.toI32() as u8,
    ).toBigDecimal();
    const tokenFactor = constants.BIGINT_TEN.pow(
      tokenDecimals.toI32() as u8,
    ).toBigDecimal();

    // Calculate the price with bounds
    liquidityBoundPriceUSD = liquidity
      .div(usdcFactor)
      .times(tokenFactor)
      .div(amount);

    log.warning(
      "[getLiquidityBoundPrice] token: {} (reported price * amount): ({} * {}) bound to available liquidity: {}; new price: {}",
      [
        tokenAddress.toHexString(),
        tokenPrice.usdPrice.toString(),
        amount.toString(),
        liquidity.toString(),
        liquidityBoundPriceUSD.toString(),
      ],
    );
  }

  return liquidityBoundPriceUSD;
}

export function getUsdPrice(
  tokenAddr: Address,
  amount: BigDecimal,
  block: ethereum.Block | null = null,
): BigDecimal {
  // Get the token price
  const tokenPrice = getUsdPricePerToken(tokenAddr, block);

  if (!tokenPrice.reverted) {
    // Handle router-specific price calculations
    if (
      tokenPrice.oracleType == constants.OracleType.UNISWAP_FORKS_ROUTER ||
      tokenPrice.oracleType == constants.OracleType.CURVE_ROUTER
    ) {
      return getLiquidityBoundPrice(tokenAddr, tokenPrice, amount);
    }

    // Simple calculation for other price sources
    return tokenPrice.usdPrice.times(amount);
  }

  return constants.BIGDECIMAL_ZERO;
}
