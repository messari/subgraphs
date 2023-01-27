import * as utils from "./common/utils";
import * as constants from "./common/constants";
import * as AaveOracle from "./oracles/AaveOracle";
import * as CurveRouter from "./routers/CurveRouter";
import * as ChainLinkFeed from "./oracles/ChainLinkFeed";
import * as YearnLensOracle from "./oracles/YearnLensOracle";
import * as UniswapForksRouter from "./routers/UniswapForksRouter";
import * as CurveCalculations from "./calculations/CalculationsCurve";
import * as SushiCalculations from "./calculations/CalculationsSushiswap";
import { CustomPriceType } from "./common/types";
import { log, Address, BigDecimal, dataSource } from "@graphprotocol/graph-ts";
import { getLpTokenTotalLiquidityUsdc } from "./routers/UniswapForksRouter";
import { _ERC20 } from "../../generated/YakStrategyV2/_ERC20";
import { DEFUALT_AMOUNT } from "./common/constants";
import { STAKED_GLP_ADDRESS, JOE_LP_ADDRESS, USDC_LP_ADDRESS, ASI_LP_ADDRESS, K3C_LP_ADDRESS, OLIVE_LP_ADDRESS } from "../helpers/constants";
import { GMX_STRATEGY } from "./config/avalanche";

export function getUsdPricePerToken(tokenAddr: Address): CustomPriceType {
  const config = utils.getConfig();
  let price: CustomPriceType = new CustomPriceType();

  if (tokenAddr.equals(STAKED_GLP_ADDRESS)) {
    const baseTokenContract = _ERC20.bind(config.getBaseToken(STAKED_GLP_ADDRESS));
    const baseTokenPrice = getUsdPricePerTokenBase(config.getBaseToken(STAKED_GLP_ADDRESS));
    const baseTokenBalance = baseTokenContract.totalSupply();
    
    const lpTokenContract = _ERC20.bind(GMX_STRATEGY);
    const lpTokenSupply = lpTokenContract.totalSupply();

    const lpTokenPrice = baseTokenBalance
      .toBigDecimal()
      .times(baseTokenPrice.usdPrice)
      .div(lpTokenSupply.toBigDecimal())
      .div(constants.BIGINT_TEN.toBigDecimal())
      .times(DEFUALT_AMOUNT)

    price = CustomPriceType.initialize(lpTokenPrice, 18);
  }

  if (tokenAddr.equals(JOE_LP_ADDRESS)) {
    price = getLpTokenTotalLiquidityUsdc(config.getBaseToken(JOE_LP_ADDRESS));
  }

  if (tokenAddr.equals(USDC_LP_ADDRESS)) {
    price = getUsdPricePerTokenBase(config.getBaseToken(USDC_LP_ADDRESS));
  }

  if (tokenAddr.equals(ASI_LP_ADDRESS)) {
    price = getUsdPricePerTokenBase(config.getBaseToken(ASI_LP_ADDRESS));
  }

  if (tokenAddr.equals(K3C_LP_ADDRESS)) {
    price = getUsdPricePerTokenBase(config.getBaseToken(K3C_LP_ADDRESS));
  }

  if (tokenAddr.equals(OLIVE_LP_ADDRESS)) {
    price = getUsdPricePerTokenBase(config.getBaseToken(OLIVE_LP_ADDRESS));
  }

  price = getUsdPricePerTokenBase(tokenAddr);

  return price;
}

function getUsdPricePerTokenBase(tokenAddr: Address): CustomPriceType {
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

  // 1. Yearn Lens Oracle
  const yearnLensPrice = YearnLensOracle.getTokenPriceUSDC(tokenAddr);
  if (!yearnLensPrice.reverted) {
    log.info("[YearnLensOracle] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      yearnLensPrice.usdPrice.toString(),
    ]);
    return yearnLensPrice;
  }

  // 2. ChainLink Feed Registry
  const chainLinkPrice = ChainLinkFeed.getTokenPriceUSDC(tokenAddr);
  if (!chainLinkPrice.reverted) {
    log.info("[ChainLinkFeed] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      chainLinkPrice.usdPrice.toString(),
    ]);
    return chainLinkPrice;
  }

  // 3. CalculationsCurve
  const calculationsCurvePrice = CurveCalculations.getTokenPriceUSDC(tokenAddr);
  if (!calculationsCurvePrice.reverted) {
    log.info("[CalculationsCurve] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      calculationsCurvePrice.usdPrice.toString(),
    ]);
    return calculationsCurvePrice;
  }

  // 4. CalculationsSushiSwap
  const calculationsSushiSwapPrice =
    SushiCalculations.getTokenPriceUSDC(tokenAddr);
  if (!calculationsSushiSwapPrice.reverted) {
    log.info("[CalculationsSushiSwap] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      calculationsSushiSwapPrice.usdPrice.toString(),
    ]);
    return calculationsSushiSwapPrice;
  }

  // 6. Aave Oracle
  const aaveOraclePrice = AaveOracle.getTokenPriceUSDC(tokenAddr);
  if (!aaveOraclePrice.reverted) {
    log.info("[AaveOracle] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      aaveOraclePrice.usdPrice.toString(),
    ]);
    return aaveOraclePrice;
  }

  // 7. Curve Router
  const curvePrice = CurveRouter.getCurvePriceUsdc(tokenAddr);
  if (!curvePrice.reverted) {
    log.info("[CurveRouter] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      curvePrice.usdPrice.toString(),
    ]);
    return curvePrice;
  }

  const curvePrice1 = CurveRouter.getPriceUsdc(tokenAddr);
  if (!curvePrice1.reverted) {
    log.info("[CurveRouter] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      curvePrice.usdPrice.toString(),
    ]);
    return curvePrice;
  }

  // 8. Uniswap Router
  const uniswapPrice = UniswapForksRouter.getTokenPriceUSDC(tokenAddr);
  if (!uniswapPrice.reverted) {
    log.info("[UniswapRouter] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      uniswapPrice.usdPrice.toString(),
    ]);
    return uniswapPrice;
  }

  log.warning("[Oracle] Failed to Fetch Price, Name: {} Address: {}", [
    utils.getTokenName(tokenAddr),
    tokenAddr.toHexString(),
  ]);

  return new CustomPriceType();
}

export function getUsdPrice(
  tokenAddr: Address,
  amount: BigDecimal
): BigDecimal {
  const tokenPrice = getUsdPricePerToken(tokenAddr);

  if (!tokenPrice.reverted) {
    return tokenPrice.usdPrice.times(amount);
  }

  return constants.BIGDECIMAL_ZERO;
}
