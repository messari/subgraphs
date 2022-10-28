import { Address, BigInt, BigDecimal, bigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { YakStrategyV2 } from "../../generated/YakStrategyV2/YakStrategyV2";
import { ZERO_BIGDECIMAL, DEFUALT_AMOUNT } from "../helpers/constants";
import { calculatePriceInUSD } from "./priceInUSDCalculator";
import { calculateDistributedReward } from "./distributedRewardCalculator";
import { convertBigIntToBigDecimal } from "../helpers/converters";

export function calculateDistributedRewardInUSD(contractAddress: Address,
  distributedReward: BigInt,
): BigDecimal {
  const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);
  let depositTokenPrice: BigDecimal;

  if (yakStrategyV2Contract.try_depositToken().reverted) {
    depositTokenPrice = ZERO_BIGDECIMAL;
  } else {
    depositTokenPrice = calculatePriceInUSD(yakStrategyV2Contract.depositToken(), DEFUALT_AMOUNT);
  }

  let allFees: BigDecimal;

  if (yakStrategyV2Contract.try_DEV_FEE_BIPS().reverted || yakStrategyV2Contract.try_ADMIN_FEE_BIPS().reverted || yakStrategyV2Contract.try_REINVEST_REWARD_BIPS().reverted) {
    allFees = ZERO_BIGDECIMAL;
  } else {
    allFees = (yakStrategyV2Contract.DEV_FEE_BIPS().plus(yakStrategyV2Contract.ADMIN_FEE_BIPS().plus(yakStrategyV2Contract.REINVEST_REWARD_BIPS()))).toBigDecimal().div(bigDecimal.fromString("1000"));
  }

  return depositTokenPrice.times(convertBigIntToBigDecimal(distributedReward, 18));
}