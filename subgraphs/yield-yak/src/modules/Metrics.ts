import { getOrCreateAccount, getOrCreateFinancialDailySnapshots, getOrCreateUsageMetricsDailySnapshot, getOrCreateUsageMetricsHourlySnapshot, getOrCreateVault, getOrCreateVaultsDailySnapshots, getOrCreateVaultsHourlySnapshots, getOrCreateYieldAggregator } from "../common/initializers";
import { ethereum, Address } from "@graphprotocol/graph-ts";
import { SECONDS_PER_DAY } from "../helpers/constants";
import { ActiveAccount } from "../../generated/schema";

export function updateFinancials(block: ethereum.Block, contractAddress: Address): void {
  const financialMetrics = getOrCreateFinancialDailySnapshots(block, contractAddress);
  const protocol = getOrCreateYieldAggregator(contractAddress);

  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
  financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  financialMetrics.blockNumber = block.number;
  financialMetrics.timestamp = block.timestamp;

  financialMetrics.save();
}

export function updateUsageMetrics(block: ethereum.Block, from: Address, contractAddress: Address): void {
  const protocol = getOrCreateYieldAggregator(contractAddress);
  const usageMetricsDaily = getOrCreateUsageMetricsDailySnapshot(block, contractAddress);
  const usageMetricsHourly = getOrCreateUsageMetricsHourlySnapshot(block, contractAddress);

  usageMetricsDaily.blockNumber = block.number;
  usageMetricsHourly.blockNumber = block.number;

  usageMetricsDaily.timestamp = block.timestamp;
  usageMetricsHourly.timestamp = block.timestamp;

  usageMetricsDaily.dailyTransactionCount += 1;
  usageMetricsHourly.hourlyTransactionCount += 1;

  usageMetricsDaily.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetricsHourly.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  let dailyActiveAccountId = (block.timestamp.toI64() / SECONDS_PER_DAY)
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

export function updateVaultSnapshots(contractAddress: Address, block: ethereum.Block): void {
  let vault = getOrCreateVault(contractAddress, block);

  const vaultDailySnapshots = getOrCreateVaultsDailySnapshots(
    contractAddress.toHexString(),
    block,
    contractAddress
  );
  const vaultHourlySnapshots = getOrCreateVaultsHourlySnapshots(
    contractAddress.toHexString(),
    block,
    contractAddress
  );

  vaultDailySnapshots.cumulativeSupplySideRevenueUSD = vault.cumulativeSupplySideRevenueUSD;
  vaultHourlySnapshots.cumulativeSupplySideRevenueUSD = vault.cumulativeSupplySideRevenueUSD;

  vaultDailySnapshots.cumulativeProtocolSideRevenueUSD = vault.cumulativeProtocolSideRevenueUSD;
  vaultHourlySnapshots.cumulativeProtocolSideRevenueUSD = vault.cumulativeProtocolSideRevenueUSD;

  vaultDailySnapshots.cumulativeTotalRevenueUSD = vault.cumulativeTotalRevenueUSD;
  vaultHourlySnapshots.cumulativeTotalRevenueUSD = vault.cumulativeTotalRevenueUSD;

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