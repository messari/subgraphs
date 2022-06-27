import {
  getOrCreateAccount,
  getProtocolIdFromCtx,
  getOrCreateLendingProtocol,
  getOrCreateFinancialsDailySnapshot,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "../common/initializers";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { ActiveAccount } from "../../generated/schema";
import { Address, ethereum } from "@graphprotocol/graph-ts";

export function updateUsageMetrics(block: ethereum.Block, from: Address): void {
  const account = getOrCreateAccount(from.toHexString());

  const protocolId = getProtocolIdFromCtx();
  const protocol = getOrCreateLendingProtocol(protocolId);
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

export function updateFinancials(block: ethereum.Block): void {
  const financialMetrics = getOrCreateFinancialsDailySnapshot(block);
  const protocolId = getProtocolIdFromCtx();
  const protocol = getOrCreateLendingProtocol(protocolId);

  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetrics.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
  financialMetrics.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
  financialMetrics.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
  financialMetrics.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
  financialMetrics.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;
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
