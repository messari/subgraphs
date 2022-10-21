import { Address, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { YakStrategyV2 } from "../../generated/YakStrategyV2/YakStrategyV2";
import { DEFUALT_AMOUNT, ZERO_BIGDECIMAL } from "../helpers/constants";
import { calculatePriceInUSD } from "./priceInUSDCalculator";
import { initVault } from "../initializers/vaultInitializer";

export function calculateDistributedReward(contractAddress: Address,
  timestamp: BigInt,
  blockNumber: BigInt,
  newTotalSupply: BigInt
): BigInt {
  const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);

  let depositTokenPrice: BigDecimal;
  if (yakStrategyV2Contract.try_depositToken().reverted) {
    depositTokenPrice = ZERO_BIGDECIMAL;
  } else {
    depositTokenPrice = calculatePriceInUSD(yakStrategyV2Contract.depositToken(), DEFUALT_AMOUNT);
  }

  const vault = initVault(contractAddress, timestamp, blockNumber);
  const beforeReinvestSupply = vault.outputTokenSupply;
  
  return newTotalSupply.minus(beforeReinvestSupply!);
}