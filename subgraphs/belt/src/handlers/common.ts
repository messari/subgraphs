import { Address, ethereum } from "@graphprotocol/graph-ts";
import { Account, DailyActiveAccount, Vault } from "../../generated/schema";
import { BIGDECIMAL_ZERO } from "../constant";
import {
  getOrCreateFinancialsDailySnapshot,
  getOrCreateUsageMetricSnapshot,
  getOrCreateVaultDailySnapshot,
} from "../entities/Metrics";
import { getOrCreateProtocol } from "../entities/Protocol";
import { getDay } from "../utils/numbers";

function updateUsageMetrics(event: ethereum.Event): void {
  // Number of days since Unix epoch
  let id: i64 = getDay(event.block.timestamp);
  let usageMetrics = getOrCreateUsageMetricSnapshot(event.block);

  // Update the block number and timestamp to that of the last transaction of that day
  usageMetrics.blockNumber = event.block.number;
  usageMetrics.timestamp = event.block.timestamp;
  usageMetrics.dailyTransactionCount += 1;

  let accountId = event.transaction.from.toHexString();
  let account = Account.load(accountId);
  let protocol = getOrCreateProtocol();
  if (!account) {
    account = new Account(accountId);
    account.save();

    protocol.totalUniqueUsers += 1;
    protocol.save();
  }
  usageMetrics.totalUniqueUsers = protocol.totalUniqueUsers;

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = id.toString() + "-" + event.transaction.from.toHexString();
  let dailyActiveAccount = DailyActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new DailyActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    usageMetrics.activeUsers += 1;
  }

  usageMetrics.save();
}

function updateFinancialMetrics(block: ethereum.Block): void {
  let metrics = getOrCreateFinancialsDailySnapshot(block);
  let protocol = getOrCreateProtocol();

  metrics.timestamp = block.timestamp;
  metrics.blockNumber = block.number;
  metrics.totalVolumeUSD = protocol.totalVolumeUSD;
  metrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  metrics.totalRevenueUSD = protocol.totalValueLockedUSD;

  metrics.save();
}

function updateProtocolMetrics(): void {
  let protocol = getOrCreateProtocol();
  let totalVolumeUSD = BIGDECIMAL_ZERO;
  let totalValueLockedUSD = BIGDECIMAL_ZERO;

  for (let i = 0; i < protocol._vaultIds.length; i++) {
    let vaultId = protocol._vaultIds[i];
    let vault = Vault.load(vaultId);

    if (vault) {
      totalVolumeUSD = totalVolumeUSD.plus(vault.totalVolumeUSD);
      totalValueLockedUSD = totalValueLockedUSD.plus(vault.totalValueLockedUSD);
    }
  }

  protocol.totalVolumeUSD = totalVolumeUSD;
  protocol.totalValueLockedUSD = totalValueLockedUSD;

  protocol.save();
}

function updateVaultMetrics(vault: Vault, block: ethereum.Block): void {
  let metrics = getOrCreateVaultDailySnapshot(Address.fromString(vault.id), block);

  metrics.vault = vault.id;
  metrics.totalValueLockedUSD = vault.totalValueLockedUSD;
  metrics.totalVolumeUSD = vault.totalVolumeUSD;
  metrics.inputTokenBalances = vault.inputTokenBalances;
  metrics.outputTokenSupply = vault.outputTokenSupply;
  metrics.outputTokenPriceUSD = vault.outputTokenPriceUSD;
  metrics.rewardTokenEmissionsAmount = vault.rewardTokenEmissionsAmount;
  metrics.rewardTokenEmissionsUSD = vault.rewardTokenEmissionsUSD;
  metrics.blockNumber = block.number;
  metrics.timestamp = block.timestamp;

  metrics.save();
}

export function updateAllMetrics(event: ethereum.Event, vault: Vault): void {
  updateVaultMetrics(vault, event.block);
  updateProtocolMetrics();
  updateUsageMetrics(event);
  updateFinancialMetrics(event.block);
}
