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
export interface Schema {
  entities: string[];
  entitiesData: {[x: string]: {[x:string]: string}};
  query: string;
  poolData: {[x: string]: string};
  events: string[];
  protocolFields: {[x: string]: string};
}
export const ProtocolsToQuery: {[name: string]: {URL: string, deploymentId: string}} = {
  "Aave-v2": {
    URL: "https://api.studio.thegraph.com/query/22815/aave-v2-test/v1.1.30",
    deploymentId: "Qmc9dA8vQEkmKcHFPmuTLLCRp38DEcN9dFFgCNaMk8ykJz"
  },
  Abracadabra: {
    URL: "https://api.thegraph.com/subgraphs/name/tannishmango/abracadabra-mainnet",
    deploymentId: "QmWgRKYwsCrKuFUcHGpPn43nT7qBFt8xezBoiyUgqf2oPY"
  },
  compound: {
    URL: "https://api.studio.thegraph.com/query/23909/compound-v2/1.5.2",
    deploymentId: ""
  },
  // balancer: {
  //   URL: "https://api.studio.thegraph.com/query/24054/balancer-v2/0.0.56",
  //   deploymentId: ""
  // }
}
