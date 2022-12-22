import { Address, BigInt, ethereum, BigDecimal } from "@graphprotocol/graph-ts";

import {
  getOrCreateVault,
  getOrCreateYieldAggregator,
  getOrCreateVaultDailySnapshots,
  getOrCreateVaultHourlySnapshots,
  getOrCreateFinancialDailySnapshots,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
  getOrCreateToken,
} from "../common/getters";
import {
  INT_ONE,
  BIGDECIMAL_ZERO,
  BIGDECIMAL_ONE,
  BIGINT_ZERO,
  RewardIntervalType,
} from "../common/constants";
import { getAuraMintAmount, getRewardsPerDay } from "../common/rewards";
import { getDaysSinceEpoch, getHoursSinceEpoch } from "./utils/datetime";
import { readValue } from "./utils/ethereum";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "./utils/numbers";
import { NetworkConfigs } from "../../configurations/configure";

import {
  ActiveAccount,
  Account,
  Vault as VaultStore,
} from "../../generated/schema";
import { BaseRewardPool } from "../../generated/Booster-v1/BaseRewardPool";

export function updateProtocolTotalValueLockedUSD(): void {
  const protocol = getOrCreateYieldAggregator();
  const vaultIds = protocol._vaultIds;

  let totalValueLockedUSD = BIGDECIMAL_ZERO;
  for (let idx = 0; idx < vaultIds.length; idx++) {
    const vault = VaultStore.load(vaultIds[idx]);

    if (!vault) continue;
    totalValueLockedUSD = totalValueLockedUSD.plus(vault.totalValueLockedUSD);
  }

  protocol.totalValueLockedUSD = totalValueLockedUSD;
  protocol.save();
}

export function updateUsageMetrics(event: ethereum.Event): void {
  const protocol = getOrCreateYieldAggregator();
  const usageMetricsDaily = getOrCreateUsageMetricsDailySnapshot(event);
  const usageMetricsHourly = getOrCreateUsageMetricsHourlySnapshot(event);

  usageMetricsDaily.blockNumber = event.block.number;
  usageMetricsHourly.blockNumber = event.block.number;

  usageMetricsDaily.timestamp = event.block.timestamp;
  usageMetricsHourly.timestamp = event.block.timestamp;

  usageMetricsDaily.dailyTransactionCount += INT_ONE;
  usageMetricsHourly.hourlyTransactionCount += INT_ONE;

  const from = event.transaction.from.toHexString();
  const dayId = getDaysSinceEpoch(event.block.timestamp.toI32());
  const hourId = getHoursSinceEpoch(event.block.timestamp.toI32());

  const dailyActiveAccountId = from.concat("-").concat(dayId);
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    usageMetricsDaily.dailyActiveUsers += INT_ONE;
    dailyActiveAccount.save();
  }

  const hourlyActiveAccountId = from.concat("-").concat(hourId);
  let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountId);
  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountId);
    usageMetricsHourly.hourlyActiveUsers += INT_ONE;
    hourlyActiveAccount.save();
  }

  let account = Account.load(from);
  if (!account) {
    account = new Account(from);
    protocol.cumulativeUniqueUsers += INT_ONE;
    account.save();
  }

  usageMetricsDaily.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetricsHourly.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  usageMetricsDaily.save();
  usageMetricsHourly.save();
  protocol.save();
}

export function updateUsageMetricsAfterDeposit(event: ethereum.Event): void {
  const usageMetricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(event);
  const usageMetricsHourlySnapshot =
    getOrCreateUsageMetricsHourlySnapshot(event);

  usageMetricsDailySnapshot.dailyDepositCount += 1;
  usageMetricsHourlySnapshot.hourlyDepositCount += 1;

  usageMetricsDailySnapshot.save();
  usageMetricsHourlySnapshot.save();
}

export function updateUsageMetricsAfterWithdraw(event: ethereum.Event): void {
  const usageMetricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(event);
  const usageMetricsHourlySnapshot =
    getOrCreateUsageMetricsHourlySnapshot(event);

  usageMetricsDailySnapshot.dailyWithdrawCount += 1;
  usageMetricsHourlySnapshot.hourlyWithdrawCount += 1;

  usageMetricsDailySnapshot.save();
  usageMetricsHourlySnapshot.save();
}

export function updateFinancials(event: ethereum.Event): void {
  const protocol = getOrCreateYieldAggregator();
  const financialMetrics = getOrCreateFinancialDailySnapshots(event);

  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetrics.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialMetrics.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;

  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;

  financialMetrics.save();
}

export function updateVaultSnapshots(
  boosterAddr: Address,
  poolId: BigInt,
  event: ethereum.Event
): void {
  const vault = getOrCreateVault(boosterAddr, poolId, event);
  if (!vault) return;

  const vaultDailySnapshots = getOrCreateVaultDailySnapshots(vault.id, event);
  const vaultHourlySnapshots = getOrCreateVaultHourlySnapshots(vault.id, event);

  vaultDailySnapshots.totalValueLockedUSD = vault.totalValueLockedUSD;
  vaultHourlySnapshots.totalValueLockedUSD = vault.totalValueLockedUSD;

  vaultDailySnapshots.inputTokenBalance = vault.inputTokenBalance;
  vaultHourlySnapshots.inputTokenBalance = vault.inputTokenBalance;

  vaultDailySnapshots.outputTokenSupply = vault.outputTokenSupply!;
  vaultHourlySnapshots.outputTokenSupply = vault.outputTokenSupply!;

  vaultDailySnapshots.outputTokenPriceUSD = vault.outputTokenPriceUSD;
  vaultHourlySnapshots.outputTokenPriceUSD = vault.outputTokenPriceUSD;

  vaultDailySnapshots.pricePerShare = vault.pricePerShare;
  vaultHourlySnapshots.pricePerShare = vault.pricePerShare;

  vaultDailySnapshots.rewardTokenEmissionsAmount =
    vault.rewardTokenEmissionsAmount;
  vaultHourlySnapshots.rewardTokenEmissionsAmount =
    vault.rewardTokenEmissionsAmount;

  vaultDailySnapshots.rewardTokenEmissionsUSD = vault.rewardTokenEmissionsUSD;
  vaultHourlySnapshots.rewardTokenEmissionsUSD = vault.rewardTokenEmissionsUSD;

  vaultDailySnapshots.cumulativeProtocolSideRevenueUSD =
    vault.cumulativeProtocolSideRevenueUSD;
  vaultHourlySnapshots.cumulativeProtocolSideRevenueUSD =
    vault.cumulativeProtocolSideRevenueUSD;

  vaultDailySnapshots.cumulativeSupplySideRevenueUSD =
    vault.cumulativeSupplySideRevenueUSD;
  vaultHourlySnapshots.cumulativeSupplySideRevenueUSD =
    vault.cumulativeSupplySideRevenueUSD;

  vaultDailySnapshots.cumulativeTotalRevenueUSD =
    vault.cumulativeTotalRevenueUSD;
  vaultHourlySnapshots.cumulativeTotalRevenueUSD =
    vault.cumulativeTotalRevenueUSD;

  vaultDailySnapshots.blockNumber = event.block.number;
  vaultHourlySnapshots.blockNumber = event.block.number;

  vaultDailySnapshots.timestamp = event.block.timestamp;
  vaultHourlySnapshots.timestamp = event.block.timestamp;

  vaultDailySnapshots.save();
  vaultHourlySnapshots.save();
}

export function updateRevenue(
  boosterAddr: Address,
  poolId: BigInt,
  totalRevenueUSD: BigDecimal,
  totalFees: BigDecimal,
  event: ethereum.Event
): void {
  const protocolSideRevenueUSD = totalFees.times(totalRevenueUSD);
  const supplySideRevenueUSD =
    BIGDECIMAL_ONE.minus(totalFees).times(totalRevenueUSD);

  const protocol = getOrCreateYieldAggregator();
  const vault = getOrCreateVault(boosterAddr, poolId, event);
  if (!vault) return;

  const financialMetrics = getOrCreateFinancialDailySnapshots(event);
  const vaultDailySnapshot = getOrCreateVaultDailySnapshots(vault.id, event);
  const vaultHourlySnapshot = getOrCreateVaultHourlySnapshots(vault.id, event);

  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(supplySideRevenueUSD);
  vault.cumulativeSupplySideRevenueUSD =
    vault.cumulativeSupplySideRevenueUSD.plus(supplySideRevenueUSD);

  financialMetrics.dailySupplySideRevenueUSD =
    financialMetrics.dailySupplySideRevenueUSD.plus(supplySideRevenueUSD);
  vaultDailySnapshot.dailySupplySideRevenueUSD =
    vaultDailySnapshot.dailySupplySideRevenueUSD.plus(supplySideRevenueUSD);
  vaultHourlySnapshot.hourlySupplySideRevenueUSD =
    vaultHourlySnapshot.hourlySupplySideRevenueUSD.plus(supplySideRevenueUSD);

  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);
  vault.cumulativeProtocolSideRevenueUSD =
    vault.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);

  financialMetrics.dailyProtocolSideRevenueUSD =
    financialMetrics.dailyProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);
  vaultDailySnapshot.dailyProtocolSideRevenueUSD =
    vaultDailySnapshot.dailyProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);
  vaultHourlySnapshot.hourlyProtocolSideRevenueUSD =
    vaultHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(
      protocolSideRevenueUSD
    );

  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(totalRevenueUSD);
  vault.cumulativeTotalRevenueUSD =
    vault.cumulativeTotalRevenueUSD.plus(totalRevenueUSD);

  financialMetrics.dailyTotalRevenueUSD =
    financialMetrics.dailyTotalRevenueUSD.plus(totalRevenueUSD);
  vaultDailySnapshot.dailyTotalRevenueUSD =
    vaultDailySnapshot.dailyTotalRevenueUSD.plus(totalRevenueUSD);
  vaultHourlySnapshot.hourlyTotalRevenueUSD =
    vaultHourlySnapshot.hourlyTotalRevenueUSD.plus(totalRevenueUSD);

  vaultHourlySnapshot.save();
  vaultDailySnapshot.save();
  vault.save();
  financialMetrics.save();
  protocol.save();
}

export function updateRewards(
  boosterAddr: Address,
  poolId: BigInt,
  poolRewardsAddress: Address,
  event: ethereum.Event
): void {
  const poolRewardsContract = BaseRewardPool.bind(poolRewardsAddress);
  const rewardTokenAddr = Address.fromString(NetworkConfigs.getRewardToken());

  let balRewardRate = BIGINT_ZERO;
  const periodFinishCall = poolRewardsContract.try_periodFinish();
  if (
    !periodFinishCall.reverted &&
    periodFinishCall.value >= event.block.timestamp
  ) {
    balRewardRate = readValue<BigInt>(
      poolRewardsContract.try_rewardRate(),
      BIGINT_ZERO
    );
  }

  const auraRewardRate = getAuraMintAmount(rewardTokenAddr, balRewardRate);

  const rewardsPerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    auraRewardRate,
    RewardIntervalType.TIMESTAMP
  );

  const vault = getOrCreateVault(boosterAddr, poolId, event);
  if (!vault) return;

  const rewardToken = getOrCreateToken(rewardTokenAddr, event.block.number);

  vault.rewardTokenEmissionsAmount = [bigDecimalToBigInt(rewardsPerDay)];
  vault.rewardTokenEmissionsUSD = [
    bigIntToBigDecimal(
      vault.rewardTokenEmissionsAmount![0],
      rewardToken.decimals
    ).times(rewardToken.lastPriceUSD!),
  ];

  vault.save();
}
