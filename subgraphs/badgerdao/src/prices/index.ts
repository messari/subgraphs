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
      config.whitelistedTokens().mustGet("WETH").address,
      block
    );

  // 1. YearnLens Oracle
  const yearnLensPrice = YearnLensOracle.getTokenPriceUSDC(tokenAddr, block);
  if (!yearnLensPrice.reverted) return yearnLensPrice;

  // 2. InchOracle
  const inchOraclePrice = InchOracle.getTokenPriceUSDC(tokenAddr, block);
  if (!inchOraclePrice.reverted) return inchOraclePrice;

  // 3. ChainLink Feed Registry
  const chainLinkPrice = ChainLinkFeed.getTokenPriceUSDC(tokenAddr, block);
  if (!chainLinkPrice.reverted) return chainLinkPrice;

  // 4. CalculationsCurve
  const curvePrice = CurveCalculations.getTokenPriceUSDC(tokenAddr, block);
  if (!curvePrice.reverted) return curvePrice;

  // 5. CalculationsSushiSwap
  const sushiSwapPrice = SushiCalculations.getTokenPriceUSDC(tokenAddr, block);
  if (!sushiSwapPrice.reverted) return sushiSwapPrice;

  // 6. Aave Oracle
  const aaveOraclePrice = AaveOracle.getTokenPriceUSDC(tokenAddr, block);
  if (!aaveOraclePrice.reverted) return aaveOraclePrice;

  // 7. Curve Router
  const curveRouterPrice = CurveRouter.getPriceUsdc(tokenAddr, block);
  if (!curveRouterPrice.reverted) return curveRouterPrice;

  // 8. Uniswap Router
  const uniswapPrice = UniswapForksRouter.getTokenPriceUSDC(tokenAddr);
  if (!uniswapPrice.reverted) return uniswapPrice;

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
