import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { allDistributedRewardInUSDCalculator, distributedRewardCalculator, distributedRewardInUSDCalculator, protocolRewardInUSDCalculator } from "./distributedRewardCalculator";
import { defineFinancialsDailySnapshotEntity, defineProtocol, defineVault, defineVaultDailySnapshot, defineVaultHourlySnapshot } from "./initialDefineOrLoad";
import { log } from '@graphprotocol/graph-ts'

export function updateRewardParametersOfDailyOrHourlyEntities(contractAddress: Address, timestamp: BigInt, blockNumber: BigInt, newTotalSupply: BigInt): void {
  let distributedReward = distributedRewardCalculator(contractAddress, timestamp, blockNumber, newTotalSupply);

  let distributedRewardInUSD = distributedRewardInUSDCalculator(contractAddress, timestamp, blockNumber, newTotalSupply);
  let protocolRewardInUSD = protocolRewardInUSDCalculator(contractAddress, timestamp, blockNumber, newTotalSupply);
  let allDistributedRewardInUSD = allDistributedRewardInUSDCalculator(contractAddress, timestamp, blockNumber, newTotalSupply);

  let vault = defineVault(contractAddress, timestamp, blockNumber);
  let numberOfRewardTokens = vault.rewardTokens!.length;

  rewardForProtocolUpdater(contractAddress, distributedRewardInUSD, protocolRewardInUSD);
  rewardForVaultUpdater(contractAddress, timestamp, blockNumber, numberOfRewardTokens, distributedReward, distributedRewardInUSD);
  rewardForVaultDailySnapshotUpdater(contractAddress, timestamp, blockNumber, numberOfRewardTokens, distributedReward, distributedRewardInUSD);
  rewardForVaultHourlySnapshotUpdater(contractAddress, timestamp, blockNumber, numberOfRewardTokens, distributedReward, distributedRewardInUSD);
  rewardForFinancialsDailySnapshotUpdater(contractAddress, timestamp, blockNumber,distributedRewardInUSD,protocolRewardInUSD,allDistributedRewardInUSD);
}

function rewardForProtocolUpdater(
  contractAddress: Address,
  distributedRewardInUSD: BigDecimal,
  protocolRewardInUSD: BigDecimal): void {
  let protocol = defineProtocol(contractAddress);

  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(distributedRewardInUSD);
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(protocolRewardInUSD);
  protocol.save();
}

function rewardForVaultUpdater(
  contractAddress: Address,
  timestamp: BigInt,
  blockNumber: BigInt,
  numberOfRewardTokens: number,
  distributedReward: BigInt,
  distributedRewardInUSD: BigDecimal): void {
  let vault = defineVault(contractAddress, timestamp, blockNumber);
  if (numberOfRewardTokens > 0) {
    for (let index = 0; index < numberOfRewardTokens; index++) {
      let tokenIndex = vault.rewardTokens!.indexOf(vault.rewardTokens![index]);
      vault.rewardTokenEmissionsAmount![tokenIndex] = (vault.rewardTokenEmissionsAmount![tokenIndex]).plus(distributedReward);
      vault.rewardTokenEmissionsUSD![tokenIndex] = vault.rewardTokenEmissionsUSD![tokenIndex].plus(distributedRewardInUSD);
    }
  }
  vault.save();
}

function rewardForVaultDailySnapshotUpdater(
  contractAddress: Address,
  timestamp: BigInt,
  blockNumber: BigInt,
  numberOfRewardTokens: number,
  distributedReward: BigInt,
  distributedRewardInUSD: BigDecimal): void {
  let vaultDailySnapshotEntity = defineVaultDailySnapshot(timestamp, blockNumber, contractAddress);
  let vault = defineVault(contractAddress, timestamp, blockNumber);
  if (numberOfRewardTokens > 0) {
    for (let index = 0; index < numberOfRewardTokens; index++) {
      let tokenIndex = vault.rewardTokens!.indexOf(vault.rewardTokens![index]);
      vaultDailySnapshotEntity.rewardTokenEmissionsAmount![tokenIndex] = vaultDailySnapshotEntity.rewardTokenEmissionsAmount![tokenIndex].plus(distributedReward);
      vaultDailySnapshotEntity.rewardTokenEmissionsUSD![tokenIndex] = vaultDailySnapshotEntity.rewardTokenEmissionsUSD![tokenIndex].plus(distributedRewardInUSD);
    }
  }
  vaultDailySnapshotEntity.save();
}

function rewardForVaultHourlySnapshotUpdater(
  contractAddress: Address,
  timestamp: BigInt,
  blockNumber: BigInt,
  numberOfRewardTokens: number,
  distributedReward: BigInt,
  distributedRewardInUSD: BigDecimal): void {
  let vaultHourlySnapshotEntity = defineVaultHourlySnapshot(timestamp, blockNumber, contractAddress);
  let vault = defineVault(contractAddress, timestamp, blockNumber);
  if (numberOfRewardTokens > 0) {
    for (let index = 0; index < numberOfRewardTokens; index++) {
      let tokenIndex = vault.rewardTokens!.indexOf(vault.rewardTokens![index]);
      vaultHourlySnapshotEntity.rewardTokenEmissionsAmount![tokenIndex] = vaultHourlySnapshotEntity.rewardTokenEmissionsAmount![tokenIndex].plus(distributedReward);
      vaultHourlySnapshotEntity.rewardTokenEmissionsUSD![tokenIndex] =vaultHourlySnapshotEntity.rewardTokenEmissionsUSD![tokenIndex].plus(distributedRewardInUSD);
    }
  }
  vaultHourlySnapshotEntity.save();
}

function rewardForFinancialsDailySnapshotUpdater(
  contractAddress: Address,
  timestamp: BigInt,
  blockNumber: BigInt,
  distributedRewardInUSD: BigDecimal,
  protocolRewardInUSD: BigDecimal,
  allDistributedRewardInUSD: BigDecimal): void {

  let financialsDailySnapshotEntity = defineFinancialsDailySnapshotEntity(timestamp,blockNumber,contractAddress);
  
  financialsDailySnapshotEntity.dailySupplySideRevenueUSD = financialsDailySnapshotEntity.dailySupplySideRevenueUSD.plus(distributedRewardInUSD);
  financialsDailySnapshotEntity.cumulativeSupplySideRevenueUSD = financialsDailySnapshotEntity.cumulativeSupplySideRevenueUSD.plus(distributedRewardInUSD);
  financialsDailySnapshotEntity.dailyProtocolSideRevenueUSD = financialsDailySnapshotEntity.dailyProtocolSideRevenueUSD.plus(protocolRewardInUSD);
  financialsDailySnapshotEntity.cumulativeProtocolSideRevenueUSD = financialsDailySnapshotEntity.cumulativeProtocolSideRevenueUSD.plus(protocolRewardInUSD);
  financialsDailySnapshotEntity.dailyTotalRevenueUSD = financialsDailySnapshotEntity.dailyTotalRevenueUSD.plus(allDistributedRewardInUSD);
  financialsDailySnapshotEntity.cumulativeTotalRevenueUSD = financialsDailySnapshotEntity.cumulativeTotalRevenueUSD.plus(allDistributedRewardInUSD);
  
  financialsDailySnapshotEntity.save();
}