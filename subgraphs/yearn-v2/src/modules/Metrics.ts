import { ActiveAccount } from "../../generated/schema";
import {
  getOrCreateVault,
  getOrCreateAccount,
  getOrCreateYieldAggregator,
  getOrCreateVaultsDailySnapshots,
  getOrCreateVaultsHourlySnapshots,
  getOrCreateFinancialDailySnapshots,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "../common/initializers";
import * as constants from "../common/constants";
import { Address, ethereum } from "@graphprotocol/graph-ts";

export function updateUsageMetrics(block: ethereum.Block, from: Address): void {
  const account = getOrCreateAccount(from.toHexString());

  const protocol = getOrCreateYieldAggregator(constants.ETHEREUM_PROTOCOL_ID);
  const usageMetricsDaily = getOrCreateUsageMetricsDailySnapshot(block);
  const usageMetricsHourly = getOrCreateUsageMetricsHourlySnapshot(block);

  usageMetricsDaily.blockNumber = block.number;
  usageMetricsHourly.blockNumber = block.number;

  usageMetricsDaily.timestamp = block.timestamp;
  usageMetricsHourly.timestamp = block.timestamp;

  usageMetricsDaily.dailyTransactionCount += 1;
  usageMetricsHourly.hourlyTransactionCount += 1;

  usageMetricsDaily.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetricsHourly.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  let dailyActiveAccountId = (
    block.timestamp.toI64() / constants.SECONDS_PER_DAY
  )
    .toString()
    .concat("-")
    .concat(from.toHexString());

  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);

  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();

    usageMetricsDaily.dailyActiveUsers += 1;
    usageMetricsHourly.hourlyActiveUsers += 1;
  }

  usageMetricsDaily.save();
  usageMetricsHourly.save();
}

export function updateVaultSnapshots(
  vaultAddress: Address,
  block: ethereum.Block
): void {
  let vault = getOrCreateVault(vaultAddress, block);

  const vaultDailySnapshots = getOrCreateVaultsDailySnapshots(
    vaultAddress.toHexString(),
    block
  );
  const vaultHourlySnapshots = getOrCreateVaultsHourlySnapshots(
    vaultAddress.toHexString(),
    block
  );

  vaultDailySnapshots.cumulativeSupplySideRevenueUSD =
    vault.cumulativeSupplySideRevenueUSD;
  vaultHourlySnapshots.cumulativeSupplySideRevenueUSD =
    vault.cumulativeSupplySideRevenueUSD;

  vaultDailySnapshots.cumulativeProtocolSideRevenueUSD =
    vault.cumulativeProtocolSideRevenueUSD;
  vaultHourlySnapshots.cumulativeProtocolSideRevenueUSD =
    vault.cumulativeProtocolSideRevenueUSD;

  vaultDailySnapshots.cumulativeTotalRevenueUSD =
    vault.cumulativeTotalRevenueUSD;
  vaultHourlySnapshots.cumulativeTotalRevenueUSD =
    vault.cumulativeTotalRevenueUSD;

  vaultDailySnapshots.totalValueLockedUSD = vault.totalValueLockedUSD;
  vaultHourlySnapshots.totalValueLockedUSD = vault.totalValueLockedUSD;

  vaultDailySnapshots.inputTokenBalance = vault.inputTokenBalance;
  vaultHourlySnapshots.inputTokenBalance = vault.inputTokenBalance;

  vaultDailySnapshots.outputTokenSupply = vault.outputTokenSupply;
  vaultHourlySnapshots.outputTokenSupply = vault.outputTokenSupply;

  vaultDailySnapshots.outputTokenPriceUSD = vault.outputTokenPriceUSD;
  vaultHourlySnapshots.outputTokenPriceUSD = vault.outputTokenPriceUSD;

  vaultDailySnapshots.pricePerShare = vault.pricePerShare;
  vaultHourlySnapshots.pricePerShare = vault.pricePerShare;

  vaultDailySnapshots.blockNumber = block.number;
  vaultHourlySnapshots.blockNumber = block.number;

  vaultDailySnapshots.timestamp = block.timestamp;
  vaultHourlySnapshots.timestamp = block.timestamp;

  vaultDailySnapshots.save();
  vaultHourlySnapshots.save();
}

export function updateFinancials(block: ethereum.Block): void {
  const financialMetrics = getOrCreateFinancialDailySnapshots(block);
  const protocol = getOrCreateYieldAggregator(constants.ETHEREUM_PROTOCOL_ID);

  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetrics.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialMetrics.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;

  financialMetrics.blockNumber = block.number;
  financialMetrics.timestamp = block.timestamp;

  financialMetrics.save();
}
