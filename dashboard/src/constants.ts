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

  // Array to list out the different schema versions available
  export const SchemaVersions = [Schema100, Schema110, Schema120];
}

export const latestSchemaVersion = "1.2.1";
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
  query: string;
  poolData: { [x: string]: string };
  events: string[];
  protocolFields: { [x: string]: string };
}
export const percentageFieldList = [
  "rates",
  "rewardAPR",
  "capitalEfficiency",
  "maximumLTV",
  "liquidationThreshold",
  "liquidationPenalty",
  "inputTokenWeights",
  "baseYield",
  "fee",
  "percentage",
];
export const ProtocolsToQuery: { [name: string]: { [network: string]: string } } = {
  aaveV2: {
    mainnet: "https://api.thegraph.com/subgraphs/name/messari/aave-v2-ethereum",
  },
  abracadabra: {
    mainnet: "https://api.thegraph.com/subgraphs/name/messari/abracadabra-money-ethereum",
    avalanche: "https://api.thegraph.com/subgraphs/name/messari/abracadabra-money-avalanche",
    bsc: "https://api.thegraph.com/subgraphs/name/messari/abracadabra-money-bsc",
    arbitrum: "https://api.thegraph.com/subgraphs/name/messari/abracadabra-money-arbitrum",
    fantom: "https://api.thegraph.com/subgraphs/name/messari/abracadabra-money-fantom",
  },
  balancerV2: {
    mainnet: "https://api.thegraph.com/subgraphs/name/messari/balancer-v2-ethereum",
    arbitrum: "https://api.thegraph.com/subgraphs/name/messari/balancer-v2-arbitrum",
    matic: "https://api.thegraph.com/subgraphs/name/messari/balancer-v2-polygon",
  },
  curve: {
    mainnet: "https://api.thegraph.com/subgraphs/name/messari/curve-finance-ethereum",
    gnosis: "https://api.thegraph.com/subgraphs/name/messari/curve-finance-gnosis",
    matic: "https://api.thegraph.com/subgraphs/name/messari/curve-finance-polygon",
    arbitrum: "https://api.thegraph.com/subgraphs/name/messari/curve-finance-arbitrum",
    optimism: "https://api.thegraph.com/subgraphs/name/messari/curve-finance-optimism",
    avalanche: "https://api.thegraph.com/subgraphs/name/messari/curve-finance-avalanche",
    fantom: "https://api.thegraph.com/subgraphs/name/messari/curve-finance-fantom",
  },
  ellipsis: {
    bsc: "https://api.thegraph.com/subgraphs/name/messari/ellipsis-finance-bsc",
  },
  saddleFinance: {
    mainnet: "https://api.thegraph.com/subgraphs/name/messari/saddle-finance-ethereum",
    arbitrum: "https://api.thegraph.com/subgraphs/name/messari/saddle-finance-arbitrum",
    fantom: "https://api.thegraph.com/subgraphs/name/messari/saddle-finance-fantom",
    optimism: "https://api.thegraph.com/subgraphs/name/messari/saddle-finance-optimism",
  },
  bastion: {
    aurora: "https://api.thegraph.com/subgraphs/name/messari/bastion-protocol-aurora",
  },
  aurigami: {
    aurora: "https://api.thegraph.com/subgraphs/name/messari/aurigami-aurora",
  },
  convex: {
    mainnet: "https://api.thegraph.com/subgraphs/name/messari/convex-finance-ethereum",
  },
  inverse: {
    mainnet: "https://api.thegraph.com/subgraphs/name/messari/inverse-finance-ethereum",
  },
  rari: {
    mainnet: "https://api.thegraph.com/subgraphs/name/messari/rari-vaults-ethereum",
  },
  moonwell: {
    moonriver: "https://api.thegraph.com/subgraphs/name/messari/moonwell-moonriver",
  },
  apeswap: {
    matic: "https://api.thegraph.com/subgraphs/name/messari/apeswap-polygon",
    bsc: "https://api.thegraph.com/subgraphs/name/messari/apeswap-bsc",
  },
  BENQI: {
    avalanche: "https://api.thegraph.com/subgraphs/name/messari/benqi-avalanche",
  },
  uniswapV2: {
    mainnet: "https://api.thegraph.com/subgraphs/name/messari/uniswap-v2-ethereum",
  },
  uniswapV3: {
    mainnet: "https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-ethereum",
    matic: "https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-polygon",
    optimism: "https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-optimism",
    arbitrum: "https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-arbitrum",
  },
  compound: {
    mainnet: "https://api.thegraph.com/subgraphs/name/messari/compound-ethereum",
  },
  liquity: {
    mainnet: "https://api.thegraph.com/subgraphs/name/messari/liquity-ethereum",
  },
  makerDAO: {
    mainnet: "https://api.thegraph.com/subgraphs/name/messari/makerdao-ethereum",
  },
  beltFinance: {
    bsc: "https://api.thegraph.com/subgraphs/name/messari/belt-finance-bsc",
  },
  stakeDAO: {
    mainnet: "https://api.thegraph.com/subgraphs/name/messari/stake-dao-ethereum",
  },
  tokemak: {
    mainnet: "https://api.thegraph.com/subgraphs/name/messari/tokemak-ethereum",
  },
  yearnV2: {
    mainnet: "https://api.thegraph.com/subgraphs/name/messari/yearn-v2-ethereum",
    arbitrum: "https://api.thegraph.com/subgraphs/name/messari/yearn-v2-arbitrum",
    fantom: "https://api.thegraph.com/subgraphs/name/messari/yearn-v2-fantom",
  },
};
