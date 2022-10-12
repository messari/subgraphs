// Update usage metrics entities

import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { addresses } from "../../config/addresses";
import { Account, ActiveAccount } from "../../generated/schema";
import { INT_ONE, SECONDS_PER_DAY, SECONDS_PER_HOUR } from "./constants";
import {
  getOrCreateFinancialsDailySnapshot,
  getOrCreateProtocol,
  getOrCreateToken,
  getOrCreateUsageMetricDailySnapshot,
  getOrCreateUsageMetricHourlySnapshot,
} from "./getters";
import { convertTokenToDecimal } from "./utils";

// Updated on Swap, Burn, and Mint events.
export function updateUsageMetrics(
  event: ethereum.Event,
  usageAddress: Address
): void {
  const from = usageAddress.toHexString();

  const usageMetricsDaily = getOrCreateUsageMetricDailySnapshot(event);
  const usageMetricsHourly = getOrCreateUsageMetricHourlySnapshot(event);

  const protocol = getOrCreateProtocol();

  // Update the block number and timestamp to that of the last transaction of that day
  usageMetricsDaily.blockNumber = event.block.number;
  usageMetricsDaily.timestamp = event.block.timestamp;
  usageMetricsDaily.dailyTransactionCount += INT_ONE;

  usageMetricsHourly.blockNumber = event.block.number;
  usageMetricsHourly.timestamp = event.block.timestamp;
  usageMetricsHourly.hourlyTransactionCount += INT_ONE;

  // Number of days since Unix epoch
  const day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;

  const dayId = day.toString();
  const hourId = hour.toString();

  // Combine the id and the user address to generate a unique user id for the day
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

export function updateTVL(event: ethereum.Event, tokens: BigInt): void {
  const protocol = getOrCreateProtocol();
  const financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  const grt = getOrCreateToken(event, addresses.graphToken);

  protocol._totalGRTLocked = protocol._totalGRTLocked.plus(tokens);
  protocol.totalValueLockedUSD = convertTokenToDecimal(
    protocol._totalGRTLocked,
    grt.decimals
  ).times(grt.lastPriceUSD!);
  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;

  financialMetrics.save();
  protocol.save();
}

export function updateSupplySideRewards(
  event: ethereum.Event,
  amount: BigInt
): void {
  const protocol = getOrCreateProtocol();
  const financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  const grt = getOrCreateToken(event, addresses.graphToken);

  const rewardsAmountUSD = convertTokenToDecimal(amount, grt.decimals).times(
    grt.lastPriceUSD!
  );

  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(rewardsAmountUSD);
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(rewardsAmountUSD);

  financialMetrics.dailySupplySideRevenueUSD =
    financialMetrics.dailySupplySideRevenueUSD.plus(rewardsAmountUSD);
  financialMetrics.dailyTotalRevenueUSD =
    financialMetrics.dailyTotalRevenueUSD.plus(rewardsAmountUSD);

  financialMetrics.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;

  financialMetrics.save();
  protocol.save();
}

export function updateProtocolSideRewards(
  event: ethereum.Event,
  amount: BigInt
): void {
  const protocol = getOrCreateProtocol();
  const financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  const grt = getOrCreateToken(event, addresses.graphToken);

  const rewardsAmountUSD = convertTokenToDecimal(amount, grt.decimals).times(
    grt.lastPriceUSD!
  );

  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(rewardsAmountUSD);
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(rewardsAmountUSD);

  financialMetrics.dailyProtocolSideRevenueUSD =
    financialMetrics.dailyProtocolSideRevenueUSD.plus(rewardsAmountUSD);
  financialMetrics.dailyTotalRevenueUSD =
    financialMetrics.dailyTotalRevenueUSD.plus(rewardsAmountUSD);

  financialMetrics.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialMetrics.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;

  financialMetrics.save();
  protocol.save();
}
