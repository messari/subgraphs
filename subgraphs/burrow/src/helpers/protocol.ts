import { dataSource, log, near, BigInt } from '@graphprotocol/graph-ts';
import { LendingProtocol, UsageMetricsDailySnapshot, UsageMetricsHourlySnapshot, FinancialsDailySnapshot } from '../../generated/schema';
import { BD_ZERO } from "../utils/const";

export function getOrCreateProtocol(): LendingProtocol {
	let protocol = LendingProtocol.load(dataSource.address().toString());
	if (!protocol) {
		protocol = new LendingProtocol(dataSource.address().toString());
		protocol.name = "Burrow Cash";
		protocol.slug = "BURROW";
		protocol.schemaVersion = "1.0.0";
		protocol.subgraphVersion = "1.0.0";
		protocol.methodologyVersion = "1.0.0";
		protocol.network = "NEAR_MAINNET";
		protocol.type = "LENDING";
		protocol.totalValueLockedUSD = BD_ZERO;
		protocol.protocolControlledValueUSD = BD_ZERO;
		protocol.cumulativeUniqueUsers = 0;
		protocol.cumulativeSupplySideRevenueUSD = BD_ZERO;
		protocol.cumulativeProtocolSideRevenueUSD = BD_ZERO;
		protocol.cumulativeTotalRevenueUSD = BD_ZERO;
		protocol.totalPoolCount = 0;
		protocol._marketIds = new Array<string>();
		protocol.save();
	}
	return protocol;
}

export function getOrCreateUsageMetricsDailySnapshot(
	receipt: near.ReceiptWithOutcome
): UsageMetricsDailySnapshot {
	let timestamp = receipt.block.header.timestampNanosec / 86400000000000;
	let id = timestamp.toString();
	let usageMetricsDailySnapshot = UsageMetricsDailySnapshot.load(id);
	if (!usageMetricsDailySnapshot) {
		usageMetricsDailySnapshot = new UsageMetricsDailySnapshot(id);

		usageMetricsDailySnapshot.dailyActiveUsers = 0;
		usageMetricsDailySnapshot.cumulativeUniqueUsers = 0;
		usageMetricsDailySnapshot.cumulativeUniqueBorrowers = 0;
		usageMetricsDailySnapshot.dailyActiveLiquidators = 0;
		usageMetricsDailySnapshot.cumulativeUniqueLiquidators = 0;
		usageMetricsDailySnapshot.dailyActiveLiquidatees = 0;
		usageMetricsDailySnapshot.cumulativeUniqueLiquidatees = 0;
		usageMetricsDailySnapshot.dailyTransactionCount = 0;
		usageMetricsDailySnapshot.dailyDepositCount = 0;
		usageMetricsDailySnapshot.dailyWithdrawCount = 0;
		usageMetricsDailySnapshot.dailyBorrowCount = 0;
		usageMetricsDailySnapshot.dailyRepayCount = 0;
		usageMetricsDailySnapshot.dailyLiquidateCount = 0;
		usageMetricsDailySnapshot.totalPoolCount = 0;
		usageMetricsDailySnapshot.blockNumber = BigInt.fromU64(receipt.block.header.height);
		usageMetricsDailySnapshot.timestamp = BigInt.fromU64(receipt.block.header.timestampNanosec / 1000000000);
		usageMetricsDailySnapshot.save();
		let previousTimestamp = timestamp - 1;
		let previousUsageMetricsDailySnapshot = UsageMetricsDailySnapshot.load(previousTimestamp.toString());
		if (previousUsageMetricsDailySnapshot) {
			usageMetricsDailySnapshot.cumulativeUniqueUsers = previousUsageMetricsDailySnapshot.cumulativeUniqueUsers;
			usageMetricsDailySnapshot.cumulativeUniqueBorrowers = previousUsageMetricsDailySnapshot.cumulativeUniqueBorrowers;
			usageMetricsDailySnapshot.cumulativeUniqueLiquidators = previousUsageMetricsDailySnapshot.cumulativeUniqueLiquidators;
			usageMetricsDailySnapshot.cumulativeUniqueLiquidatees = previousUsageMetricsDailySnapshot.cumulativeUniqueLiquidatees;
			usageMetricsDailySnapshot.save();
		}
	}
	return usageMetricsDailySnapshot as UsageMetricsDailySnapshot;
}

// UsageMetricsHourlySnapshot
export function getOrCreateUsageMetricsHourlySnapshot(
	receipt: near.ReceiptWithOutcome
): UsageMetricsHourlySnapshot {
	let timestamp = receipt.block.header.timestampNanosec / 3600000000000;
	let id = timestamp.toString();
	let usageMetricsHourlySnapshot = UsageMetricsHourlySnapshot.load(id);
	if (!usageMetricsHourlySnapshot) {
		usageMetricsHourlySnapshot = new UsageMetricsHourlySnapshot(id);
		usageMetricsHourlySnapshot.hourlyActiveUsers = 0;
		usageMetricsHourlySnapshot.cumulativeUniqueUsers = 0;
		usageMetricsHourlySnapshot.hourlyTransactionCount = 0;
		usageMetricsHourlySnapshot.hourlyDepositCount = 0;
		usageMetricsHourlySnapshot.hourlyWithdrawCount = 0;
		usageMetricsHourlySnapshot.hourlyBorrowCount = 0;
		usageMetricsHourlySnapshot.hourlyRepayCount = 0;
		usageMetricsHourlySnapshot.hourlyLiquidateCount = 0;
		usageMetricsHourlySnapshot.blockNumber = BigInt.fromU64(receipt.block.header.height);
		usageMetricsHourlySnapshot.timestamp = BigInt.fromU64(receipt.block.header.timestampNanosec / 1000000000);
		usageMetricsHourlySnapshot.save();
		let previousTimestamp = timestamp - 1;
		let previousUsageMetricsHourlySnapshot = UsageMetricsHourlySnapshot.load(previousTimestamp.toString());
		if (previousUsageMetricsHourlySnapshot) {
			usageMetricsHourlySnapshot.cumulativeUniqueUsers = previousUsageMetricsHourlySnapshot.cumulativeUniqueUsers;
			usageMetricsHourlySnapshot.save();
		}
	}
	return usageMetricsHourlySnapshot as UsageMetricsHourlySnapshot;
}

export function getOrCreateFinancialDailySnapshot(
	receipt: near.ReceiptWithOutcome
): FinancialsDailySnapshot {
	let timestamp = receipt.block.header.timestampNanosec / 86400000000000;
	let id = timestamp.toString();
	let financialsDailySnapshot = FinancialsDailySnapshot.load(id);
	if (!financialsDailySnapshot) {
		financialsDailySnapshot = new FinancialsDailySnapshot(id);
		financialsDailySnapshot.protocol = getOrCreateProtocol().id;
		financialsDailySnapshot.blockNumber = BigInt.fromU64(receipt.block.header.height);
		financialsDailySnapshot.timestamp = BigInt.fromU64(receipt.block.header.timestampNanosec / 1000000000);
		financialsDailySnapshot.totalValueLockedUSD = BD_ZERO
		financialsDailySnapshot.protocolControlledValueUSD = BD_ZERO
		financialsDailySnapshot.dailySupplySideRevenueUSD = BD_ZERO
		financialsDailySnapshot.cumulativeSupplySideRevenueUSD = BD_ZERO
		financialsDailySnapshot.dailyProtocolSideRevenueUSD = BD_ZERO
		financialsDailySnapshot.cumulativeProtocolSideRevenueUSD = BD_ZERO
		financialsDailySnapshot.dailyTotalRevenueUSD = BD_ZERO
		financialsDailySnapshot.cumulativeTotalRevenueUSD = BD_ZERO
		financialsDailySnapshot.totalDepositBalanceUSD = BD_ZERO
		financialsDailySnapshot.dailyDepositUSD = BD_ZERO
		financialsDailySnapshot.cumulativeDepositUSD = BD_ZERO
		financialsDailySnapshot.totalBorrowBalanceUSD = BD_ZERO
		financialsDailySnapshot.dailyBorrowUSD = BD_ZERO
		financialsDailySnapshot.cumulativeBorrowUSD = BD_ZERO
		financialsDailySnapshot.dailyLiquidateUSD = BD_ZERO
		financialsDailySnapshot.cumulativeLiquidateUSD = BD_ZERO
		financialsDailySnapshot.dailyWithdrawUSD = BD_ZERO
		financialsDailySnapshot.dailyRepayUSD = BD_ZERO
		financialsDailySnapshot.save();
		let previousTimestamp = timestamp - 1;
		let previousFinancialsDailySnapshot = FinancialsDailySnapshot.load(previousTimestamp.toString());
		if (previousFinancialsDailySnapshot) {
			financialsDailySnapshot.cumulativeSupplySideRevenueUSD = previousFinancialsDailySnapshot.cumulativeSupplySideRevenueUSD;
			financialsDailySnapshot.cumulativeProtocolSideRevenueUSD = previousFinancialsDailySnapshot.cumulativeProtocolSideRevenueUSD;
			financialsDailySnapshot.cumulativeTotalRevenueUSD = previousFinancialsDailySnapshot.cumulativeTotalRevenueUSD;
			financialsDailySnapshot.cumulativeDepositUSD = previousFinancialsDailySnapshot.cumulativeDepositUSD;
			financialsDailySnapshot.cumulativeBorrowUSD = previousFinancialsDailySnapshot.cumulativeBorrowUSD;
			financialsDailySnapshot.cumulativeLiquidateUSD = previousFinancialsDailySnapshot.cumulativeLiquidateUSD;
			financialsDailySnapshot.save();
		}
	}
	return financialsDailySnapshot as FinancialsDailySnapshot;
}