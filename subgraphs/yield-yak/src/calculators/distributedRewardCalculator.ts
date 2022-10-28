import { Address, BigInt, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { YakStrategyV2 } from "../../generated/YakStrategyV2/YakStrategyV2";
import { DEFUALT_AMOUNT, ZERO_BIGDECIMAL } from "../helpers/constants";
import { calculatePriceInUSD } from "./priceInUSDCalculator";
import { getOrCreateVault } from "../common/initializers";

export function calculateDistributedReward(contractAddress: Address,
  block: ethereum.Block,
  newTotalSupply: BigInt
): BigInt {
  const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);

  let depositTokenPrice: BigDecimal;
  if (yakStrategyV2Contract.try_depositToken().reverted) {
    depositTokenPrice = ZERO_BIGDECIMAL;
  } else {
    depositTokenPrice = calculatePriceInUSD(yakStrategyV2Contract.depositToken(), DEFUALT_AMOUNT);
  }

  const vault = getOrCreateVault(contractAddress, block);
  const beforeReinvestSupply = vault.outputTokenSupply;

  return newTotalSupply.minus(beforeReinvestSupply);
}