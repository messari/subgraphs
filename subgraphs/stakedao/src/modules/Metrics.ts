import {
  _Account,
  YieldAggregator,
  _DailyActiveAccount,
  Vault as VaultStore,
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
} from "../../generated/schema";
import * as constants from "../common/constants";
import { BigInt, Address } from "@graphprotocol/graph-ts";

export function updateFinancials(
  blockNumber: BigInt,
  timestamp: BigInt,
): void {
  // Number of days since Unix epoch
  let id: i64 = timestamp.toI64() / constants.SECONDS_PER_DAY;
  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = constants.ETHEREUM_PROTOCOL_ID;

    financialMetrics.feesUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.totalVolumeUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.protocolTreasuryUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.supplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.protocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
  }

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
