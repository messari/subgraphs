import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { getPriceUsdc } from "../routers/SushiSwapRouter";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { CalculationsCompound as CalculationsCompoundContract } from "../../../generated/MainRegistry/CalculationsCompound";
import { exponentToBigInt } from "../../common/utils/numbers";
import { BIGDECIMAL_ONE } from "../../common/constants";

export function getTokenPriceFromCalculationCompound(tokenAddr: Address, network: string): CustomPriceType {
    let calculationCompoundContract = CalculationsCompoundContract.bind(tokenAddr);
    let exchangeRateStored = calculationCompoundContract.try_exchangeRateStored();
    if (exchangeRateStored.reverted) {
        return new CustomPriceType();
    }
    let underlyingToken = calculationCompoundContract.underlying();

    let STABLECOINS = constants.STABLECOINS_MAP.get(network)!;
    if (STABLECOINS.includes(underlyingToken.toHexString().toLowerCase())){
        return CustomPriceType.initialize(BIGDECIMAL_ONE,BigInt.fromI32(6))
    }
    /*
    let tokenPrice: BigDecimal = utils
        .readValue<BigInt>(calculationCurveContract.try_getCurvePriceUsdc(tokenAddr), constants.BIGINT_ZERO)
        .toBigDecimal();
    */
    //return CustomPriceType.initialize(tokenPrice);
    return new CustomPriceType();
}