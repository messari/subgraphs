import * as utils from "./common/utils";
import * as constants from "./common/constants";
import { CustomPriceType } from "./common/types";
import * as AaveOracle from "./oracles/AaveOracle";
import * as InchOracle from "./oracles/InchOracle";
import * as CurveRouter from "./routers/CurveRouter";
import * as ChainLinkFeed from "./oracles/ChainLinkFeed";
import * as YearnLensOracle from "./oracles/YearnLensOracle";
import * as UniswapForksRouter from "./routers/UniswapForksRouter";
import * as CurveCalculations from "./calculations/CalculationsCurve";
import * as SushiCalculations from "./calculations/CalculationsSushiswap";
import { log, Address, BigDecimal, ethereum } from "@graphprotocol/graph-ts";

export function getUsdPricePerToken(
  tokenAddr: Address,
  block: ethereum.Block | null = null
): CustomPriceType {
  const config = utils.getConfig();

  if (!config || constants.BLACKLISTED_TOKENS.includes(tokenAddr))
    return new CustomPriceType();

  if (config.hardcodedStables().includes(tokenAddr))
    return CustomPriceType.initializePegged();

  if (tokenAddr.equals(constants.ETH_ADDRESS))
    return getUsdPricePerToken(
      config.whitelistedTokens().mustGet(constants.NATIVE_TOKEN).address,
      block
    );

  // 1. YearnLens Oracle
  const yearnLensPrice = YearnLensOracle.getTokenPriceUSDC(tokenAddr, block);
  if (!yearnLensPrice.reverted) {
    log.info("[YearnLensOracle] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      yearnLensPrice.usdPrice.toString(),
    ]);
    return yearnLensPrice;
  }

  // 2. InchOracle
  const inchOraclePrice = InchOracle.getTokenPriceUSDC(tokenAddr, block);
  if (!inchOraclePrice.reverted) {
    log.info("[InchOracle] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      inchOraclePrice.usdPrice.toString(),
    ]);
    return inchOraclePrice;
  }

  // 3. ChainLink Feed Registry
  const chainLinkPrice = ChainLinkFeed.getTokenPriceUSDC(tokenAddr, block);
  if (!chainLinkPrice.reverted) {
    log.info("[ChainLinkFeed] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      chainLinkPrice.usdPrice.toString(),
    ]);
    return chainLinkPrice;
  }

  // 4. CalculationsCurve
  const calculationsCurvePrice = CurveCalculations.getTokenPriceUSDC(
    tokenAddr,
    block
  );
  if (!calculationsCurvePrice.reverted) {
    log.info("[CalculationsCurve] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      calculationsCurvePrice.usdPrice.toString(),
    ]);
    return calculationsCurvePrice;
  }

  // 5. CalculationsSushiSwap
  const calculationsSushiSwapPrice = SushiCalculations.getTokenPriceUSDC(
    tokenAddr,
    block
  );
  if (!calculationsSushiSwapPrice.reverted) {
    log.info("[CalculationsSushiSwap] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      calculationsSushiSwapPrice.usdPrice.toString(),
    ]);
    return calculationsSushiSwapPrice;
  }

  // 6. Aave Oracle
  const aaveOraclePrice = AaveOracle.getTokenPriceUSDC(tokenAddr, block);
  if (!aaveOraclePrice.reverted) {
    log.info("[AaveOracle] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      aaveOraclePrice.usdPrice.toString(),
    ]);
    return aaveOraclePrice;
  }

  // 7. Curve Router
  const curvePrice = CurveRouter.getPriceUsdc(tokenAddr, block);
  if (!curvePrice.reverted) {
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

  log.warning("[Oracle] Failed to Fetch Price, tokenAddr: {}", [
    tokenAddr.toHexString(),
  ]);

  return new CustomPriceType();
}

export function getUsdPrice(
  tokenAddr: Address,
  amount: BigDecimal,
  block: ethereum.Block
): BigDecimal {
  const tokenPrice = getUsdPricePerToken(tokenAddr, block);

  if (!tokenPrice.reverted) return tokenPrice.usdPrice.times(amount);
  return constants.BIGDECIMAL_ZERO;
}
