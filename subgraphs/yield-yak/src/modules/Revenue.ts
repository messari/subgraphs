import { Vault } from "../../generated/schema";
import { Address, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { getOrCreateYieldAggregator, getOrCreateFinancialDailySnapshots, getOrCreateVaultsDailySnapshots, getOrCreateVaultsHourlySnapshots } from "../common/initializers";

export function updateRevenueSnapshots(
    vault: Vault,
    supplySideRevenueUSD: BigDecimal,
    protocolSideRevenueUSD: BigDecimal,
    block: ethereum.Block,
    contractAddress: Address
): void {
    const protocol = getOrCreateYieldAggregator(contractAddress);

    const financialMetrics = getOrCreateFinancialDailySnapshots(block, contractAddress);
    const vaultDailySnapshot = getOrCreateVaultsDailySnapshots(vault.id, block, contractAddress);
    const vaultHourlySnapshot = getOrCreateVaultsHourlySnapshots(vault.id, block, contractAddress);

    const totalRevenueUSD = supplySideRevenueUSD.plus(protocolSideRevenueUSD);

    // SupplySideRevenueUSD Metrics
    protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(supplySideRevenueUSD);
    financialMetrics.dailySupplySideRevenueUSD = financialMetrics.dailySupplySideRevenueUSD.plus(supplySideRevenueUSD);
    financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;

    vault.cumulativeSupplySideRevenueUSD = vault.cumulativeSupplySideRevenueUSD.plus(supplySideRevenueUSD);
    vaultDailySnapshot.cumulativeSupplySideRevenueUSD = vault.cumulativeSupplySideRevenueUSD;
    vaultDailySnapshot.dailySupplySideRevenueUSD = vaultDailySnapshot.dailySupplySideRevenueUSD.plus(supplySideRevenueUSD);
    vaultHourlySnapshot.cumulativeSupplySideRevenueUSD = vault.cumulativeSupplySideRevenueUSD;
    vaultHourlySnapshot.hourlySupplySideRevenueUSD = vaultHourlySnapshot.hourlySupplySideRevenueUSD.plus(supplySideRevenueUSD);

    // ProtocolSideRevenueUSD Metrics
    protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);
    financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
    financialMetrics.dailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);

    vault.cumulativeProtocolSideRevenueUSD = vault.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);
    vaultDailySnapshot.cumulativeProtocolSideRevenueUSD = vault.cumulativeProtocolSideRevenueUSD;
    vaultDailySnapshot.dailyProtocolSideRevenueUSD = vaultDailySnapshot.dailyProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);
    vaultHourlySnapshot.cumulativeProtocolSideRevenueUSD = vault.cumulativeProtocolSideRevenueUSD;
    vaultHourlySnapshot.hourlyProtocolSideRevenueUSD = vaultHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);

    // TotalRevenueUSD Metrics
    protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(totalRevenueUSD);
    financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
    financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(totalRevenueUSD);

    vault.cumulativeTotalRevenueUSD = vault.cumulativeTotalRevenueUSD.plus(totalRevenueUSD);
    vaultDailySnapshot.cumulativeTotalRevenueUSD = vault.cumulativeTotalRevenueUSD;
    vaultDailySnapshot.dailyTotalRevenueUSD = vaultDailySnapshot.dailyTotalRevenueUSD.plus(totalRevenueUSD);
    vaultHourlySnapshot.cumulativeTotalRevenueUSD = vault.cumulativeTotalRevenueUSD;
    vaultHourlySnapshot.hourlyTotalRevenueUSD = vaultHourlySnapshot.hourlyTotalRevenueUSD.plus(totalRevenueUSD);

    vaultHourlySnapshot.save();
    vaultDailySnapshot.save();
    financialMetrics.save();
    protocol.save();
    vault.save();
}