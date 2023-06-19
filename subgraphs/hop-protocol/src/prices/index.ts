import * as utils from "./common/utils";
import * as constants from "./common/constants";
import * as AaveOracle from "./oracles/AaveOracle";
import * as CurveRouter from "./routers/CurveRouter";
import * as ChainLinkFeed from "./oracles/ChainLinkFeed";
import * as YearnLensOracle from "./oracles/YearnLensOracle";
import * as UniswapForksRouter from "./routers/UniswapForksRouter";
import * as UniswapV2 from "./routers/UniswapV2";
import * as CurveCalculations from "./calculations/CalculationsCurve";
import * as SushiCalculations from "./calculations/CalculationsSushiswap";

import { CustomPriceType } from "./common/types";
import {
  log,
  Address,
  BigDecimal,
  dataSource,
  BigInt,
} from "@graphprotocol/graph-ts";
import {
  ArbitrumHtoken,
  ArbitrumToken,
  OptimismHtoken,
  OptimismToken,
  PolygonHtoken,
  PolygonToken,
  RewardTokens,
  XdaiHtoken,
  XdaiToken,
  priceTokens,
} from "../sdk/util/constants";
import { UniswapPair } from "../../generated/HopL1Bridge/UniswapPair";

export function getUsdPricePerToken(tokenAddr: Address): CustomPriceType {
  if (tokenAddr.equals(constants.NULL.TYPE_ADDRESS)) {
    return new CustomPriceType();
  }
  if (tokenAddr == Address.fromString(PolygonHtoken.MATIC)) {
    tokenAddr = Address.fromString(PolygonToken.MATIC);
  }
  if (tokenAddr == Address.fromString(PolygonHtoken.ETH)) {
    tokenAddr = Address.fromString(PolygonToken.ETH);
  }
  if (tokenAddr.toHexString() == OptimismHtoken.ETH) {
    tokenAddr = Address.fromString(OptimismToken.ETH);
  }
  if (tokenAddr.toHexString() == OptimismHtoken.SNX) {
    tokenAddr = Address.fromString(OptimismToken.SNX);
  }

  if (tokenAddr.toHexString() == XdaiHtoken.ETH) {
    tokenAddr = Address.fromString(XdaiToken.ETH);
  }

  if (tokenAddr == Address.fromString(XdaiHtoken.MATIC)) {
    tokenAddr = Address.fromString(XdaiToken.MATIC);
  }

  if (tokenAddr.toHexString() == ArbitrumHtoken.ETH) {
    tokenAddr = Address.fromString(ArbitrumToken.ETH);
  }

  if (priceTokens.includes(tokenAddr.toHexString())) {
    return CustomPriceType.initialize(
      constants.BIGDECIMAL_USD_PRICE,
      constants.DEFAULT_USDC_DECIMALS
    );
  }

  if (tokenAddr.toHexString() == XdaiToken.MATIC) {
    const uniSwapPair = UniswapPair.bind(
      Address.fromString("0x70cd033af4dc9763700d348e402dfeddb86e09e1")
    );

    let price: BigDecimal;
    let reserve = uniSwapPair.try_getReserves();
    if (!reserve.reverted) {
      price = reserve.value.value1
        .toBigDecimal()
        .div(reserve.value.value0.toBigDecimal());
      log.warning(
        "[UniswapV2Matic] tokenAddress: {}, Reserve1: {}, Reserve0: {}, Price: {}",
        [
          tokenAddr.toHexString(),
          reserve.value.value1.toString(),
          reserve.value.value0.toString(),
          price.toString(),
        ]
      );
      let x: CustomPriceType;
      x = CustomPriceType.initialize(price);
      return x;
    }
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
  // 8. uniswapV2
  if (
    tokenAddr.toHexString() == XdaiToken.ETH ||
    tokenAddr.toHexString() == XdaiHtoken.ETH
  ) {
    tokenAddr = Address.fromString(XdaiToken.ETH);

    const uniswapV2Price = UniswapV2.getTokenPriceUSDC(tokenAddr);
    if (!uniswapV2Price.reverted) {
      log.info("[UniswapV2Eth] tokenAddress: {}, Price: {}", [
        tokenAddr.toHexString(),
        uniswapV2Price.usdPrice.toString(),
      ]);
      return uniswapV2Price;
    }
  }

  if (tokenAddr.toHexString() == RewardTokens.GNO) {
    const uniSwapPair = UniswapPair.bind(
      Address.fromString("0xe9ad744f00f9c3c2458271b7b9f30cce36b74776")
    );

    let price: BigInt;

    let reserve = uniSwapPair.try_getReserves();
    if (!reserve.reverted) {
      price = reserve.value.value1.div(reserve.value.value0);
      log.warning(
        "[UniswapV2Matic] tokenAddress: {}, Reserve1: {}, Reserve0: {}, Price: {}",
        [
          tokenAddr.toHexString(),
          reserve.value.value1.toString(),
          reserve.value.value0.toString(),
          price.toString(),
        ]
      );
      let x: CustomPriceType;
      x = CustomPriceType.initialize(price.toBigDecimal());
      if (!x.reverted) {
        return x;
      }
    }
  }

  // 10. Uniswap Router
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
