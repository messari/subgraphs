import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { 
    distributedRewardCalculator, 
    distributedRewardInUSDCalculator,
    protocolRewardInUSDCalculator,
    allDistributedRewardInUSDCalculator
} from "./helpers/calculators";
import { 
    defineVault, 
    defineProtocol, 
    defineVaultDailySnapshot,
    defineVaultHourlySnapshot,
    defineFinancialsDailySnapshotEntity
 } from "./utils/initial";

export function updateRewardParametersOfDailyOrHourlyEntities(
    contractAddress: Address,
    timestamp: BigInt,
    blockNumber: BigInt,
    newTotalSupply: BigInt): void {
    const distributedReward = distributedRewardCalculator(contractAddress, timestamp, blockNumber, newTotalSupply);
  
    const distributedRewardInUSD = distributedRewardInUSDCalculator(contractAddress, timestamp, blockNumber, newTotalSupply);
    const protocolRewardInUSD = protocolRewardInUSDCalculator(contractAddress, timestamp, blockNumber, newTotalSupply);
    const allDistributedRewardInUSD = allDistributedRewardInUSDCalculator(contractAddress, timestamp, blockNumber, newTotalSupply);
  
    const vault = defineVault(contractAddress, timestamp, blockNumber);
    const numberOfRewardTokens = vault.rewardTokens!.length;
  
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
    const protocol = defineProtocol(contractAddress);
  
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
    const vault = defineVault(contractAddress, timestamp, blockNumber);
    if (numberOfRewardTokens > 0) {
      for (let i = 0; i < numberOfRewardTokens; i++) {
        const tokenIndex = vault.rewardTokens!.indexOf(vault.rewardTokens![i]);
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
    const vaultDailySnapshotEntity = defineVaultDailySnapshot(timestamp, blockNumber, contractAddress);
    const vault = defineVault(contractAddress, timestamp, blockNumber);
    if (numberOfRewardTokens > 0) {
      for (let i = 0; i < numberOfRewardTokens; i++) {
        const tokenIndex = vault.rewardTokens!.indexOf(vault.rewardTokens![i]);
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
    const vaultHourlySnapshotEntity = defineVaultHourlySnapshot(timestamp, blockNumber, contractAddress);
    const vault = defineVault(contractAddress, timestamp, blockNumber);
    if (numberOfRewardTokens > 0) {
      for (let i = 0; i < numberOfRewardTokens; i++) {
        const tokenIndex = vault.rewardTokens!.indexOf(vault.rewardTokens![i]);
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
  
    const financialsDailySnapshotEntity = defineFinancialsDailySnapshotEntity(timestamp,blockNumber,contractAddress);
    
    financialsDailySnapshotEntity.dailySupplySideRevenueUSD = financialsDailySnapshotEntity.dailySupplySideRevenueUSD.plus(distributedRewardInUSD);
    financialsDailySnapshotEntity.cumulativeSupplySideRevenueUSD = financialsDailySnapshotEntity.cumulativeSupplySideRevenueUSD.plus(distributedRewardInUSD);
    financialsDailySnapshotEntity.dailyProtocolSideRevenueUSD = financialsDailySnapshotEntity.dailyProtocolSideRevenueUSD.plus(protocolRewardInUSD);
    financialsDailySnapshotEntity.cumulativeProtocolSideRevenueUSD = financialsDailySnapshotEntity.cumulativeProtocolSideRevenueUSD.plus(protocolRewardInUSD);
    financialsDailySnapshotEntity.dailyTotalRevenueUSD = financialsDailySnapshotEntity.dailyTotalRevenueUSD.plus(allDistributedRewardInUSD);
    financialsDailySnapshotEntity.cumulativeTotalRevenueUSD = financialsDailySnapshotEntity.cumulativeTotalRevenueUSD.plus(allDistributedRewardInUSD);
    
    financialsDailySnapshotEntity.save();
  }