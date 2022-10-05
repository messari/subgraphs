import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  ActiveUser,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  Vault,
  YieldAggregator,
} from "../../generated/schema";
import { BIGINT_ZERO, BIGINT_ONE } from "../prices/common/constants";
import {
  getOrCreateVaultDailySnapshot,
  getOrCreateVaultHourlySnapshot,
  getOrCreateYieldAggregator,
} from "./getters";
import { getDaysSinceEpoch, getHoursSinceEpoch } from "./time";

export function getProtocolHourlyId(
  block: ethereum.Block,
  protocol: YieldAggregator
): string {
  const daysSinceEpoch = getHoursSinceEpoch(block.timestamp.toI32());
  const id = protocol.id.concat("-").concat(daysSinceEpoch.toString());
  return id;
}

export function updateVaultSnapshots(
  event: ethereum.Event,
  vault: Vault
): void {
  const vaultDailySnapshot = getOrCreateVaultDailySnapshot(vault.id, event);
  vaultDailySnapshot.totalValueLockedUSD = vault.totalValueLockedUSD;
  vaultDailySnapshot.inputTokenBalance = vault.inputTokenBalance;
  vaultDailySnapshot.outputTokenSupply = vault.outputTokenSupply;
  vaultDailySnapshot.outputTokenPriceUSD = vault.outputTokenPriceUSD;
  vaultDailySnapshot.pricePerShare = vault.pricePerShare;
  vaultDailySnapshot.save();

  const vaultHourlySnapshot = getOrCreateVaultHourlySnapshot(vault.id, event);
  vaultHourlySnapshot.totalValueLockedUSD = vault.totalValueLockedUSD;
  vaultHourlySnapshot.inputTokenBalance = vault.inputTokenBalance;
  vaultHourlySnapshot.outputTokenSupply = vault.outputTokenSupply;
  vaultHourlySnapshot.outputTokenPriceUSD = vault.outputTokenPriceUSD;
  vaultHourlySnapshot.pricePerShare = vault.pricePerShare;
  vaultHourlySnapshot.save();
}

export function updateUsageMetricsDailySnapshot(
  event: ethereum.Event,
  deposit: boolean,
  withdraw: boolean
): UsageMetricsDailySnapshot {
  const protocol = getOrCreateYieldAggregator();
  const id = getDaysSinceEpoch(event.block.timestamp.toI32()).toString();
  let protocolDailySnapshot = UsageMetricsDailySnapshot.load(id);
  if (protocolDailySnapshot == null) {
    protocolDailySnapshot = new UsageMetricsDailySnapshot(id);
    protocolDailySnapshot.protocol = protocol.id;
    protocolDailySnapshot.dailyActiveUsers = isNewDailyActiveUser(
      event.transaction.from,
      event.block
    );
    protocolDailySnapshot.cumulativeUniqueUsers =
      protocol.cumulativeUniqueUsers;
    protocolDailySnapshot.dailyTransactionCount =
      deposit || withdraw ? BIGINT_ONE : BIGINT_ZERO;
    protocolDailySnapshot.dailyDepositCount = deposit
      ? BIGINT_ONE
      : BIGINT_ZERO;
    protocolDailySnapshot.dailyWithdrawCount = withdraw
      ? BIGINT_ONE
      : BIGINT_ZERO;
    protocolDailySnapshot.blockNumber = event.block.number;
    protocolDailySnapshot.timestamp = event.block.timestamp;
    protocolDailySnapshot.save();
  } else {
    protocolDailySnapshot.dailyActiveUsers =
      protocolDailySnapshot.dailyActiveUsers.plus(
        isNewDailyActiveUser(event.transaction.from, event.block)
      );
    protocolDailySnapshot.cumulativeUniqueUsers =
      protocol.cumulativeUniqueUsers;
    protocolDailySnapshot.dailyTransactionCount =
      deposit || withdraw
        ? protocolDailySnapshot.dailyTransactionCount.plus(BIGINT_ONE)
        : protocolDailySnapshot.dailyTransactionCount;
    protocolDailySnapshot.dailyDepositCount = deposit
      ? protocolDailySnapshot.dailyDepositCount.plus(BIGINT_ONE)
      : protocolDailySnapshot.dailyDepositCount;
    protocolDailySnapshot.dailyWithdrawCount = withdraw
      ? protocolDailySnapshot.dailyWithdrawCount.plus(BIGINT_ONE)
      : protocolDailySnapshot.dailyWithdrawCount;
    protocolDailySnapshot.blockNumber = event.block.number;
    protocolDailySnapshot.timestamp = event.block.timestamp;
    protocolDailySnapshot.save();
  }

  return protocolDailySnapshot;
}

export function updateUsageMetricsHourlySnapshot(
  event: ethereum.Event,
  deposit: boolean,
  withdraw: boolean
): UsageMetricsHourlySnapshot {
  const protocol = getOrCreateYieldAggregator();
  const id = getProtocolHourlyId(event.block, protocol);
  let protocolHourlySnapshot = UsageMetricsHourlySnapshot.load(id);
  if (protocolHourlySnapshot == null) {
    protocolHourlySnapshot = new UsageMetricsHourlySnapshot(id);
    protocolHourlySnapshot.protocol = protocol.id;
    protocolHourlySnapshot.hourlyActiveUsers = isNewHourlyActiveUser(
      event.transaction.from,
      event.block
    );
    protocolHourlySnapshot.cumulativeUniqueUsers =
      protocol.cumulativeUniqueUsers;
    protocolHourlySnapshot.hourlyTransactionCount =
      deposit || withdraw ? BIGINT_ONE : BIGINT_ZERO;
    protocolHourlySnapshot.hourlyDepositCount = deposit
      ? BIGINT_ONE
      : BIGINT_ZERO;
    protocolHourlySnapshot.hourlyWithdrawCount = withdraw
      ? BIGINT_ONE
      : BIGINT_ZERO;
    protocolHourlySnapshot.blockNumber = event.block.number;
    protocolHourlySnapshot.timestamp = event.block.timestamp;
    protocolHourlySnapshot.save();
  } else {
    protocolHourlySnapshot.hourlyActiveUsers =
      protocolHourlySnapshot.hourlyActiveUsers.plus(
        isNewHourlyActiveUser(event.transaction.from, event.block)
      );
    protocolHourlySnapshot.cumulativeUniqueUsers =
      protocol.cumulativeUniqueUsers;
    protocolHourlySnapshot.hourlyTransactionCount =
      deposit || withdraw
        ? protocolHourlySnapshot.hourlyTransactionCount.plus(BIGINT_ONE)
        : protocolHourlySnapshot.hourlyTransactionCount;
    protocolHourlySnapshot.hourlyDepositCount = deposit
      ? protocolHourlySnapshot.hourlyDepositCount.plus(BIGINT_ONE)
      : protocolHourlySnapshot.hourlyDepositCount;
    protocolHourlySnapshot.hourlyWithdrawCount = withdraw
      ? protocolHourlySnapshot.hourlyWithdrawCount.plus(BIGINT_ONE)
      : protocolHourlySnapshot.hourlyWithdrawCount;
    protocolHourlySnapshot.blockNumber = event.block.number;
    protocolHourlySnapshot.timestamp = event.block.timestamp;
    protocolHourlySnapshot.save();
  }

  return protocolHourlySnapshot;
}

function isNewDailyActiveUser(user: Address, block: ethereum.Block): BigInt {
  const id =
    "daily-" +
    user.toHexString() +
    getDaysSinceEpoch(block.timestamp.toI32()).toString();
  let userEntity = ActiveUser.load(id);
  if (userEntity == null) {
    userEntity = new ActiveUser(id);
    userEntity.save();
    return BIGINT_ONE;
  } else {
    return BIGINT_ZERO;
  }
}

function isNewHourlyActiveUser(user: Address, block: ethereum.Block): BigInt {
  const id =
    "hourly-" +
    user.toHexString() +
    getHoursSinceEpoch(block.timestamp.toI32()).toString();
  let userEntity = ActiveUser.load(id);
  if (userEntity == null) {
    userEntity = new ActiveUser(id);
    userEntity.save();
    return BIGINT_ONE;
  } else {
    return BIGINT_ZERO;
  }
}
