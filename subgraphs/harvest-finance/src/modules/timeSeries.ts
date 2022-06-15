import { decimal, integer } from "@protofire/subgraph-toolkit";
import { FinancialsDailySnapshot, UsageMetricsDailySnapshot, UsageMetricsHourlySnapshot } from "../../generated/schema"
import { protocol } from "./protocol";
import { shared } from "./shared";

export namespace timeSeries {

	export namespace financials {

		export function loadOrCreateFinancialDailySnapshot(id: string): FinancialsDailySnapshot {
			let entity = FinancialsDailySnapshot.load(id)
			if (entity == null) {
				entity = new FinancialsDailySnapshot(id)
				entity.protocol = protocol.getProtocolId(shared.constants.PROTOCOL_ID);
				entity.totalValueLockedUSD = decimal.ZERO
				entity.protocolControlledValueUSD = decimal.ZERO
				entity.dailySupplySideRevenueUSD = decimal.ZERO
				entity.cumulativeSupplySideRevenueUSD = decimal.ZERO
				entity.dailyProtocolSideRevenueUSD = decimal.ZERO
				entity.cumulativeProtocolSideRevenueUSD = decimal.ZERO
				entity.dailyTotalRevenueUSD = decimal.ZERO
				entity.cumulativeTotalRevenueUSD = decimal.ZERO
				entity.blockNumber = integer.ZERO
				entity.timestamp = integer.ZERO
			}
			return entity as FinancialsDailySnapshot
		}

	}
	export namespace usageMetrics {
		export function loadOrCreateHourlySnapshot(id: string): UsageMetricsHourlySnapshot {
			let entity = UsageMetricsHourlySnapshot.load(id)
			if (entity == null) {
				entity = new UsageMetricsHourlySnapshot(id)
				entity.protocol = protocol.getProtocolId(shared.constants.PROTOCOL_ID);
				entity.hourlyActiveUsers = 0;
				entity.cumulativeUniqueUsers = 0;
				entity.hourlyTransactionCount = 0;
				entity.hourlyDepositCount = 0;
				entity.hourlyWithdrawCount = 0;
				entity.blockNumber = integer.ZERO;
				entity.timestamp = integer.ZERO;
			}
			return entity as UsageMetricsHourlySnapshot
		}
		export function loadOrCreateDailySnapshot(id: string): UsageMetricsDailySnapshot {
			let entity = UsageMetricsDailySnapshot.load(id)
			if (entity == null) {
				entity = new UsageMetricsDailySnapshot(id)
				entity.protocol = protocol.getProtocolId(shared.constants.PROTOCOL_ID);
				entity.dailyActiveUsers = 0;
				entity.cumulativeUniqueUsers = 0;
				entity.dailyTransactionCount = 0;
				entity.dailyDepositCount = 0;
				entity.dailyWithdrawCount = 0;
				entity.blockNumber = integer.ZERO;
				entity.timestamp = integer.ZERO;
			}
			return entity as UsageMetricsDailySnapshot
		}
	}
}