import {
  getOrCreateAccount,
  getOrCreateFinancialDailySnapshots,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
  getOrCreateVault,
  getOrCreateVaultsDailySnapshots,
  getOrCreateVaultsHourlySnapshots,
  getOrCreateYieldAggregator,
} from "../common/initializers";
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts";
import { Account, ActiveAccount } from "../../generated/schema";
import { getDaysSinceEpoch, getHoursSinceEpoch } from "../common/datetime";

export function updateFinancials(block: ethereum.Block): void {
  const financialMetrics = getOrCreateFinancialDailySnapshots(block);
  const protocol = getOrCreateYieldAggregator();

  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
  financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;

  financialMetrics.blockNumber = block.number;
  financialMetrics.timestamp = block.timestamp;

  financialMetrics.save();
}

export function updateUsageMetrics(block: ethereum.Block, from: Address): void {
  getOrCreateAccount(from.toHexString());

  const protocol = getOrCreateYieldAggregator();
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

  const fromAddress = from.toHexString();
  const dayId = getDaysSinceEpoch(block.timestamp.toI32());
  const hourId = getHoursSinceEpoch(block.timestamp.toI32());

  const dailyActiveAccountId = fromAddress.concat("-").concat(dayId);
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    usageMetricsDaily.dailyActiveUsers += 1;
    dailyActiveAccount.save();
  }

  const hourlyActiveAccountId = fromAddress.concat("-").concat(hourId);
  let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountId);
  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountId);
    usageMetricsHourly.hourlyActiveUsers += 1;
    hourlyActiveAccount.save();
  }

  let account = Account.load(fromAddress);
  if (!account) {
    account = new Account(fromAddress);
    protocol.cumulativeUniqueUsers += 1;
    account.save();
  }

  usageMetricsDaily.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetricsHourly.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  usageMetricsDaily.save();
  usageMetricsHourly.save();
}

export function updateVaultSnapshots(
  contractAddress: Address,
  block: ethereum.Block
): void {
  let vaultId = contractAddress.toHexString();

  let vault = getOrCreateVault(contractAddress, block);

  const vaultDailySnapshot = getOrCreateVaultsDailySnapshots(vaultId, block);
  const vaultHourlySnapshot = getOrCreateVaultsHourlySnapshots(vaultId, block);

  vaultDailySnapshot.totalValueLockedUSD = vault.totalValueLockedUSD;
  vaultHourlySnapshot.totalValueLockedUSD = vault.totalValueLockedUSD;

  vaultDailySnapshot.cumulativeSupplySideRevenueUSD = vault.cumulativeSupplySideRevenueUSD;
  vaultHourlySnapshot.cumulativeSupplySideRevenueUSD = vault.cumulativeSupplySideRevenueUSD;

  vaultDailySnapshot.cumulativeProtocolSideRevenueUSD = vault.cumulativeProtocolSideRevenueUSD;
  vaultHourlySnapshot.cumulativeProtocolSideRevenueUSD = vault.cumulativeProtocolSideRevenueUSD;

  vaultDailySnapshot.cumulativeTotalRevenueUSD = vault.cumulativeTotalRevenueUSD;
  vaultHourlySnapshot.cumulativeTotalRevenueUSD = vault.cumulativeTotalRevenueUSD;

  vaultDailySnapshot.inputTokenBalance = vault.inputTokenBalance;
  vaultHourlySnapshot.inputTokenBalance = vault.inputTokenBalance;

  vaultDailySnapshot.outputTokenSupply = vault.outputTokenSupply;
  vaultHourlySnapshot.outputTokenSupply = vault.outputTokenSupply;

  vaultDailySnapshot.outputTokenPriceUSD = vault.outputTokenPriceUSD;
  vaultHourlySnapshot.outputTokenPriceUSD = vault.outputTokenPriceUSD;

  vaultDailySnapshot.pricePerShare = vault.pricePerShare;
  vaultHourlySnapshot.pricePerShare = vault.pricePerShare;

  vaultDailySnapshot.rewardTokenEmissionsAmount = vault.rewardTokenEmissionsAmount;
  vaultHourlySnapshot.rewardTokenEmissionsAmount = vault.rewardTokenEmissionsAmount;

  vaultDailySnapshot.rewardTokenEmissionsUSD = vault.rewardTokenEmissionsUSD;
  vaultHourlySnapshot.rewardTokenEmissionsUSD = vault.rewardTokenEmissionsUSD;

  if (vaultDailySnapshot.rewardTokenEmissionsAmount!.length > 0) {
    for (let i = 0; i < vaultDailySnapshot.rewardTokenEmissionsAmount!.length; i++) {
      if (vault.rewardTokenEmissionsAmount![i].gt(new BigInt(0))) {
        vaultDailySnapshot.rewardAPR!.push(
          vault.rewardTokenEmissionsAmount![i].divDecimal(
            vault.totalValueLockedUSD
          )
        );
        vaultHourlySnapshot.rewardAPR!.push(
          vault.rewardTokenEmissionsAmount![i].divDecimal(
            vault.totalValueLockedUSD
          )
        );
      }
    }
  }

  vaultDailySnapshot.blockNumber = block.number;
  vaultHourlySnapshot.blockNumber = block.number;

  vaultDailySnapshot.timestamp = block.timestamp;
  vaultHourlySnapshot.timestamp = block.timestamp;

  vaultDailySnapshot.save();
  vaultHourlySnapshot.save();
}
