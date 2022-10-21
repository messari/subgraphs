import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { YakStrategyV2 } from "../../generated/YakStrategyV2/YakStrategyV2";
import { ZERO_BIGDECIMAL } from "../helpers/constants";
import { calculatePriceInUSD } from "./priceInUSDCalculator";
import { DEFUALT_AMOUNT } from "../helpers/constants";
import { convertBigIntToBigDecimal } from "../helpers/converters";

export function calculateOutputTokenPriceInUSD(contractAddress: Address): BigDecimal {
  const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);
  let outputTokenPriceInUSD: BigDecimal;

  if (yakStrategyV2Contract.try_depositToken().reverted || yakStrategyV2Contract.try_getSharesForDepositTokens(DEFUALT_AMOUNT).reverted) {
    return ZERO_BIGDECIMAL;
  } else {
    const depositTokenPrice: BigDecimal = calculatePriceInUSD(yakStrategyV2Contract.depositToken(), DEFUALT_AMOUNT);
    const getSharesForDepositToken: BigInt = yakStrategyV2Contract.getSharesForDepositTokens(DEFUALT_AMOUNT);
    const getSharesForDepositTokenInDecimal: BigDecimal = convertBigIntToBigDecimal(getSharesForDepositToken, 18);

    if (getSharesForDepositTokenInDecimal != ZERO_BIGDECIMAL) {
      outputTokenPriceInUSD = depositTokenPrice.div(getSharesForDepositTokenInDecimal);
    } else {
      outputTokenPriceInUSD = ZERO_BIGDECIMAL;
    }
  }
  
  return outputTokenPriceInUSD;
}