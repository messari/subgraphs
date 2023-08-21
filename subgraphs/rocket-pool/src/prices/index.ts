import * as constants from "./common/constants";
import { CustomPriceType } from "./common/types";
import { getCurvePriceUsdc } from "./routers/CurveRouter";
import { getTokenPriceFromChainLink } from "./oracles/ChainLinkFeed";
import { getTokenPriceFromYearnLens } from "./oracles/YearnLensOracle";
import { getPriceUsdc as getPriceUsdcUniswap } from "./routers/UniswapRouter";
import {
  log,
  Address,
  BigDecimal,
  dataSource,
  BigInt,
} from "@graphprotocol/graph-ts";
import { getPriceUsdc as getPriceUsdcSushiswap } from "./routers/SushiSwapRouter";
import { getTokenPriceFromSushiSwap } from "./calculations/CalculationsSushiswap";
import { getTokenPriceFromCalculationCurve } from "./calculations/CalculationsCurve";
import { RETH_ADDRESS, RPL_ADDRESS, ETH_ADDRESS } from "../utils/constants";
import { rocketTokenRETH } from "../../generated/templates/rocketTokenRETH/rocketTokenRETH";
import { rocketNetworkPrices } from "../../generated/templates/rocketNetworkPrices/rocketNetworkPrices";
import * as utils from "./common/utils";
import { getRocketContract } from "../entities/rocketContracts";
import { RocketContractNames } from "../constants/contractConstants";

export function getUsdPricePerToken(tokenAddr: Address): CustomPriceType {
  // Check if tokenAddr is a NULL Address
  if (tokenAddr.toHex() == constants.ZERO_ADDRESS_STRING) {
    return new CustomPriceType();
  }

  if (tokenAddr.equals(Address.fromString(RETH_ADDRESS))) {
    const rethPriceContract = rocketTokenRETH.bind(
      Address.fromString(RETH_ADDRESS)
    );

    if (!rethPriceContract) {
      return new CustomPriceType();
    }

    const exchangeRate: BigDecimal = utils
      .readValue<BigInt>(
        rethPriceContract.try_getExchangeRate(),
        constants.BIGINT_ZERO
      )
      .toBigDecimal();

    const ethPrice = getUsdPricePerToken(Address.fromString(ETH_ADDRESS));

    const exchangeRateDiv = exchangeRate.div(
      ethPrice.decimalsBaseTen.times(ethPrice.decimalsBaseTen)
    );

    const tokenPrice: BigDecimal = ethPrice.usdPrice
      .times(exchangeRateDiv)
      .div(BigDecimal.fromString("1000000"));

    return CustomPriceType.initialize(
      tokenPrice,
      constants.DEFAULT_USDC_DECIMALS
    );
  }

  if (tokenAddr.equals(Address.fromString(RPL_ADDRESS))) {
    const rplPriceContractEntity = getRocketContract(
      RocketContractNames.ROCKET_NETWORK_PRICES
    );
    const rplPriceContract = rocketNetworkPrices.bind(
      Address.fromBytes(rplPriceContractEntity.latestAddress)
    );

    if (!rplPriceContract) {
      return new CustomPriceType();
    }

    const tokenPriceInEth: BigDecimal = utils
      .readValue<BigInt>(
        rplPriceContract.try_getRPLPrice(),
        constants.BIGINT_ZERO
      )
      .toBigDecimal();
    const ethPrice = getUsdPricePerToken(Address.fromString(ETH_ADDRESS));

    const tokenPrice = tokenPriceInEth
      .times(ethPrice.usdPrice)
      .div(ethPrice.decimalsBaseTen);

    return CustomPriceType.initialize(tokenPrice, constants.EIGHTEEN_DECIMALS);
  }

  const network = dataSource.network();

  // 1. Yearn Lens Oracle
  const yearnLensPrice = getTokenPriceFromYearnLens(tokenAddr, network);
  if (!yearnLensPrice.reverted) {
    log.warning("[YearnLensOracle] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      yearnLensPrice.usdPrice.div(yearnLensPrice.decimalsBaseTen).toString(),
    ]);
    return yearnLensPrice;
  }

  // 2. ChainLink Feed Registry
  const chainLinkPrice = getTokenPriceFromChainLink(tokenAddr, network);
  if (!chainLinkPrice.reverted) {
    log.warning("[ChainLinkFeed] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      chainLinkPrice.usdPrice.div(chainLinkPrice.decimalsBaseTen).toString(),
    ]);
    return chainLinkPrice;
  }

  //3. CalculationsCurve
  const calculationsCurvePrice = getTokenPriceFromCalculationCurve(
    tokenAddr,
    network
  );
  if (!calculationsCurvePrice.reverted) {
    log.warning("[CalculationsCurve] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      calculationsCurvePrice.usdPrice
        .div(calculationsCurvePrice.decimalsBaseTen)
        .toString(),
    ]);
    return calculationsCurvePrice;
  }

  // 4. CalculationsSushiSwap
  const calculationsSushiSwapPrice = getTokenPriceFromSushiSwap(
    tokenAddr,
    network
  );
  if (!calculationsSushiSwapPrice.reverted) {
    log.warning("[CalculationsSushiSwap] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      calculationsSushiSwapPrice.usdPrice
        .div(calculationsSushiSwapPrice.decimalsBaseTen)
        .toString(),
    ]);
    return calculationsSushiSwapPrice;
  }

  // 5. Curve Router
  const curvePrice = getCurvePriceUsdc(tokenAddr, network);
  if (!curvePrice.reverted) {
    log.warning("[CurveRouter] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      curvePrice.usdPrice.div(curvePrice.decimalsBaseTen).toString(),
    ]);
    return curvePrice;
  }

  // 6. Uniswap Router
  const uniswapPrice = getPriceUsdcUniswap(tokenAddr, network);
  if (!uniswapPrice.reverted) {
    log.warning("[UniswapRouter] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      uniswapPrice.usdPrice.div(uniswapPrice.decimalsBaseTen).toString(),
    ]);
    return uniswapPrice;
  }

  // 7. SushiSwap Router
  const sushiswapPrice = getPriceUsdcSushiswap(tokenAddr, network);
  if (!sushiswapPrice.reverted) {
    log.warning("[SushiSwapRouter] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      sushiswapPrice.usdPrice.div(sushiswapPrice.decimalsBaseTen).toString(),
    ]);
    return sushiswapPrice;
  }

  log.warning("[Oracle] Failed to Fetch Price, tokenAddr: {}", [
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
    return tokenPrice.usdPrice.times(amount).div(tokenPrice.decimalsBaseTen);
  }

  return constants.BIGDECIMAL_ZERO;
}
