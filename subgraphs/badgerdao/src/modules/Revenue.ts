import {
  getOrCreateYieldAggregator,
  getOrCreateVaultsDailySnapshots,
  getOrCreateVaultsHourlySnapshots,
  getOrCreateFinancialDailySnapshots,
} from "../common/initializers";
import { Vault as VaultStore } from "../../generated/schema";
import { BigDecimal, ethereum } from "@graphprotocol/graph-ts";

export function updateRevenueSnapshots(
  vault: VaultStore,
  supplySideRevenueUSD: BigDecimal,
  protocolSideRevenueUSD: BigDecimal,
  block: ethereum.Block
): void {
  const totalRevenueUSD = supplySideRevenueUSD.plus(protocolSideRevenueUSD);

  const protocol = getOrCreateYieldAggregator();
  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(supplySideRevenueUSD);
  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(totalRevenueUSD);
  protocol.save();

  const financialMetrics = getOrCreateFinancialDailySnapshots(block);
  financialMetrics.dailySupplySideRevenueUSD =
    financialMetrics.dailySupplySideRevenueUSD.plus(supplySideRevenueUSD);
  financialMetrics.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.dailyProtocolSideRevenueUSD =
    financialMetrics.dailyProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);
  financialMetrics.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialMetrics.dailyTotalRevenueUSD =
    financialMetrics.dailyTotalRevenueUSD.plus(totalRevenueUSD);
  financialMetrics.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;
  financialMetrics.save();

  vault.cumulativeSupplySideRevenueUSD =
    vault.cumulativeSupplySideRevenueUSD.plus(supplySideRevenueUSD);
  vault.cumulativeProtocolSideRevenueUSD =
    vault.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);
  vault.cumulativeTotalRevenueUSD =
    vault.cumulativeTotalRevenueUSD.plus(supplySideRevenueUSD);
  vault.save();

  const vaultDailySnapshot = getOrCreateVaultsDailySnapshots(vault, block);
  vaultDailySnapshot.dailySupplySideRevenueUSD =
    vaultDailySnapshot.dailySupplySideRevenueUSD.plus(supplySideRevenueUSD);
  vaultDailySnapshot.cumulativeSupplySideRevenueUSD =
    vault.cumulativeSupplySideRevenueUSD;
  vaultDailySnapshot.dailyProtocolSideRevenueUSD =
    vaultDailySnapshot.dailyProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);
  vaultDailySnapshot.cumulativeProtocolSideRevenueUSD =
    vault.cumulativeProtocolSideRevenueUSD;
  vaultDailySnapshot.dailyTotalRevenueUSD =
    vaultDailySnapshot.dailyTotalRevenueUSD.plus(totalRevenueUSD);
  vaultDailySnapshot.cumulativeTotalRevenueUSD =
    vault.cumulativeTotalRevenueUSD;
  vaultDailySnapshot.save();

  const vaultHourlySnapshot = getOrCreateVaultsHourlySnapshots(vault, block);
  vaultHourlySnapshot.hourlySupplySideRevenueUSD =
    vaultHourlySnapshot.hourlySupplySideRevenueUSD.plus(supplySideRevenueUSD);
  vaultHourlySnapshot.cumulativeSupplySideRevenueUSD =
    vault.cumulativeSupplySideRevenueUSD;
  vaultHourlySnapshot.hourlyProtocolSideRevenueUSD =
    vaultHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(
      protocolSideRevenueUSD
    );
  vaultHourlySnapshot.cumulativeProtocolSideRevenueUSD =
    vault.cumulativeProtocolSideRevenueUSD;
  vaultHourlySnapshot.hourlyTotalRevenueUSD =
    vaultHourlySnapshot.hourlyTotalRevenueUSD.plus(totalRevenueUSD);
  vaultHourlySnapshot.cumulativeTotalRevenueUSD =
    vault.cumulativeTotalRevenueUSD;
  vaultHourlySnapshot.save();
}
