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

    const distributedReward = calculateDistributedReward(contractAddress, block, newTotalSupply);
    const distributedRewardInUSD = calculateDistributedRewardInUSD(contractAddress, distributedReward);
    const protocolRewardInUSD = calculateProtocolRewardInUSD(contractAddress, distributedReward);
    const allDistributedRewardInUSD = calculateAllDistributedRewardInUSD(contractAddress, distributedReward);

    log.error(`distributedReward: ${distributedReward.toString()},
    distributedRewardInUSD: ${distributedRewardInUSD.toString()},
    protocolRewardInUSD: ${protocolRewardInUSD.toString()},
    allDistributedRewardInUSD: ${allDistributedRewardInUSD.toString()}
    `, [])

    if (numberOfRewardTokens > 0) {
        for (let i = 0; i < numberOfRewardTokens; i++) {
            const tokenIndex = vault.rewardTokens!.indexOf(vault.rewardTokens![i]);
            vault.rewardTokenEmissionsAmount![tokenIndex] = (vault.rewardTokenEmissionsAmount![tokenIndex]).plus(distributedReward);
            vault.rewardTokenEmissionsUSD![tokenIndex] = vault.rewardTokenEmissionsUSD![tokenIndex].plus(distributedRewardInUSD);
        }
    }
    vault.save();

    updateFinancialsRewardAfterReinvest(block, distributedRewardInUSD, distributedRewardInUSD, distributedRewardInUSD);
}

export function updateFinancialsRewardAfterReinvest(
    block: ethereum.Block,
    allDistributedRewardInUSD: BigDecimal,
    distributedRewardInUSD: BigDecimal,
    protocolRewardInUSD: BigDecimal
): void {
    const financialMetrics = getOrCreateFinancialDailySnapshots(block);
    const protocol = getOrCreateYieldAggregator();

    // TotalRevenueUSD Metrics
    financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(
        allDistributedRewardInUSD
    );
    protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(
        allDistributedRewardInUSD
    );
    financialMetrics.cumulativeTotalRevenueUSD =
        protocol.cumulativeTotalRevenueUSD;

    // SupplySideRevenueUSD Metrics
    financialMetrics.dailySupplySideRevenueUSD = financialMetrics.dailySupplySideRevenueUSD.plus(
        distributedRewardInUSD
    );
    protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(
        distributedRewardInUSD
    );
    financialMetrics.cumulativeSupplySideRevenueUSD =
        protocol.cumulativeSupplySideRevenueUSD;

    // ProtocolSideRevenueUSD Metrics
    financialMetrics.dailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(
        protocolRewardInUSD
    );
    protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(
        protocolRewardInUSD
    );
    financialMetrics.cumulativeProtocolSideRevenueUSD =
        protocol.cumulativeProtocolSideRevenueUSD;

    financialMetrics.save();
    protocol.save();
}
