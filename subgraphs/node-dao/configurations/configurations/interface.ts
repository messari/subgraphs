import { Address } from "@graphprotocol/graph-ts";

export interface Configurations {
  getNetwork(): string;
  getProtocolName(): string;
  getProtocolSlug(): string;
  getLSTAddress(): Address;
  getPoolV1(): Address;
}
