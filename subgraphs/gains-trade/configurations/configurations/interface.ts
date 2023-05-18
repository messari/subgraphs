import { Address } from "@graphprotocol/graph-ts";

export interface Configurations {
  getNetwork(): string;
  getProtocolName(): string;
  getProtocolSlug(): string;
  getFactoryAddress(): Address;
  getDaiAddress(): Address;
  getVaultAddress(): Address;
  getStorageAddress(): Address;
  getPairInfoAddress(): Address;
  getPairStorageAddress(): Address;
}
