import { Address, ethereum, BigInt, BigDecimal, log } from "@graphprotocol/graph-ts";
import { Vault } from "../../generated/schema";
import { calculateAllDistributedRewardInUSD } from "../calculators/allDistributedRewardInUSDCalculator";
import { calculateDistributedReward } from "../calculators/distributedRewardCalculator";
import { calculateDistributedRewardInUSD } from "../calculators/distributedRewardInUSDCalculator";
import { calculateProtocolRewardInUSD } from "../calculators/protocolRewardInUSDCalculator";
import { getOrCreateFinancialDailySnapshots, getOrCreateYieldAggregator } from "../common/initializers";

export function _Reinvest(
    contractAddress: Address,
    transaction: ethereum.Transaction,
    block: ethereum.Block,
    vault: Vault,
    newTotalSupply: BigInt
): void {
    const numberOfRewardTokens = vault.rewardTokens!.length;

    const distributedReward = calculateDistributedReward(contractAddress, block.timestamp, block.number, newTotalSupply);
    const distributedRewardInUSD = calculateDistributedRewardInUSD(contractAddress, block.timestamp, block.number, newTotalSupply);
    const protocolRewardInUSD = calculateProtocolRewardInUSD(contractAddress, block.timestamp, block.number, newTotalSupply);
    const allDistributedRewardInUSD = calculateAllDistributedRewardInUSD(contractAddress, block.timestamp, block.number, newTotalSupply);

    if (numberOfRewardTokens > 0) {
        for (let i = 0; i < numberOfRewardTokens; i++) {
            const tokenIndex = vault.rewardTokens!.indexOf(vault.rewardTokens![i]);
            vault.rewardTokenEmissionsAmount![tokenIndex] = (vault.rewardTokenEmissionsAmount![tokenIndex]).plus(distributedReward);
            vault.rewardTokenEmissionsUSD![tokenIndex] = vault.rewardTokenEmissionsUSD![tokenIndex].plus(distributedRewardInUSD);
        }
    }
    vault.save();

    log.error(`allDistributedRewardInUSD: ${allDistributedRewardInUSD.toString()}`, []);
    log.error(`distributedRewardInUSD: ${distributedRewardInUSD.toString()}`, []);
    log.error(`protocolRewardInUSD: ${protocolRewardInUSD.toString()}`, []);

    updateFinancialsRewardAfterReinvest(block, allDistributedRewardInUSD, distributedRewardInUSD, protocolRewardInUSD);
}

export function updateFinancialsRewardAfterReinvest(
    block: ethereum.Block,
    totalRevenueUSD: BigDecimal,
    supplySideRevenueUSD: BigDecimal,
    protocolSideRevenueUSD: BigDecimal
): void {
    const financialMetrics = getOrCreateFinancialDailySnapshots(block);
    const protocol = getOrCreateYieldAggregator();

    // TotalRevenueUSD Metrics
    financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(
        totalRevenueUSD
    );
    protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(
        totalRevenueUSD
    );
    financialMetrics.cumulativeTotalRevenueUSD =
        protocol.cumulativeTotalRevenueUSD;

    // SupplySideRevenueUSD Metrics
    financialMetrics.dailySupplySideRevenueUSD = financialMetrics.dailySupplySideRevenueUSD.plus(
        supplySideRevenueUSD
    );
    protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(
        supplySideRevenueUSD
    );
    financialMetrics.cumulativeSupplySideRevenueUSD =
        protocol.cumulativeSupplySideRevenueUSD;

    // ProtocolSideRevenueUSD Metrics
    financialMetrics.dailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(
        protocolSideRevenueUSD
    );
    protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(
        protocolSideRevenueUSD
    );
    financialMetrics.cumulativeProtocolSideRevenueUSD =
        protocol.cumulativeProtocolSideRevenueUSD;

    financialMetrics.save();
    protocol.save();
}
