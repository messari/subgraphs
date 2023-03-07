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

export function getUsdPricePerToken(tokenAddr: Address): CustomPriceType {
  if (tokenAddr.equals(constants.NULL.TYPE_ADDRESS)) {
    return new CustomPriceType();
  }

  if (
    [
      Address.fromString("0x761d38e5ddf6ccf6cf7c55759d5210750b5d60f3"), // ELON
      Address.fromString("0xd9a8bb44968f35282f1b91c353f77a61baf31a4b"), // GTPS
      Address.fromString("0xbc0071caa8d58a85c9bacbd27bb2b22cbf4ff479"), // GTPS fantom
      Address.fromString("0xd52d9ba6fcbadb1fe1e3aca52cbb72c4d9bbb4ec"), // GTPS polygon
      Address.fromString("0x337dc89ebcc33a337307d58a51888af92cfdc81b"), // WFTM
      Address.fromString("0xbd31ea8212119f94a611fa969881cba3ea06fa3d"), // LUNA (Wormhole)
      Address.fromString("0xd2877702675e6ceb975b4a1dff9fb7baf4c91ea9"), // wrapped LUNA
      Address.fromString("0x4674672bcddda2ea5300f5207e1158185c944bc0"), // GXT
      Address.fromString("0x050cbff7bff0432b6096dd15cd9499913ddf8e23"), // FCI
    ].includes(tokenAddr)
  ) {
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

  if (
    tokenAddr !=
    Address.fromString("0x50d1c9771902476076ecfc8b2a83ad6b9355a4c9") // FTT
  ) {
    // 1. Yearn Lens Oracle
    const yearnLensPrice = YearnLensOracle.getTokenPriceUSDC(tokenAddr);
    if (!yearnLensPrice.reverted) {
      log.info("[YearnLensOracle] tokenAddress: {}, Price: {}", [
        tokenAddr.toHexString(),
        yearnLensPrice.usdPrice.toString(),
      ]);
      return yearnLensPrice;
    }
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
