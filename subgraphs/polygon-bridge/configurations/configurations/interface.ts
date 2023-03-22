export interface Configurations {
  getNetwork(): string;
  getProtocolName(): string;
  getProtocolSlug(): string;
  getFactoryAddress(): string;
  getRewardToken(): string;
  ignoreToken(tokenAddr: string): Boolean;
}
