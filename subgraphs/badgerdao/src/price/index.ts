import { Address, BigDecimal, dataSource, log } from "@graphprotocol/graph-ts";
import { getTokenPriceFromCalculationCurve } from "./calculations/CalculationsCurve";
import { getTokenPriceFromSushiSwap } from "./calculations/CalculationsSushiswap";
import * as constants from "./common/constants";
import { CustomPriceType } from "./common/types";
import { getUsdPriceOfBadgerWbtcToken } from "./custom/BadgerWbtc";
import { getUsdPriceOfWbtcDiggToken } from "./custom/WbtcDigg";
import { getTokenPriceFromChainLink } from "./oracles/ChainLinkFeed";
import { getTokenPriceFromYearnLens } from "./oracles/YearnLensOracle";
import { getCurvePriceUsdc } from "./routers/CurveRouter";
import { getPriceUsdc as getPriceUsdcSushiswap } from "./routers/SushiSwapRouter";
import { getPriceUsdc as getPriceUsdcUniswap } from "./routers/UniswapRouter";

export function getUsdPricePerToken(tokenAddr: Address): CustomPriceType {
  // Check if tokenAddr is a NULL Address
  if (tokenAddr.toHex() == constants.ZERO_ADDRESS_STRING) {
    return new CustomPriceType();
  }

  let network = dataSource.network();

  // if it is Digg token
  if (tokenAddr == Address.fromString("0x798D1bE841a82a273720CE31c822C61a67a601C3")) {
    let wbtcDiggPrice = getUsdPriceOfWbtcDiggToken(tokenAddr, network);
    if (!wbtcDiggPrice.reverted) {
      log.warning("[WBTCDIGG] tokenAddress: {}, Price: {}", [
        tokenAddr.toHexString(),
        wbtcDiggPrice.usdPrice.div(wbtcDiggPrice.decimalsBaseTen).toString(),
      ]);
      return wbtcDiggPrice;
    }
  }

  // if it is badger/wbtc token
  if (tokenAddr == Address.fromString("0x137469B55D1f15651BA46A89D0588e97dD0B6562")) {
    let badgerWbtcPrice = getUsdPriceOfBadgerWbtcToken(tokenAddr);
    if (!badgerWbtcPrice.reverted) {
      log.warning("[BADGERWBTC] tokenAddress: {}, Price: {}", [
        tokenAddr.toHexString(),
        badgerWbtcPrice.usdPrice.div(badgerWbtcPrice.decimalsBaseTen).toString(),
      ]);
      return badgerWbtcPrice;
    }
  }

  // 2. ChainLink Feed Registry
  let chainLinkPrice = getTokenPriceFromChainLink(tokenAddr, network);
  if (!chainLinkPrice.reverted) {
    log.warning("[ChainLinkFeed] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      chainLinkPrice.usdPrice.div(chainLinkPrice.decimalsBaseTen).toString(),
    ]);
    return chainLinkPrice;
  }

  // 1. Yearn Lens Oracle
  let yearnLensPrice = getTokenPriceFromYearnLens(tokenAddr, network);
  if (!yearnLensPrice.reverted) {
    log.warning("[YearnLensOracle] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      yearnLensPrice.usdPrice.div(yearnLensPrice.decimalsBaseTen).toString(),
    ]);
    return yearnLensPrice;
  }

  // 3. CalculationsCurve
  let calculationsCurvePrice = getTokenPriceFromCalculationCurve(tokenAddr, network);
  if (!calculationsCurvePrice.reverted) {
    log.warning("[CalculationsCurve] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      calculationsCurvePrice.usdPrice.div(calculationsCurvePrice.decimalsBaseTen).toString(),
    ]);
    return calculationsCurvePrice;
  }

  // 4. CalculationsSushiSwap
  let calculationsSushiSwapPrice = getTokenPriceFromSushiSwap(tokenAddr, network);
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
  let curvePrice = getCurvePriceUsdc(tokenAddr, network);
  if (!curvePrice.reverted) {
    log.warning("[CurveRouter] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      curvePrice.usdPrice.div(curvePrice.decimalsBaseTen).toString(),
    ]);
    return curvePrice;
  }

  // 6. Uniswap Router
  let uniswapPrice = getPriceUsdcUniswap(tokenAddr, network);
  if (!uniswapPrice.reverted) {
    log.warning("[UniswapRouter] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      uniswapPrice.usdPrice.div(uniswapPrice.decimalsBaseTen).toString(),
    ]);
    return uniswapPrice;
  }

  // 7. SushiSwap Router
  let sushiswapPrice = getPriceUsdcSushiswap(tokenAddr, network);
  if (!sushiswapPrice.reverted) {
    log.warning("[SushiSwapRouter] tokenAddress: {}, Price: {} {}", [
      tokenAddr.toHexString(),
      sushiswapPrice.usdPrice.toString(),
      sushiswapPrice.usdPrice.div(sushiswapPrice.decimalsBaseTen).toString(),
    ]);
    return sushiswapPrice;
  }

  log.warning("[Oracle] Failed to Fetch Price, tokenAddr: {}", [tokenAddr.toHexString()]);

  return new CustomPriceType();
}

export function getUsdPrice(tokenAddr: Address, amount: BigDecimal): BigDecimal {
  let tokenPrice = getUsdPricePerToken(tokenAddr);

  if (!tokenPrice.reverted) {
    return tokenPrice.usdPrice.times(amount).div(tokenPrice.decimalsBaseTen);
  }

  return constants.BIGDECIMAL_ZERO;
}
// function getSushiLPTokenPrice(tokenAddr: Address) {
//   // bitcoin price
//   // slp total reserves of token 0
//   // slp total supply
//   let bitcoinPrice = getPriceFromRouterUsdc(
//     Address.fromString("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"),
//     dataSource.network(),
//   );
//   const sushiswapPair = SushiSwapPairContract.bind(tokenAddr);

//   let reserves = utils.readValue<SushiSwapPair__getReservesResult>(
//     sushiswapPair.try_getReserves(),
//     constants.SUSHISWAP_DEFAULT_RESERVE_CALL,
//   );
//   let reserve0 = reserves.value0
//     .toBigDecimal()
//     .div(.BIGINT_TEN.pow(18 as u8))
//     .toBigDecimal();

//   let totalSupply = utils.readValue<BigInt>(sushiswapPair.try_totalSupply(), constants.BIGINT_ZERO);
// }
