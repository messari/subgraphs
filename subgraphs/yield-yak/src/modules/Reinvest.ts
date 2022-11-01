import { Address, ethereum, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { Vault } from "../../generated/schema";
import {
  calculateDistributedRewardInUSD,
  calculateProtocolRewardInUSD,
  calculateAllDistributedRewardInUSD,
  calculateDistributedReward
} from "../common/calculators";
import { getOrCreateFinancialDailySnapshots, getOrCreateYieldAggregator } from "../common/initializers";

export function _Reinvest(
  contractAddress: Address,
  block: ethereum.Block,
  vault: Vault,
  newTotalSupply: BigInt
): void {
  const numberOfRewardTokens = vault.rewardTokens!.length;

  const distributedReward = calculateDistributedReward(contractAddress, block, newTotalSupply);
  const distributedRewardInUSD = calculateDistributedRewardInUSD(contractAddress, distributedReward);
  const protocolRewardInUSD = calculateProtocolRewardInUSD(contractAddress, distributedReward);
  const allDistributedRewardInUSD = calculateAllDistributedRewardInUSD(contractAddress, distributedReward);

  if (numberOfRewardTokens > 0) {
    for (let i = 0; i < numberOfRewardTokens; i++) {
      const tokenIndex = vault.rewardTokens!.indexOf(vault.rewardTokens![i]);
      vault.rewardTokenEmissionsAmount![tokenIndex] = (vault.rewardTokenEmissionsAmount![tokenIndex]).plus(distributedReward);
      vault.rewardTokenEmissionsUSD![tokenIndex] = vault.rewardTokenEmissionsUSD![tokenIndex].plus(distributedRewardInUSD);
    }
  }
  vault.save();

  updateFinancialsRewardAfterReinvest(block, vault, allDistributedRewardInUSD, distributedRewardInUSD, protocolRewardInUSD);
}

export function updateFinancialsRewardAfterReinvest(
  block: ethereum.Block,
  vault: Vault,
  allDistributedRewardInUSD: BigDecimal,
  distributedRewardInUSD: BigDecimal,
  protocolRewardInUSD: BigDecimal
): void {
  const financialMetrics = getOrCreateFinancialDailySnapshots(block);
  const protocol = getOrCreateYieldAggregator();

  vault.cumulativeSupplySideRevenueUSD = vault.cumulativeSupplySideRevenueUSD.plus(
    distributedRewardInUSD
  );

  vault.cumulativeProtocolSideRevenueUSD = vault.cumulativeProtocolSideRevenueUSD.plus(
    protocolRewardInUSD
  );

  vault.cumulativeTotalRevenueUSD = vault.cumulativeTotalRevenueUSD.plus(
    allDistributedRewardInUSD
  );

  financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(
    allDistributedRewardInUSD
  );

  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(
    allDistributedRewardInUSD
  );

  financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;

  financialMetrics.dailySupplySideRevenueUSD = financialMetrics.dailySupplySideRevenueUSD.plus(
    distributedRewardInUSD
  );

  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(
    distributedRewardInUSD
  );

  financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;

  financialMetrics.dailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(
    protocolRewardInUSD
  );

  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(
    protocolRewardInUSD
  );

  financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;

  financialMetrics.save();
  protocol.save();
  vault.save();
}