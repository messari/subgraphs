import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { initProtocol } from "../initializers/protocolInitializer";
import { initVault } from "../initializers/vaultInitializer";
import { initVaultDailySnapshot } from "../initializers/vaultDailySnapshotInitializer";
import { initVaultHourlySnapshot } from "../initializers/vaultHourlySnapshotInitializer";
import { initFinancialsDailySnapshot } from "../initializers/financialsDailySnapshotInitializer";
import { calculateDistributedReward } from "../calculators/distributedRewardCalculator";
import { calculateDistributedRewardInUSD } from "../calculators/distributedRewardInUSDCalculator";
import { calculateProtocolRewardInUSD } from "../calculators/protocolRewardInUSDCalculator";
import { calculateAllDistributedRewardInUSD } from "../calculators/allDistributedRewardInUSDCalculator";

export function updateRewardParametersOfDailyOrHourlyEntities(
  contractAddress: Address,
  timestamp: BigInt,
  blockNumber: BigInt,
  newTotalSupply: BigInt
): void {
  const distributedReward = calculateDistributedReward(contractAddress, timestamp, blockNumber, newTotalSupply);

  const distributedRewardInUSD = calculateDistributedRewardInUSD(contractAddress, timestamp, blockNumber, newTotalSupply);
  const protocolRewardInUSD = calculateProtocolRewardInUSD(contractAddress, timestamp, blockNumber, newTotalSupply);
  const allDistributedRewardInUSD = calculateAllDistributedRewardInUSD(contractAddress, timestamp, blockNumber, newTotalSupply);

  const vault = initVault(contractAddress, timestamp, blockNumber);
  const numberOfRewardTokens = vault.rewardTokens!.length;

  updateRewardForProtocol(contractAddress, distributedRewardInUSD, protocolRewardInUSD);
  updateRewardForVault(contractAddress, timestamp, blockNumber, numberOfRewardTokens, distributedReward, distributedRewardInUSD);
  updateRewardForVaultDailySnapshot(contractAddress, timestamp, blockNumber, numberOfRewardTokens, distributedReward, distributedRewardInUSD);
  updateRewardForVaultHourlySnapshot(contractAddress, timestamp, blockNumber, numberOfRewardTokens, distributedReward, distributedRewardInUSD);
  updateRewardForFinancialsDailySnapshot(contractAddress, timestamp, blockNumber, distributedRewardInUSD, protocolRewardInUSD, allDistributedRewardInUSD);
}

function updateRewardForProtocol(
  contractAddress: Address,
  distributedRewardInUSD: BigDecimal,
  protocolRewardInUSD: BigDecimal
): void {
  const protocol = initProtocol(contractAddress);

  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(distributedRewardInUSD);
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(protocolRewardInUSD);
  protocol.save();
}

function updateRewardForVault(
  contractAddress: Address,
  timestamp: BigInt,
  blockNumber: BigInt,
  numberOfRewardTokens: number,
  distributedReward: BigInt,
  distributedRewardInUSD: BigDecimal
): void {
  const vault = initVault(contractAddress, timestamp, blockNumber);
  if (numberOfRewardTokens > 0) {
    for (let i = 0; i < numberOfRewardTokens; i++) {
      const tokenIndex = vault.rewardTokens!.indexOf(vault.rewardTokens![i]);
      vault.rewardTokenEmissionsAmount![tokenIndex] = (vault.rewardTokenEmissionsAmount![tokenIndex]).plus(distributedReward);
      vault.rewardTokenEmissionsUSD![tokenIndex] = vault.rewardTokenEmissionsUSD![tokenIndex].plus(distributedRewardInUSD);
    }
  }
  vault.save();
}

function updateRewardForVaultDailySnapshot(
  contractAddress: Address,
  timestamp: BigInt,
  blockNumber: BigInt,
  numberOfRewardTokens: number,
  distributedReward: BigInt,
  distributedRewardInUSD: BigDecimal
): void {
  const vaultDailySnapshotEntity = initVaultDailySnapshot(timestamp, blockNumber, contractAddress);
  const vault = initVault(contractAddress, timestamp, blockNumber);
  if (numberOfRewardTokens > 0) {
    for (let i = 0; i < numberOfRewardTokens; i++) {
      const tokenIndex = vault.rewardTokens!.indexOf(vault.rewardTokens![i]);
      vaultDailySnapshotEntity.rewardTokenEmissionsAmount![tokenIndex] = vaultDailySnapshotEntity.rewardTokenEmissionsAmount![tokenIndex].plus(distributedReward);
      vaultDailySnapshotEntity.rewardTokenEmissionsUSD![tokenIndex] = vaultDailySnapshotEntity.rewardTokenEmissionsUSD![tokenIndex].plus(distributedRewardInUSD);
    }
  }
  vaultDailySnapshotEntity.save();
}

function updateRewardForVaultHourlySnapshot(
  contractAddress: Address,
  timestamp: BigInt,
  blockNumber: BigInt,
  numberOfRewardTokens: number,
  distributedReward: BigInt,
  distributedRewardInUSD: BigDecimal
): void {
  const vaultHourlySnapshotEntity = initVaultHourlySnapshot(timestamp, blockNumber, contractAddress);
  const vault = initVault(contractAddress, timestamp, blockNumber);
  if (numberOfRewardTokens > 0) {
    for (let i = 0; i < numberOfRewardTokens; i++) {
      const tokenIndex = vault.rewardTokens!.indexOf(vault.rewardTokens![i]);
      vaultHourlySnapshotEntity.rewardTokenEmissionsAmount![tokenIndex] = vaultHourlySnapshotEntity.rewardTokenEmissionsAmount![tokenIndex].plus(distributedReward);
      vaultHourlySnapshotEntity.rewardTokenEmissionsUSD![tokenIndex] = vaultHourlySnapshotEntity.rewardTokenEmissionsUSD![tokenIndex].plus(distributedRewardInUSD);
    }
  }
  vaultHourlySnapshotEntity.save();
}

function updateRewardForFinancialsDailySnapshot(
  contractAddress: Address,
  timestamp: BigInt,
  blockNumber: BigInt,
  distributedRewardInUSD: BigDecimal,
  protocolRewardInUSD: BigDecimal,
  allDistributedRewardInUSD: BigDecimal
): void {
  const financialsDailySnapshotEntity = initFinancialsDailySnapshot(timestamp, blockNumber, contractAddress);

  financialsDailySnapshotEntity.dailySupplySideRevenueUSD = financialsDailySnapshotEntity.dailySupplySideRevenueUSD.plus(distributedRewardInUSD);
  financialsDailySnapshotEntity.cumulativeSupplySideRevenueUSD = financialsDailySnapshotEntity.cumulativeSupplySideRevenueUSD.plus(distributedRewardInUSD);
  financialsDailySnapshotEntity.dailyProtocolSideRevenueUSD = financialsDailySnapshotEntity.dailyProtocolSideRevenueUSD.plus(protocolRewardInUSD);
  financialsDailySnapshotEntity.cumulativeProtocolSideRevenueUSD = financialsDailySnapshotEntity.cumulativeProtocolSideRevenueUSD.plus(protocolRewardInUSD);
  financialsDailySnapshotEntity.dailyTotalRevenueUSD = financialsDailySnapshotEntity.dailyTotalRevenueUSD.plus(allDistributedRewardInUSD);
  financialsDailySnapshotEntity.cumulativeTotalRevenueUSD = financialsDailySnapshotEntity.cumulativeTotalRevenueUSD.plus(allDistributedRewardInUSD);

  financialsDailySnapshotEntity.save();
}