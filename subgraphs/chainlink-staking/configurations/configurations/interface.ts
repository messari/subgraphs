export interface Configurations {
  getNetwork(): string;
  getProtocolId(): string;
  getProtocolName(): string;
  getProtocolSlug(): string;
  getProtocolToken(): string;
  getCommunityPool(): string;
  getOperatorPool(): string;
}
