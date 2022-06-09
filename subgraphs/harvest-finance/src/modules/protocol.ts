import { decimal } from "@protofire/subgraph-toolkit";
import { YieldAggregator } from "../../generated/schema"
import { shared } from "./"

export namespace protocol {
	export function loadOrCreateYieldAggregator(id: string): YieldAggregator {
		let entity = YieldAggregator.load(id)
		if (entity == null) {
			entity = new YieldAggregator(id)
			entity.name = shared.constants.PROTOCOL_NAME
			entity.slug = shared.constants.PROTOCOL_SLUG
			entity.schemaVersion = shared.constants.PROTOCOL_SCHEMA_VERSION
			entity.subgraphVersion = shared.constants.PROTOCOL_SUBGRAPH_VERSION
			entity.methodologyVersion = shared.constants.PROTOCOL_METHODOLOGY_VERSION
			entity.network = shared.constants.PROTOCOL_NETWORK
			entity.type = shared.constants.PROTOCOL_TYPE

			entity.totalValueLockedUSD = decimal.ZERO
			entity.protocolControlledValueUSD = decimal.ZERO
			entity.cumulativeSupplySideRevenueUSD = decimal.ZERO
			entity.cumulativeProtocolSideRevenueUSD = decimal.ZERO
			entity.cumulativeTotalRevenueUSD = decimal.ZERO
			entity.cumulativeUniqueUsers = 0;
		}
		return entity as YieldAggregator
	}
}