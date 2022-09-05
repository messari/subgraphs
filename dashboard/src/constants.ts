export namespace ProtocolType {
  export const EXCHANGE = "EXCHANGE";
  export const LENDING = "LENDING";
  export const YIELD = "YIELD";
  export const BRIDGE = "BRIDGE";
  export const GENERIC = "GENERIC";
}
export namespace Versions {
  export const Schema120 = "1.2.0";
  export const Schema130 = "1.3.0";
  export const Schema201 = "2.0.1";

  // Array to list out the different schema versions available
  export const SchemaVersions = [Schema120, Schema130, Schema201];
}

export const latestSchemaVersion = "1.3.0";
export const SubgraphBaseUrl = "https://api.thegraph.com/subgraphs/name/";
export const PoolName: Record<string, string> = {
  EXCHANGE: "liquidityPool",
  LENDING: "market",
  YIELD: "vault",
  GENERIC: "pool",
};
export const PoolNames: Record<string, string> = {
  EXCHANGE: "liquidityPools",
  LENDING: "markets",
  YIELD: "vaults",
  GENERIC: "pools",
};
export const ProtocolTypeEntityName: Record<string, string> = {
  EXCHANGE: "dexAmmProtocol",
  LENDING: "lendingProtocol",
  YIELD: "yieldAggregator",
  GENERIC: "protocol",
};
export const ProtocolTypeEntityNames: Record<string, string> = {
  EXCHANGE: "dexAmmProtocols",
  LENDING: "lendingProtocols",
  YIELD: "yieldAggregators",
  GENERIC: "protocols",
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
  positionsQuery?: string;
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

export const blockExplorers: Record<string, string> = {
  ARBITRUM: "https://arbiscan.io/",
  AURORA: "https://aurorascan.dev/",
  AVALANCHE: "https://snowtrace.io/",
  BSC: "https://bscscan.com/",
  FANTOM: "https://ftmscan.com/",
  ETHEREUM: "https://etherscan.io/",
  POLYGON: "https://polygonscan.com/",
  MOONRIVER: "https://moonriver.moonscan.io/",
  OPTIMISM: "https://optimistic.etherscan.io/",
  GNOSIS: "https://blockscout.com/xdai/mainnet/",
  CELO: "https://explorer.celo.org/",
  FUSE: "https://explorer.fuse.io/",
  HARMONY: "https://explorer.harmony.one/",
  CRONOS: "https://cronoscan.com/",
};

// negativeFieldList contains field names that can be negative
export const negativeFieldList = [];
