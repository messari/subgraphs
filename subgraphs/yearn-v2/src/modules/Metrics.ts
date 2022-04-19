import {
  Account,
  YieldAggregator,
  DailyActiveAccount,
  VaultDailySnapshot,
  Vault as VaultStore,
  UsageMetricsDailySnapshot,
} from "../../generated/schema";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { BigInt, Address, ethereum } from "@graphprotocol/graph-ts";

export function getOrCreateUsageMetricSnapshot(
  block: ethereum.Block
): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = block.timestamp.toI64() / constants.SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = constants.ETHEREUM_PROTOCOL_ID;

    usageMetrics.activeUsers = 0;
    usageMetrics.totalUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.save();
  }

  return usageMetrics;
}

export function updateUsageMetrics(block: ethereum.Block, from: Address): void {
  // Number of days since Unix epoch
  let id: i64 = block.timestamp.toI64() / constants.SECONDS_PER_DAY;
  let usageMetrics = getOrCreateUsageMetricSnapshot(block);

  // Update the block number and timestamp to that of the last transaction of that day
  usageMetrics.blockNumber = block.number;
  usageMetrics.timestamp = block.timestamp;
  usageMetrics.dailyTransactionCount += 1;

  let accountId = from.toHexString();
  let account = Account.load(accountId);
  let protocol = utils.getOrCreateYieldAggregator(
    constants.ETHEREUM_PROTOCOL_ID
  );
  if (!account) {
    account = new Account(accountId);
    account.save();

    protocol.totalUniqueUsers += 1;
    protocol.save();
  }
  usageMetrics.totalUniqueUsers = protocol.totalUniqueUsers;

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = id.toString() + "-" + from.toHexString();
  let dailyActiveAccount = DailyActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new DailyActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    usageMetrics.activeUsers += 1;
  }

  usageMetrics.save();
}

export function getOrCreateVaultSnapshots(
  vaultSnapshotsId: string
): VaultDailySnapshot {
  let vaultSnapshots = VaultDailySnapshot.load(vaultSnapshotsId);

  if (!vaultSnapshots) {
    vaultSnapshots = new VaultDailySnapshot(vaultSnapshotsId);
    vaultSnapshots.protocol = constants.ETHEREUM_PROTOCOL_ID;

    vaultSnapshots.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.totalVolumeUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.inputTokenBalances = [constants.BIGINT_ZERO];
    vaultSnapshots.outputTokenSupply = constants.BIGINT_ZERO;
    vaultSnapshots.outputTokenPriceUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.rewardTokenEmissionsAmount = [constants.BIGINT_ZERO];
    vaultSnapshots.rewardTokenEmissionsUSD = [constants.BIGDECIMAL_ZERO];
  }

  return vaultSnapshots;
}

export function updateFinancials(blockNumber: BigInt, timestamp: BigInt): void {
  // Number of days since Unix epoch
  let id: i64 = timestamp.toI64() / constants.SECONDS_PER_DAY;
  const financialMetrics = utils.getOrCreateFinancialSnapshots(id.toString());

  const protocol = YieldAggregator.load(constants.ETHEREUM_PROTOCOL_ID);
  if (protocol) {
    let protocolTvlUsd = constants.BIGDECIMAL_ZERO;
    let protocolTotalVolumeUSD = constants.BIGDECIMAL_ZERO;

    for (let i = 0; i < protocol._vaultIds!.length; i++) {
      const vaultId = protocol._vaultIds![i];
      const vaultStore = VaultStore.load(vaultId);

      if (vaultStore) {
        protocolTotalVolumeUSD = protocolTotalVolumeUSD.plus(
          vaultStore.totalVolumeUSD
        );
        protocolTvlUsd = protocolTvlUsd.plus(vaultStore.totalValueLockedUSD);
      }
    }
    financialMetrics.totalVolumeUSD = protocolTotalVolumeUSD;
    financialMetrics.totalValueLockedUSD = protocolTvlUsd;
  }

  // Update the block number and timestamp to that of the last transaction of that day
  financialMetrics.blockNumber = blockNumber;
  financialMetrics.timestamp = timestamp;

  financialMetrics.save();
}

export function updateVaultSnapshots(
  vaultAddress: string,
  blockNumber: BigInt,
  timestamp: BigInt
): void {
  // Number of days since Unix epoch
  let id: i64 = timestamp.toI64() / constants.SECONDS_PER_DAY;

  const vault = VaultStore.load(vaultAddress);
  const vaultSnapshots = getOrCreateVaultSnapshots(id.toString());

  // TODO: vaultSnapshots.vault
  vaultSnapshots.totalValueLockedUSD = vault!.totalValueLockedUSD;
  vaultSnapshots.totalVolumeUSD = vault!.totalVolumeUSD;
  vaultSnapshots.inputTokenBalances = vault!.inputTokenBalances;
  vaultSnapshots.outputTokenSupply = vault!.outputTokenSupply;
  vaultSnapshots.outputTokenPriceUSD = vault!.outputTokenPriceUSD;
  vaultSnapshots.rewardTokenEmissionsAmount = vault!.rewardTokenEmissionsAmount;
  vaultSnapshots.rewardTokenEmissionsUSD = vault!.rewardTokenEmissionsUSD;

  vaultSnapshots.blockNumber = blockNumber;
  vaultSnapshots.timestamp = timestamp;

  vaultSnapshots.save();
}
