import { log, Address, BigDecimal, dataSource, BigInt } from "@graphprotocol/graph-ts";
import * as constants from "./common/constants";
import { CustomPriceType } from "./common/types";
import * as AaveOracle from "./oracles/AaveOracle";
import * as UniswapForksRouter from "./routers/UniswapForksRouter";
import * as TraderJoeRouter from "./routers/TraderJoeRouter";
import * as SushiSwapRouter from "./routers/SushiSwapRouter";
import * as CurveRouter from "./routers/CurveRouter";
import { USDC_TOKEN_DECIMALS } from "./config/avalanche";

export function getUsdPricePerToken(tokenAddr: Address): CustomPriceType {
  // Check if tokenAddr is a NULL Address
  if (tokenAddr.toHex() == constants.ZERO_ADDRESS_STRING) {
    return new CustomPriceType();
  }

  // TraderJoe Router
  const traderJoePrice = TraderJoeRouter.getPriceUsdc(tokenAddr);
  if (!traderJoePrice.reverted) {
    return traderJoePrice;
  }

  // 6. Aave Oracle
  const aaveOraclePrice = AaveOracle.getTokenPriceUSDC(tokenAddr);
  if (!aaveOraclePrice.reverted) {
    return aaveOraclePrice;
  }

  // 7. SushiSwap Router
  const sushiswapPrice = SushiSwapRouter.getPriceUsdc(tokenAddr);
  if (!sushiswapPrice.reverted) {
    return sushiswapPrice;
  }

  const uniswapPrice = UniswapForksRouter.getTokenPriceUSDC(tokenAddr);
  if (!uniswapPrice.reverted) {
    return uniswapPrice;
  }

  const curvePrice = CurveRouter.getCurvePriceUsdc(tokenAddr);
  if (!curvePrice.reverted) {
    return curvePrice;
  }

  log.warning("[Oracle] Failed to Fetch Price, tokenAddr: {}", [
    tokenAddr.toHexString(),
  ]);

  return new CustomPriceType();
}

export function getUsdPricePerWrappedToken(tokenAddr: Address): CustomPriceType {
  if (tokenAddr === Address.fromString('0x5643f4b25e36478ee1e90418d5343cb6591bcb9d')) {
    // const baseToken = Address.fromString("0x62edc0692BD897D2295872a9FFCac5425011c661");

    // const basePrice = getBasePricePerWrappedToken(baseToken);
    // // const tokenContract = ERC20.bind(baseToken);
    // const baseBalance = BigInt.fromString("1445000000000000000");

    const amountOut = BigInt.fromString("1691573890")
      .toBigDecimal();
      
      // .times(BigInt.fromString("1691573890").toBigDecimal())
      // .div(BigInt.fromString("1691573890").toBigDecimal())

    const feeBips = BigInt.fromI32(30);

    // const amountOutBigDecimal = amountOut
    //   .times(constants.BIGINT_TEN_THOUSAND)
    //   .div(constants.BIGINT_TEN_THOUSAND.minus(feeBips.times(BigInt.fromI32(1))))
    //   .toBigDecimal();

    return CustomPriceType.initialize(
      amountOut,
      USDC_TOKEN_DECIMALS.toI32() as u8
    );
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
  let tokenPrice = getUsdPricePerToken(tokenAddr);

  if (!tokenPrice.reverted) {
    return tokenPrice.usdPrice.times(amount).div(tokenPrice.decimalsBaseTen);
  }

  return constants.BIGDECIMAL_ZERO;
}
