import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { getPriceUsdc } from "../routers/SushiSwapRouter";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { CalculationsCompound as CalculationsCompoundContract } from "../../../generated/MainRegistry/CalculationsCompound";
import { bigIntToBigDecimal, exponentToBigInt } from "../../common/utils/numbers";
import { BIGDECIMAL_ONE } from "../../common/constants";
import { getOrCreateToken } from "../../common/getters";


function getUnderlyingPrice(tokenAddr: Address, network: string): CustomPriceType {
    if (utils.isStableCoin(tokenAddr,network)) {
        return CustomPriceType.initialize(BIGDECIMAL_ONE);
    }
    return getPriceUsdc(tokenAddr, network);
}


export function getTokenPriceFromCalculationCompound(tokenAddr: Address, network: string): CustomPriceType {
    let calculationCompoundContract = CalculationsCompoundContract.bind(tokenAddr);
    let exchangeRateStored = calculationCompoundContract.try_exchangeRateStored();
    if (exchangeRateStored.reverted) {
        return new CustomPriceType();
    }
    let underlyingTokenAddress = calculationCompoundContract.underlying();
    let underlyingToken = getOrCreateToken(underlyingTokenAddress);
    let underlyingPrice = getUnderlyingPrice(underlyingTokenAddress, network);
    if (underlyingPrice.reverted){
        return new CustomPriceType();
    }
    let priceUSD = bigIntToBigDecimal(exchangeRateStored.value,underlyingToken.decimals + constants.exchangeRateMantissa).times(underlyingPrice.usdPrice)
    return CustomPriceType.initialize(priceUSD,constants.BIGINT_ZERO);
}