import {
  _Account,
  YieldAggregator,
  _DailyActiveAccount,
  Vault as VaultStore,
  UsageMetricsDailySnapshot,
} from "../../generated/schema";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { BigInt, Address } from "@graphprotocol/graph-ts";

export function updateFinancials(blockNumber: BigInt, timestamp: BigInt): void {
  // Number of days since Unix epoch
  let id: i64 = timestamp.toI64() / constants.SECONDS_PER_DAY;
  const financialMetrics = utils.getOrCreateFinancialSnapshots(id.toString());

  const protocol = YieldAggregator.load(constants.ETHEREUM_PROTOCOL_ID);
  if (protocol) {
    let protocolTvlUsd = constants.BIGDECIMAL_ZERO;
    let protocolTotalVolumeUSD = constants.BIGDECIMAL_ZERO;

    for (let i = 0; i < protocol._vaultIds.length; i++) {
      const vaultId = protocol._vaultIds[i];
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

export function updateUsageMetrics(
  blockNumber: BigInt,
  timestamp: BigInt,
  from: Address
): void {
  // Number of days since Unix epoch
  let id: i64 = timestamp.toI64() / constants.SECONDS_PER_DAY;
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = constants.ETHEREUM_PROTOCOL_ID;

    usageMetrics.activeUsers = 0;
    usageMetrics.totalUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
  }

  // Update the block number and timestamp to that of the last transaction of that day
  usageMetrics.blockNumber = blockNumber;
  usageMetrics.timestamp = timestamp;
  usageMetrics.dailyTransactionCount += 1;

  let accountId = from.toHexString();
  let account = _Account.load(accountId);
  if (!account) {
    account = new _Account(accountId);
    account.save();
    usageMetrics.totalUniqueUsers += 1;
  }

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = id.toString() + "-" + from.toHexString();
  let dailyActiveAccount = _DailyActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new _DailyActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    usageMetrics.activeUsers += 1;
  }

  usageMetrics.save();
}

export function updateVaultSnapshots(
  vaultAddress: string,
  blockNumber: BigInt,
  timestamp: BigInt
): void {
  // Number of days since Unix epoch
  let id: i64 = timestamp.toI64() / constants.SECONDS_PER_DAY;

  const vault = VaultStore.load(vaultAddress);
  const vaultSnapshots = utils.getOrCreateVaultSnapshots(id.toString());

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
