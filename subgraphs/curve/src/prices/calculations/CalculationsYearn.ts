import { IronBankToken } from "../../../generated/MainRegistry/IronBankToken";
import { YearnTokenV1 } from "../../../generated/MainRegistry/YearnTokenV1";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { CustomPriceType } from "../common/types";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { getPriceUsdc } from "../routers/SushiSwapRouter";
import { getTokenPriceFromCalculationAave } from "./CalculationsAAVE";

export function getTokenPriceFromCalculationYearn(tokenAddr: Address, network: string): CustomPriceType {
  let tokensMapping = constants.WHITELIST_TOKENS_MAP.get(network);

  let calculationYearnContract = IronBankToken.bind(tokenAddr);
  let underlyingToken: Address = utils.readValue<Address>(
    calculationYearnContract.try_underlying(),
    constants.ZERO_ADDRESS,
  );
  if (underlyingToken == constants.ZERO_ADDRESS) {
    return new CustomPriceType();
  }
  let exchangeRateStored: BigDecimal = utils
    .readValue<BigInt>(calculationYearnContract.try_exchangeRateStored(), constants.BIGINT_ZERO)
    .toBigDecimal();
  let exchangeRateMantissa = utils.getTokenDecimals(underlyingToken).plus(BigInt.fromString("8"));
  let underlyingPrice = getPriceUsdc(underlyingToken, network);
  let usdcDecimals = utils.getTokenDecimals(tokensMapping!.get("USDC")!);
  let decimalsAdjustment = constants.DEFAULT_DECIMALS.minus(usdcDecimals);
  let tokenPrice = exchangeRateStored
    .times(underlyingPrice.usdPrice)
    .times(constants.BIGINT_TEN.pow(decimalsAdjustment.toI32() as u8).toBigDecimal())
    .div(constants.BIGINT_TEN.pow(decimalsAdjustment.plus(exchangeRateMantissa).toI32() as u8).toBigDecimal());
  return CustomPriceType.initialize(tokenPrice);
}

export function getTokenPriceFromCalculationYearnV1(tokenAddr: Address, network: string): CustomPriceType {
  let tokensMapping = constants.WHITELIST_TOKENS_MAP.get(network);

  let calculationYearnContract = YearnTokenV1.bind(tokenAddr);
  let underlyingToken: Address = utils.readValue<Address>(
    calculationYearnContract.try_aaveToken(),
    constants.ZERO_ADDRESS,
  );
  if (underlyingToken == constants.ZERO_ADDRESS) {
    return new CustomPriceType();
  }
  let pricePerFullShare: BigDecimal = utils
    .readValue<BigInt>(calculationYearnContract.try_getPricePerFullShare(), constants.BIGINT_ZERO)
    .toBigDecimal();
  let underlyingPrice = getTokenPriceFromCalculationAave(underlyingToken, network);

  let usdcDecimals = utils.getTokenDecimals(tokensMapping!.get("USDC")!);
  let decimalsAdjustment = constants.DEFAULT_DECIMALS.minus(usdcDecimals);
  let tokenPrice = pricePerFullShare
    .times(underlyingPrice.usdPrice)
    .times(constants.BIGINT_TEN.pow(decimalsAdjustment.toI32() as u8).toBigDecimal())
    .div(constants.BIGINT_TEN.pow(decimalsAdjustment.plus(constants.DEFAULT_DECIMALS).toI32() as u8).toBigDecimal());
  return CustomPriceType.initialize(tokenPrice);
}
