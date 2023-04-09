import { BigDecimal, BigInt, ethereum, log, dataSource, Address } from "@graphprotocol/graph-ts";
import { Token } from "../../../generated/schema";
import { chainlinkOracleGetTokenPriceInUSD } from "./oracles/chainlink";
import { mapleOracleGetTokenPriceInUSD } from "./oracles/maple";
import { yearnOracleGetTokenPriceInUSD } from "./oracles/yearn";
import { ZERO_BD, OracleType, ZERO_BI } from "../constants";
import { parseUnits, readCallResult } from "../utils";
import { getCurvePriceUsdc } from "./routers/CurveRouter";
import { getPriceUsdc as getPriceUsdcUniswap } from "./routers/UniswapRouter";
import { getPriceUsdc as getPriceUsdcSushiswap } from "./routers/SushiSwapRouter";
import { getTokenPriceFromSushiSwap } from "./calculations/CalculationsSushiswap";
import { getTokenPriceFromCalculationCurve } from "./calculations/CalculationsCurve";
import { BalancerPool } from "../../../generated/templates/Pool/BalancerPool";
import { getOrCreateToken } from "../mappingHelpers/getOrCreate/supporting";

export function getTokenPriceInUSD(event: ethereum.Event, token: Token): BigDecimal {
    const network = dataSource.network();
    const tokenAddress = Address.fromString(token.id);

    // 1. Maple Oracle
    const mapleLensPrice = mapleOracleGetTokenPriceInUSD(token);
    if (mapleLensPrice) {
        token._lastPriceOracle = OracleType.MAPLE;
        token.lastPriceUSD = mapleLensPrice;
        token.lastPriceBlockNumber = event.block.number;
        token.save();
        return mapleLensPrice;
    }

    // 2. ChainLink Feed Registry
    const chainLinkPrice = chainlinkOracleGetTokenPriceInUSD(token);
    if (chainLinkPrice) {
        token._lastPriceOracle = OracleType.CHAIN_LINK;
        token.lastPriceUSD = chainLinkPrice;
        token.lastPriceBlockNumber = event.block.number;
        token.save();
        return chainLinkPrice;
    }

    // 3. Yearn Lens Oracle
    const yearnLensPrice = yearnOracleGetTokenPriceInUSD(token);
    if (yearnLensPrice) {
        token._lastPriceOracle = OracleType.YEARN_LENS;
        token.lastPriceUSD = yearnLensPrice;
        token.lastPriceBlockNumber = event.block.number;
        token.save();
        return yearnLensPrice;
    }

    // 4. CalculationsCurve
    const calculationsCurvePrice = getTokenPriceFromCalculationCurve(tokenAddress, network);
    if (!calculationsCurvePrice.reverted) {
        token._lastPriceOracle = OracleType.CURVE_CALC;
        token.lastPriceUSD = calculationsCurvePrice.usdPrice;
        token.lastPriceBlockNumber = event.block.number;
        token.save();
        return calculationsCurvePrice.usdPrice;
    }

    // 5. CalculationsSushiSwap
    const calculationsSushiSwapPrice = getTokenPriceFromSushiSwap(tokenAddress, network);
    if (!calculationsSushiSwapPrice.reverted) {
        token._lastPriceOracle = OracleType.SUSHISWAP_CALC;
        token.lastPriceUSD = calculationsSushiSwapPrice.usdPrice;
        token.lastPriceBlockNumber = event.block.number;
        token.save();
        return calculationsSushiSwapPrice.usdPrice;
    }

    // 6. Curve Router
    const curvePrice = getCurvePriceUsdc(tokenAddress, network);
    if (!curvePrice.reverted) {
        token._lastPriceOracle = OracleType.CURVE_ROUTE;
        token.lastPriceUSD = curvePrice.usdPrice;
        token.lastPriceBlockNumber = event.block.number;
        token.save();
        return curvePrice.usdPrice;
    }

    // 7. Uniswap Router
    const uniswapPrice = getPriceUsdcUniswap(tokenAddress, network);
    if (!uniswapPrice.reverted) {
        token._lastPriceOracle = OracleType.UNISWAP_ROUTE;
        token.lastPriceUSD = uniswapPrice.usdPrice;
        token.lastPriceBlockNumber = event.block.number;
        token.save();
        return uniswapPrice.usdPrice;
    }

    // 8. SushiSwap Router
    const sushiswapPrice = getPriceUsdcSushiswap(tokenAddress, network);
    if (!sushiswapPrice.reverted) {
        token._lastPriceOracle = OracleType.SUSHISWAP_ROUTE;
        token.lastPriceUSD = sushiswapPrice.usdPrice;
        token.lastPriceBlockNumber = event.block.number;
        token.save();
        return sushiswapPrice.usdPrice;
    }

    token._lastPriceOracle = OracleType.ERROR_NOT_FOUND;
    log.warning("[Oracle] Failed to Fetch Price, tokenAddr: {}", [token.id]);

    return ZERO_BD;
}

export function getTokenAmountInUSD(event: ethereum.Event, token: Token, amount: BigInt): BigDecimal {
    const tokenPriceUSD = getTokenPriceInUSD(event, token);

    return parseUnits(amount, token.decimals).times(tokenPriceUSD);
}

export function getBptTokenPriceUSD(event: ethereum.Event, bptToken: Token): BigDecimal {
    const balancerContract = BalancerPool.bind(Address.fromString(bptToken.id));

    const inputTokenAddresses = readCallResult(
        balancerContract.try_getCurrentTokens(),
        new Array<Address>(),
        balancerContract.try_getCurrentTokens.name
    );

    const totalBptSupply = readCallResult(
        balancerContract.try_totalSupply(),
        ZERO_BI,
        balancerContract.try_totalSupply.name
    );

    let balanceUSD = ZERO_BD;
    for (let i = 0; i < inputTokenAddresses.length; i++) {
        const address = inputTokenAddresses[i];
        const token = getOrCreateToken(address);
        const tokenBalance = readCallResult(
            balancerContract.try_getBalance(address),
            ZERO_BI,
            balancerContract.try_getBalance.name
        );
        const tokenAmountUSD = getTokenAmountInUSD(event, token, tokenBalance);
        balanceUSD = balanceUSD.plus(tokenAmountUSD);
    }

    const pricePerBptUSD = totalBptSupply.notEqual(ZERO_BI)
        ? balanceUSD.div(parseUnits(totalBptSupply, bptToken.decimals))
        : ZERO_BD;

    return pricePerBptUSD;
}

export function getBptTokenAmountInUSD(event: ethereum.Event, bptToken: Token, amount: BigInt): BigDecimal {
    const tokenPriceUSD = getBptTokenPriceUSD(event, bptToken);

    return parseUnits(amount, bptToken.decimals).times(tokenPriceUSD);
}
