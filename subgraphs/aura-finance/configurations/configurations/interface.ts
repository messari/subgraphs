export interface Configurations {
  getNetwork(): string;
  getProtocolName(): string;
  getProtocolSlug(): string;
  getSchemaVersion(): string;
  getSubgraphVersion(): string;
  getMethodologyVersion(): string;
  getFactoryAddress(): string;
  getRewardToken(): string;
}
