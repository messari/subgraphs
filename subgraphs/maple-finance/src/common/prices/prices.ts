import { BigDecimal, BigInt, ethereum, log, dataSource, Address } from "@graphprotocol/graph-ts";
import { Token } from "../../../generated/schema";

import { chainlinkOracleGetTokenPriceInUSD } from "./oracles/chainlink";
import { mapleOracleGetTokenPriceInUSD } from "./oracles/maple";
import { yearnOracleGetTokenPriceInUSD } from "./oracles/yearn";
import { ZERO_BD, OracleType, MAPLE_GLOBALS_ORACLE_QUOTE_DECIMALS } from "../constants";
import { parseUnits } from "../utils";

import * as constants from "./common/constants";
import { CustomPriceType } from "./common/types";
import { getCurvePriceUsdc } from "./routers/CurveRouter";
import { getPriceUsdc as getPriceUsdcUniswap } from "./routers/UniswapRouter";
import { getPriceUsdc as getPriceUsdcSushiswap } from "./routers/SushiSwapRouter";
import { getTokenPriceFromSushiSwap } from "./calculations/CalculationsSushiswap";
import { getTokenPriceFromCalculationCurve } from "./calculations/CalculationsCurve";

export function getTokenPriceInUSD(event: ethereum.Event, token: Token): BigDecimal {
    const network = dataSource.network();
    const tokenAddress = Address.fromString(token.id);

    // 1. Maple Oracle
    let mapleLensPrice = mapleOracleGetTokenPriceInUSD(token);
    if (mapleLensPrice) {
        token._lastPriceOracle = OracleType.MAPLE;
        token.save();
        return mapleLensPrice;
    }

    // 2. ChainLink Feed Registry
    let chainLinkPrice = chainlinkOracleGetTokenPriceInUSD(token);
    if (chainLinkPrice) {
        token._lastPriceOracle = OracleType.CHAIN_LINK;
        token.save();
        return chainLinkPrice;
    }

    // 3. Yearn Lens Oracle
    let yearnLensPrice = yearnOracleGetTokenPriceInUSD(token);
    if (yearnLensPrice) {
        token._lastPriceOracle = OracleType.YEARN_LENS;
        token.save();
        return yearnLensPrice;
    }

    // 4. CalculationsCurve
    let calculationsCurvePrice = getTokenPriceFromCalculationCurve(tokenAddress, network);
    if (!calculationsCurvePrice.reverted) {
        token._lastPriceOracle = OracleType.CURVE_CALC;
        token.save();
        return calculationsCurvePrice.usdPrice;
    }

    // 5. CalculationsSushiSwap
    let calculationsSushiSwapPrice = getTokenPriceFromSushiSwap(tokenAddress, network);
    if (!calculationsSushiSwapPrice.reverted) {
        token._lastPriceOracle = OracleType.SUSHISWAP_CALC;
        token.save();
        return calculationsSushiSwapPrice.usdPrice;
    }

    // 6. Curve Router
    let curvePrice = getCurvePriceUsdc(tokenAddress, network);
    if (!curvePrice.reverted) {
        token._lastPriceOracle = OracleType.CURVE_ROUTE;
        token.save();
        return curvePrice.usdPrice;
    }

    // 7. Uniswap Router
    let uniswapPrice = getPriceUsdcUniswap(tokenAddress, network);
    if (!uniswapPrice.reverted) {
        token._lastPriceOracle = OracleType.UNISWAP_ROUTE;
        token.save();
        return uniswapPrice.usdPrice;
    }

    // 8. SushiSwap Router
    let sushiswapPrice = getPriceUsdcSushiswap(tokenAddress, network);
    if (!sushiswapPrice.reverted) {
        token._lastPriceOracle = OracleType.SUSHISWAP_ROUTE;
        token.save();
        return sushiswapPrice.usdPrice;
    }

    token._lastPriceOracle = OracleType.ERROR_NOT_FOUND;
    log.warning("[Oracle] Failed to Fetch Price, tokenAddr: {}", [token.id]);

    return ZERO_BD;
}

export function getTokenAmountInUSD(event: ethereum.Event, token: Token, amount: BigInt): BigDecimal {
    const tokenPrice = getTokenPriceInUSD(event, token);

    return parseUnits(amount, token.decimals).times(tokenPrice);
}
