import { schemaMapping } from "./utils";
import { versionsList as versionsListDex } from "./queries/dex/schema";
import { versionsList as versionsListLending } from "./queries/lending/schema";
import { versionsList as versionsListYield } from "./queries/yield/schema";
import { versionsList as versionsListGeneric } from "./queries/generic/schema";
import { versionsList as versionsListBridge } from "./queries/bridge/schema";
import { versionsList as versionsListPerp } from "./queries/perpetual/schema";

export namespace ProtocolType {
  export const EXCHANGE = "EXCHANGE";
  export const LENDING = "LENDING";
  export const YIELD = "YIELD";
  export const BRIDGE = "BRIDGE";
  export const PERPETUAL = "PERPETUAL";
  export const GENERIC = "GENERIC";
}
export namespace Versions {
  export const Schema100 = "1.0.0";
  export const Schema110 = "1.1.0";
  export const Schema120 = "1.2.0";
  export const Schema130 = "1.3.0";
  export const Schema200 = "2.0.0";
  export const Schema201 = "2.0.1";
  export const Schema300 = "3.0.0";
  export const Schema301 = "3.0.1";
  export const Schema302 = "3.0.2";
}

export const latestSchemaVersions = (schemaType: string, versionStr: string) => {
  const schema = schemaMapping[schemaType];
  if (schema === "exchanges") {
    if (["3.0.3"].includes(versionStr)) {
      return true;
    }
  } else if (schema === "lending") {
    if (["3.0.0"].includes(versionStr)) {
      return true;
    }
  } else if (schema === "vaults" || schema === "generic" || schema === "perpetual") {
    if (["1.3.0"].includes(versionStr)) {
      return true;
    }
  } else if (schema === "bridge") {
    if (["1.2.0"].includes(versionStr)) {
      return true;
    }
  } else if (schema === "generic") {
    if (["1.1.0"].includes(versionStr)) {
      return true;
    }
  }
  return false;
};

export const listSchemaVersionsByType: { [x: string]: string[] } = {
  EXCHANGE: versionsListDex,
  LENDING: versionsListLending,
  YIELD: versionsListYield,
  GENERIC: versionsListGeneric,
  BRIDGE: versionsListBridge,
  PERPETUAL: versionsListPerp,
  exchanges: versionsListDex,
  vaults: versionsListYield,
  "dex-amm": versionsListDex,
  "yield-aggregator": versionsListYield,
  lending: versionsListLending,
  generic: versionsListGeneric,
  bridge: versionsListBridge,
  perpetual: versionsListPerp,
};

export const SubgraphBaseUrl = "https://api.thegraph.com/subgraphs/name/";
export const PoolName: Record<string, string> = {
  EXCHANGE: "liquidityPool",
  LENDING: "market",
  YIELD: "vault",
  GENERIC: "pool",
  BRIDGE: "pool",
  PERPETUAL: "liquidityPool",
  exchanges: "liquidityPool",
  vaults: "vault",
  "dex-amm": "liquidityPool",
  "yield-aggregator": "vault",
  lending: "market",
  generic: "pool",
  bridge: "pool",
  perpetual: "liquidityPool",
};
export const PoolNames: Record<string, string> = {
  EXCHANGE: "liquidityPools",
  LENDING: "markets",
  YIELD: "vaults",
  GENERIC: "pools",
  BRIDGE: "pools",
  PERPETUAL: "liquidityPools",
  exchanges: "liquidityPools",
  vaults: "vaults",
  "dex-amm": "liquidityPools",
  "yield-aggregator": "vaults",
  lending: "markets",
  generic: "pools",
  bridge: "pools",
  perpetual: "liquidityPools",
};
export const ProtocolTypeEntityName: Record<string, string> = {
  EXCHANGE: "dexAmmProtocol",
  LENDING: "lendingProtocol",
  YIELD: "yieldAggregator",
  GENERIC: "protocol",
  BRIDGE: "bridgeProtocol",
  PERPETUAL: "derivPerpProtocol",
};
export const ProtocolTypeEntityNames: Record<string, string> = {
  EXCHANGE: "dexAmmProtocols",
  LENDING: "lendingProtocols",
  YIELD: "yieldAggregators",
  GENERIC: "protocols",
  BRIDGE: "bridgeProtocols",
  PERPETUAL: "derivPerpProtocols",
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
  ARBITRUM_ONE: "https://arbiscan.io/",
  AURORA: "https://aurorascan.dev/",
  AVALANCHE: "https://snowtrace.io/",
  BSC: "https://bscscan.com/",
  FANTOM: "https://ftmscan.com/",
  MAINNET: "https://etherscan.io/",
  MATIC: "https://polygonscan.com/",
  MOONRIVER: "https://moonriver.moonscan.io/",
  OPTIMISM: "https://optimistic.etherscan.io/",
  XDAI: "https://blockscout.com/xdai/mainnet/",
  CELO: "https://explorer.celo.org/",
  FUSE: "https://explorer.fuse.io/",
  HARMONY: "https://explorer.harmony.one/",
  CRONOS: "https://cronoscan.com/",
};

// negativeFieldList contains field names that can be negative
export const negativeFieldList = ["dailyNetVolumeUSD", "netVolumeUSD", "cumulativeNetVolumeUSD"];

export const dateValueKeys = ["day", "days", "hour", "hours"];
