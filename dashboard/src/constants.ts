export namespace ProtocolType {
  export const EXCHANGE = "EXCHANGE";
  export const LENDING = "LENDING";
  export const YIELD = "YIELD";
  export const BRIDGE = "BRIDGE";
  export const GENERIC = "GENERIC";
}
export namespace Versions {
  export const Schema100 = "1.0.0";
  export const Schema110 = "1.1.0";
  export const Schema120 = "1.2.0";
  export const Schema130 = "1.3.0";

  // Array to list out the different schema versions available
  export const SchemaVersions = [Schema100, Schema110, Schema120, Schema130];
}

export const latestSchemaVersion = "1.3.0";
export const SubgraphBaseUrl = "https://api.thegraph.com/subgraphs/name/";
export const PoolName: Record<string, string> = {
  EXCHANGE: "liquidityPool",
  LENDING: "market",
  YIELD: "vault",
};
export const PoolNames: Record<string, string> = {
  EXCHANGE: "liquidityPools",
  LENDING: "markets",
  YIELD: "vaults",
};
export const ProtocolTypeEntityName: Record<string, string> = {
  EXCHANGE: "dexAmmProtocol",
  LENDING: "lendingProtocol",
  YIELD: "yieldAggregator",
};
export const ProtocolTypeEntityNames: Record<string, string> = {
  EXCHANGE: "dexAmmProtocols",
  LENDING: "lendingProtocols",
  YIELD: "yieldAggregators",
};
export interface Schema {
  entities: string[];
  entitiesData: { [x: string]: { [x: string]: string } };
  poolData: { [x: string]: string };
  events: string[];
  protocolFields: { [x: string]: string };
  query: string;
  financialsQuery: string;
  hourlyUsageQuery: string;
  dailyUsageQuery: string;
  protocolTableQuery: string;
  poolsQuery: string;
  poolTimeseriesQuery: string;
}
export const percentageFieldList = [
  "rates",
  "rewardAPR",
  "maximumLTV",
  "liquidationThreshold",
  "liquidationPenalty",
  "inputTokenWeights",
  "baseYield",
  "fee",
  "percentage",
];
// negativeFieldList contains field names that can be negative
export const negativeFieldList = [];
