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
  entitiesData: string[][];
  query: string;
  poolData: string[];
  events: string[];

}
